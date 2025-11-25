$(document).ready(function() {
    // Variables globales
    let currentProject = null;
    let currentTasks = [];
    let currentFilter = 'all';

    // Inicializar la página
    init();

    function init() {
        loadUserInfo();
        loadProjectDetails();
        setupEventListeners();
        setupDocumentoModalHandlers();
    }

    function setupEventListeners() {
        // Logout
        $('#logoutBtn').click(function(e) {
            e.preventDefault();
            logout();
        });

        // Volver atrás
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function(e){
                e.preventDefault();
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '/dashboard/trabajador';
                }
            });
        }

        // Filtros de tareas
        $('.filter-btn').click(function() {
            $('.filter-btn').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            filterTasks();
        });

        // Cambio de estado de tareas
        $(document).on('click', '.task-status', function() {
            const taskId = $(this).data('task-id');
            const currentStatus = $(this).data('current-status');
            showStatusChangeModal(taskId, currentStatus);
        });

        // Ajuste de offset según barra worker-topbar
        const main = document.querySelector('.main-content');
        const workerBar = document.querySelector('.worker-topbar');
        const applyOffset = () => {
            const h = workerBar ? workerBar.offsetHeight : 64;
            if (main) main.style.paddingTop = (h + 20) + 'px';
        };
        applyOffset();
        window.addEventListener('resize', applyOffset);

        // Toggle del menú anterior solo si existe la vieja topbar
        const topbar = document.querySelector('.topbar');
        const toggleBtn = document.querySelector('.topbar .menu-toggle');
        const topbarMenuLinks = document.querySelectorAll('.topbar .sidebar-menu a');

        if (toggleBtn && topbar) {
            const menu = topbar.querySelector('.sidebar-menu');
            const hasAnime = typeof window !== 'undefined' && window.anime;

            const openMenu = () => {
                topbar.classList.add('open');
                const icon = toggleBtn.querySelector('i');
                if (icon) { icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up'); }
                if (hasAnime && menu) {
                    window.anime({
                        targets: menu,
                        opacity: [0, 1],
                        translateY: [-12, 0],
                        duration: 250,
                        easing: 'easeOutQuad'
                    });
                }
            };

            const closeMenu = () => {
                const icon = toggleBtn.querySelector('i');
                if (hasAnime && menu) {
                    window.anime({
                        targets: menu,
                        opacity: [1, 0],
                        translateY: [0, -12],
                        duration: 200,
                        easing: 'easeInQuad',
                        complete: () => {
                            topbar.classList.remove('open');
                            if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
                        }
                    });
                } else {
                    topbar.classList.remove('open');
                    if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
                }
            };

            toggleBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (topbar.classList.contains('open')) { closeMenu(); } else { openMenu(); }
            });

            // Cerrar si se hace click fuera
            document.addEventListener('click', function (e) {
                if (!topbar.contains(e.target)) { closeMenu(); }
            });

            // Cerrar al navegar por alguna opción
            topbarMenuLinks.forEach((link) => {
                link.addEventListener('click', () => { closeMenu(); });
            });
        }
    }

    function setupDocumentoModalHandlers(){
        $(document).on('click', '#btnAbrirDocumentoModal', function(){
            $('#documentoModal').addClass('show').css('display','block');
        });
        const cerrar = () => { $('#documentoModal').removeClass('show').css('display','none'); };
        $(document).on('click', '#closeDocumentoModal', cerrar);
        $(document).on('click', '#cancelarDocumentoModal', cerrar);
        // cerrar al click fuera del contenido
        $(window).on('click', function(e){
            const modal = document.getElementById('documentoModal');
            if (e.target === modal) { cerrar(); }
        });
        // Cerrar modal tras subida exitosa: hookeamos evento custom
        document.addEventListener('documento:subido', cerrar);
    }

    function loadUserInfo() {
        $.get('/api/auth/me')
            .done(function(response) {
                if (response.success && response.user) {
                    const $avatar = $('#profileAvatar');
                    const url = response.user.avatar_url;
                    if ($avatar.length) {
                        if (url) {
                            $avatar.css({
                                backgroundImage: `url('${url}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }).text('');
                        } else {
                            const nombre = response.user.nombre || response.user.email || 'U';
                            const initial = (nombre || 'U').trim().charAt(0).toUpperCase();
                            $avatar.css({ backgroundImage: '' }).text(initial);
                        }
                    }
                }
            })
            .fail(function() {
                console.error('Error al cargar información del usuario');
            });
    }

    async function loadProjectDetails() {
        try {
            // Permitir abrir la página con ?id=PROYECTO_ID
            const params = new URLSearchParams(window.location.search);
            const paramId = params.get('id');
            let proyectoId = paramId ? parseInt(paramId, 10) : null;

            // Si no viene ID, usar el proyecto asignado por defecto
            if (!proyectoId || Number.isNaN(proyectoId)) {
                const projectResponse = await $.get('/api/trabajador/proyecto');
                if (!projectResponse.success || !projectResponse.proyecto) {
                    showError('No tienes un proyecto asignado');
                    return;
                }
                currentProject = projectResponse.proyecto;
                proyectoId = currentProject.id;
            }
            
            // Obtener los detalles completos del proyecto seleccionado
            const detailResponse = await $.get(`/api/trabajador/proyecto/${proyectoId}`);
            
            if (detailResponse.success) {
                // Combinar la información
                currentProject = { ...(currentProject || {}), ...detailResponse.proyecto };
                currentProject.id = proyectoId;
                currentProject.equipo = detailResponse.equipo;
                currentProject.tareas = detailResponse.tareas || [];
                
                // Cargar en memoria las tareas para la página
                currentTasks = currentProject.tareas;
                
                // Render de la UI
                displayProjectInfo(currentProject);
                loadTeammates(currentProject.id);
                displayTasks(currentTasks);
                updateTaskStats();

                // Documentos: preparar formulario y cargar lista
                setupDocumentosForm();
                loadDocumentos();
            } else {
                showError('Error al cargar los detalles del proyecto');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de conexión al cargar el proyecto');
        }
    }

    function displayProjectInfo(proyecto) {
        $('#projectName').text(proyecto.nombre);
        const desc = (proyecto.descripcion || '').trim();
        if (desc) {
            $('#projectDescription').text(desc).show();
        } else {
            $('#projectDescription').text('').hide();
        }
        
        // Avatar con iniciales del proyecto
        const initials = getInitials(proyecto.nombre || 'PR');
        $('#projectAvatar').text(initials);
        
        // Fechas del proyecto
        const fechaInicio = proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toLocaleDateString('es-ES') : '—';
        const fechaFin = proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toLocaleDateString('es-ES') : '—';
        $('#projectStartDate').text(fechaInicio);
        $('#projectEndDate').text(fechaFin);
        
        // Líder y estado del proyecto
        $('#projectLeader').text(proyecto.jefe_nombre || 'Sin asignar');
        $('#projectStatus').text(formatProjectStatus(proyecto.estado));
        // Variantes de estado para badge
        const statusClassMap = {
            'en_ejecucion': 'status-en_ejecucion',
            'en_pausa': 'status-en_pausa',
            'finalizado': 'status-finalizado'
        };
        const $statusBadge = $('#projectStatusBadge');
        $statusBadge.removeClass('status-en_ejecucion status-en_pausa status-finalizado');
        if (proyecto.estado && statusClassMap[proyecto.estado]) {
            $statusBadge.addClass(statusClassMap[proyecto.estado]);
        }
        
        // Progreso del proyecto (con respaldo si el backend no lo envía)
        let progress = (proyecto.porcentaje_avance !== undefined && proyecto.porcentaje_avance !== null)
            ? Number(proyecto.porcentaje_avance)
            : 0;
        if ((!Number.isFinite(progress) || progress === 0) && Array.isArray((currentProject && currentProject.tareas)) && currentProject.tareas.length > 0) {
            const total = currentProject.tareas.length;
            const completadas = currentProject.tareas.filter(t => t.estado === 'completada').length;
            progress = Math.round((completadas / total) * 100);
        }
        $('#progressPercentage').text(`${progress}%`);
        updateProgressCircle(progress);
    }

    // Estado para animación del donut
    let progressAnimState = { deg: 0 };

    function updateProgressCircle(percentage) {
        const $circle = $('.progress-circle');
        const $text = $('#progressPercentage');
        const toDeg = (percentage / 100) * 360;
        const hasAnime = typeof window !== 'undefined' && window.anime;

        if (!$circle.length) return;

        // Crear/asegurar capa de brillo rotatorio
        let $glow = $circle.find('.glow-sweep');
        if (!$glow.length) {
            $circle.append('<div class="glow-sweep"></div>');
            $glow = $circle.find('.glow-sweep');
        }
        // Crear segundo barrido más notorio
        let $glow2 = $circle.find('.glow-sweep2');
        if (!$glow2.length) {
            $circle.append('<div class="glow-sweep2"></div>');
            $glow2 = $circle.find('.glow-sweep2');
        }
        // Crear halo exterior
        let $halo = $circle.find('.halo-ring');
        if (!$halo.length) {
            $circle.append('<div class="halo-ring"></div>');
            $halo = $circle.find('.halo-ring');
        }

        if (!hasAnime) {
            // Fallback sin Anime.js
            $circle.css('background', `conic-gradient(#4CAF50 ${toDeg}deg, #e9ecef ${toDeg}deg)`);
            if ($text.length) $text.text(`${Math.round(percentage)}%`);
            return;
        }

        // Animar el barrido del donut desde el estado actual hasta el objetivo
        window.anime({
            targets: progressAnimState,
            deg: toDeg,
            duration: 1200,
            easing: 'easeInOutCubic',
            update: () => {
                const v = Math.max(0, Math.min(360, progressAnimState.deg));
                $circle.css('background', `conic-gradient(#4CAF50 ${v}deg, #e9ecef ${v}deg)`);
            }
        });

        // Contador del porcentaje con efecto de subida
        if ($text.length) {
            const start = parseInt(($text.text() || '0').replace('%',''), 10) || 0;
            window.anime({
                targets: { val: start },
                val: Math.round(percentage),
                duration: 900,
                easing: 'easeOutCubic',
                update: (anim) => {
                    const v = Math.round(anim.animations[0].currentValue);
                    $text.text(`${v}%`);
                }
            });
        }

        // Realce sutil: pulsación y brillo para darle presencia
        window.anime({
            targets: $circle[0],
            scale: [0.97, 1],
            duration: 600,
            easing: 'easeOutBack'
        });

        // Brillo rotatorio continuo (evitar múltiples inicializaciones)
        if ($glow.length && !$glow[0]._glowSpinInit) {
            window.anime({
                targets: $glow[0],
                rotate: '1turn',
                duration: 4000,
                easing: 'linear',
                loop: true
            });
            $glow[0]._glowSpinInit = true;
        }
        // Segundo barrido con mayor velocidad para destacar
        if ($glow2.length && !$glow2[0]._glowSpinInit2) {
            window.anime({
                targets: $glow2[0],
                rotate: '1turn',
                duration: Math.max(2200, 4000 - (percentage * 15)), // más rápido con más avance
                easing: 'linear',
                loop: true
            });
            $glow2[0]._glowSpinInit2 = true;
        }
        // Halo con pulso suave continuo
        if ($halo.length && !$halo[0]._haloPulseInit) {
            window.anime({
                targets: $halo[0],
                scale: [1, 1.05, 1],
                opacity: [0.45, 0.65, 0.45],
                duration: 1600,
                easing: 'easeInOutSine',
                loop: true
            });
            $halo[0]._haloPulseInit = true;
        }

        // Si está al 100%, celebramos con un pulso extra
        if (percentage >= 100) {
            window.anime({
                targets: $circle[0],
                scale: [1, 1.08, 1],
                duration: 800,
                easing: 'easeInOutSine'
            });
            // Burst de brillo breve en el halo para celebrarlo
            if ($halo.length) {
                window.anime({
                    targets: $halo[0],
                    opacity: [0.6, 0.85, 0.6],
                    duration: 900,
                    easing: 'easeInOutQuad'
                });
            }
        }
    }

    function loadTeammates(projectId) {
        if (!currentProject || !currentProject.equipo) {
            $('#teammatesContainer').html('<div class="loading-message">No hay compañeros asignados</div>');
            return;
        }
        
        displayTeammates(currentProject.equipo);
    }

    function displayTeammates(teammates) {
        if (!teammates || teammates.length === 0) {
            $('#teammatesContainer').html('<div class="loading-message">No hay compañeros asignados a este proyecto</div>');
            return;
        }

        let html = '';
        teammates.forEach(teammate => {
            const initials = getInitials(teammate.nombre);
            html += `
                <div class="teammate-card">
                    <div class="teammate-avatar">${initials}</div>
                    <div class="teammate-info">
                        <h4>${teammate.nombre}</h4>
                        <p>${teammate.email}</p>
                    </div>
                </div>
            `;
        });

        $('#teammatesContainer').html(html);
    }

    function loadProjectTasks(proyectoId) {
        $.get(`/api/tareas/proyecto/${proyectoId}`)
            .done(function(response) {
                if (response.success) {
                    currentTasks = response.tareas || [];
                    displayTasks(currentTasks);
                    updateTaskStats(currentTasks);
                } else {
                    $('#tasksContainer').html('<div class="loading-message">No hay tareas asignadas</div>');
                }
            })
            .fail(function() {
                $('#tasksContainer').html('<div class="loading-message">Error al cargar las tareas</div>');
            });
    }

    function displayTasks(tasks) {
        if (!tasks || tasks.length === 0) {
            $('#tasksContainer').html('<div class="loading-message">No hay tareas asignadas</div>');
            return;
        }

        // Ordenar: primero por estado (pendiente, en_progreso, completada), luego por prioridad (alta, media, baja)
        const statusOrder = { 'pendiente': 0, 'en_progreso': 1, 'completada': 2 };
        const priorityOrder = { 'alta': 0, 'media': 1, 'baja': 2 };
        const sorted = [...tasks].sort((a, b) => {
            const sA = statusOrder[a.estado] ?? 999;
            const sB = statusOrder[b.estado] ?? 999;
            if (sA !== sB) return sA - sB;
            const pA = priorityOrder[(a.prioridad || 'media')] ?? 1;
            const pB = priorityOrder[(b.prioridad || 'media')] ?? 1;
            return pA - pB;
        });

        let html = '';
        sorted.forEach(task => {
            const statusText = getStatusText(task.estado);
            const priority = task.prioridad || 'media';
            const priorityText = getPriorityText(priority);
            
            html += `
                <div class="task-item ${task.estado}" data-status="${task.estado}">
                    <div class="task-header">
                        <div>
                            <div class="task-title">${task.titulo}</div>
                            <div class="task-description">${task.descripcion || 'Sin descripción'}</div>
                        </div>
                    </div>
                    <div class="task-meta">
                        <div class="task-priority ${priority}">${priorityText}</div>
                        <button class="task-status ${task.estado}" 
                                data-task-id="${task.id}" 
                                data-current-status="${task.estado}">
                            ${statusText}
                        </button>
                    </div>
                </div>
            `;
        });

        $('#tasksContainer').html(html);
    }

    function updateTaskStats() {
        const tasks = Array.isArray(currentTasks) ? currentTasks : [];

        const updateCounters = (total, pending, inProgress, completed) => {
            $('#totalTasks').text(total);
            $('#pendingTasks').text(pending);
            $('#inProgressTasks').text(inProgress);
            $('#completedTasks').text(completed);
        };

        if (!tasks.length) {
            updateCounters(0, 0, 0, 0);
            // Actualizar mini chart si existe
            const ids = [
                ['barAll','countAll',0],
                ['barPending','countPending',0],
                ['barProgress','countProgress',0],
                ['barCompleted','countCompleted',0]
            ];
            ids.forEach(([barId, countId, value]) => {
                const bar = document.getElementById(barId);
                const count = document.getElementById(countId);
                if (bar) {
                    bar.style.setProperty('--target-height', '0%');
                    bar.style.animation = 'none';
                    void bar.offsetHeight; // reflow
                    bar.style.animation = '';
                    bar.style.height = '0%';
                }
                if (count) count.textContent = value;
            });
            return;
        }
        
        const total = tasks.length;
        const pending = tasks.filter(t => t.estado === 'pendiente').length;
        const inProgress = tasks.filter(t => t.estado === 'en_progreso').length;
        const completed = tasks.filter(t => t.estado === 'completada').length;

        updateCounters(total, pending, inProgress, completed);

        // Actualizar mini chart de barras
        const maxValue = Math.max(total, pending, inProgress, completed, 1);
        const toPercent = v => Math.round((v / maxValue) * 100);
        const setBar = (id, value, countId) => {
            const bar = document.getElementById(id);
            const count = document.getElementById(countId);
            if (!bar) return;
            const pct = toPercent(value);
            bar.style.setProperty('--target-height', pct + '%');
            // Reiniciar animación
            bar.style.animation = 'none';
            void bar.offsetHeight; // reflow
            bar.style.animation = '';
            bar.style.height = pct + '%';
            if (count) count.textContent = value;
        };

        setBar('barAll', total, 'countAll');
        setBar('barPending', pending, 'countPending');
        setBar('barProgress', inProgress, 'countProgress');
        setBar('barCompleted', completed, 'countCompleted');
    }

    function filterTasks() {
        let filteredTasks = currentTasks;
        
        if (currentFilter !== 'all') {
            filteredTasks = currentTasks.filter(task => task.estado === currentFilter);
        }
        
        displayTasks(filteredTasks);
    }

    function showStatusChangeModal(taskId, currentStatus) {
        const statusOptions = {
            'pendiente': 'Por Hacer',
            'en_progreso': 'En Progreso',
            'completada': 'Completada'
        };

        let optionsHtml = '';
        Object.keys(statusOptions).forEach(status => {
            const selected = status === currentStatus ? 'selected' : '';
            optionsHtml += `<option value="${status}" ${selected}>${statusOptions[status]}</option>`;
        });

        Swal.fire({
            title: 'Cambiar Estado de la Tarea',
            html: `
                <div style="text-align: left; margin: 20px 0;">
                    <label for="newStatus" style="display: block; margin-bottom: 10px; font-weight: 500;">
                        Selecciona el nuevo estado:
                    </label>
                    <select id="newStatus" class="swal2-input" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                        ${optionsHtml}
                    </select>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Cambiar Estado',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4CAF50',
            cancelButtonColor: '#6c757d',
            preConfirm: () => {
                const newStatus = document.getElementById('newStatus').value;
                if (!newStatus) {
                    Swal.showValidationMessage('Debes seleccionar un estado');
                    return false;
                }
                return newStatus;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                updateTaskStatus(taskId, result.value);
            }
        });
    }

    function updateTaskStatus(taskId, newStatus) {
        $.ajax({
            url: `/api/trabajador/tareas/${taskId}/estado`,
            method: 'PUT',
            data: { estado: newStatus },
            success: function(response) {
                if (response.success) {
                    showSuccess('Estado de la tarea actualizado correctamente');
                    // Actualizar la tarea en el array local
                    const taskIndex = currentTasks.findIndex(t => t.id == taskId);
                    if (taskIndex !== -1) {
                        currentTasks[taskIndex].estado = newStatus;
                        displayTasks(currentTasks);
                        updateTaskStats();
                    }
                } else {
                    showError(response.message || 'Error al actualizar el estado de la tarea');
                }
            },
            error: function(xhr) {
                console.error('Error al actualizar estado:', xhr);
                showError('Error al actualizar el estado de la tarea');
            }
        });
    }

    function getStatusText(status) {
        const statusMap = {
            'pendiente': 'Por Hacer',
            'en_progreso': 'En Progreso',
            'completada': 'Completada'
        };
        return statusMap[status] || status;
    }

    function getPriorityText(priority) {
        const priorityMap = {
            'alta': 'Alta',
            'media': 'Media',
            'baja': 'Baja'
        };
        return priorityMap[priority] || priority;
    }

    function formatProjectStatus(status) {
        const map = {
            'en_ejecucion': 'En ejecución',
            'en_pausa': 'En pausa',
            'finalizado': 'Finalizado'
        };
        return map[status] || (status || '—');
    }

    function getInitials(name) {
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    // ===== Documentos: UI y acciones =====
    function setupDocumentosForm(){
        const $form = $('#formSubirDocumento');
        if (!$form.length) return;
        $form.off('submit').on('submit', async function(e){
            e.preventDefault();
            if (!currentProject || !currentProject.id){
                showError('Proyecto no identificado');
                return;
            }
            const fileInput = document.getElementById('archivoDocumento');
            if (!fileInput || !fileInput.files || fileInput.files.length === 0){
                showError('Selecciona un archivo');
                return;
            }
            const formData = new FormData();
            formData.append('archivo', fileInput.files[0]);
            const nombre = document.getElementById('nombreDocumento')?.value?.trim();
            if (nombre) formData.append('nombre', nombre);
            const venc = document.getElementById('fechaVencimiento')?.value;
            if (venc) formData.append('fecha_vencimiento', venc);
            try {
                const res = await fetch(`/api/proyectos/${currentProject.id}/documentos`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok && data.success){
                    showSuccess('Documento subido');
                    // limpiar
                    $form[0].reset();
                    loadDocumentos();
                    document.dispatchEvent(new Event('documento:subido'));
                } else {
                    throw new Error(data.message || 'No se pudo subir el documento');
                }
            } catch(err){
                console.error(err);
                showError(err.message || 'Error al subir documento');
            }
        });
    }

    async function loadDocumentos(){
        const tbody = document.querySelector('#tablaDocumentos tbody');
        if (!tbody || !currentProject) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
        try {
            const res = await fetch(`/api/proyectos/${currentProject.id}/documentos`);
            const data = await res.json();
            if (res.ok && data.success){
                renderDocumentos(data.documentos || []);
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No se pudieron cargar los documentos</td></tr>';
            }
        } catch(err){
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Error al cargar documentos</td></tr>';
        }
    }

    function renderDocumentos(docs){
        const tbody = document.querySelector('#tablaDocumentos tbody');
        if (!tbody) return;
        if (!docs || docs.length === 0){
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin documentos</td></tr>';
            return;
        }
        const rows = docs.map(doc => {
            const fechaSub = doc.fecha_subida ? new Date(doc.fecha_subida).toLocaleString('es-ES') : '—';
            const venc = doc.fecha_vencimiento ? new Date(doc.fecha_vencimiento) : null;
            const vencHtml = venc ? getDueBadgeHtml(venc) : '<span class="badge">—</span>';
            const nombre = doc.nombre_archivo || 'archivo';
            return `
                <tr>
                    <td>${nombre}</td>
                    <td>${doc.subido_por || '—'}</td>
                    <td>${fechaSub}</td>
                    <td>${vencHtml}</td>
                    <td>
                        <a class="btn btn-success btn-sm" href="/api/documentos/${doc.id}/download" title="Descargar"><i class="fas fa-download"></i></a>
                        <button class="btn btn-danger btn-sm" data-doc-id="${doc.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
        tbody.innerHTML = rows;
        // bind delete
        $('#tablaDocumentos button[data-doc-id]').off('click').on('click', function(){
            const id = this.getAttribute('data-doc-id');
            confirmarEliminarDocumento(id);
        });
    }

    function confirmarEliminarDocumento(id){
        Swal.fire({
            title: 'Eliminar documento',
            text: 'Esta acción eliminará el archivo definitivamente. ¿Continuar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74a3b',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar'
        }).then(async (r)=>{
            if (!r.isConfirmed) return;
            try{
                const res = await fetch(`/api/documentos/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok && data.success){
                    showSuccess('Documento eliminado');
                    loadDocumentos();
                } else {
                    throw new Error(data.message || 'No se pudo eliminar');
                }
            } catch(err){
                console.error(err);
                showError(err.message || 'Error al eliminar');
            }
        });
    }

    function getDueBadgeHtml(dateObj){
        const today = new Date();
        const diffMs = dateObj.setHours(0,0,0,0) - today.setHours(0,0,0,0);
        const diffDays = Math.ceil(diffMs / (1000*60*60*24));
        let cls = 'due-ok';
        let label = dateObj.toLocaleDateString('es-ES');
        if (diffDays < 0){
            cls = 'due-overdue';
        } else if (diffDays <= 7){
            cls = 'due-soon';
        }
        return `<span class="due-badge ${cls}">${label}</span>`;
    }

    function logout() {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro de que quieres cerrar sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4CAF50',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch('/api/auth/logout', { method: 'POST' })
                    .then(() => { window.location.href = '/login'; })
                    .catch(() => { window.location.href = '/login'; });
            }
        });
    }

    function showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: message,
            confirmButtonColor: '#4CAF50',
            timer: 3000,
            timerProgressBar: true
        });
    }

    function showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonColor: '#dc3545'
        });
    }
});
