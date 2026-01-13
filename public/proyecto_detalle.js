 
$(document).ready(function() {
    // Variables globales
    let currentProject = null;
    let currentTasks = [];
    let currentFilter = 'all';
    let currentUser = null;

    // Inicializar la página
    init();

    function escapeHtml(s){
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }

    function init() {
        loadUserInfo();
        setupProfileModal();
        loadProjectDetails();
        setupEventListeners();
        setupDocumentoModalHandlers();
        updateTopCorreoBadge();
        setInterval(updateTopCorreoBadge, 30000);
        setupAutoLogoutIdle();
    }

    function setupAutoLogoutIdle(){
        const LIMIT = 5*60*1000;
        const WARNING = 5*1000;
        let idleTimer = null;
        let warnTimer = null;
        let tickInt = null;
        let open = false;
        function clearAll(){ if (idleTimer) clearTimeout(idleTimer); if (warnTimer) clearTimeout(warnTimer); if (tickInt) clearInterval(tickInt); idleTimer=null; warnTimer=null; tickInt=null; }
        function startTimers(){
            clearAll();
            warnTimer = setTimeout(()=>{
                open = true;
                let left = 5;
                if (window.Swal){
                    window.Swal.fire({ title:'Inactividad', html:`Cierre de sesión en <b id="idleCountdown">5</b>s`, allowOutsideClick:false, allowEscapeKey:false, showConfirmButton:false });
                    const el = document.getElementById('idleCountdown');
                    tickInt = setInterval(()=>{ left--; if (el) el.textContent = String(left); if (left<=0){ clearInterval(tickInt); } },1000);
                }
            }, LIMIT - WARNING);
            idleTimer = setTimeout(()=>{ fetch('/api/auth/logout', { method:'POST', credentials:'include', keepalive:true }).finally(()=>{ window.location.href='/login?error=inactive'; }); }, LIMIT);
        }
        function reset(){
            if (open && window.Swal){ try{ window.Swal.close(); }catch(_){ } }
            open = false;
            startTimers();
        }
        ['mousemove','mousedown','keydown','scroll','touchstart'].forEach(ev=> document.addEventListener(ev, reset, { passive:true }));
        document.addEventListener('visibilitychange', ()=>{ if (!document.hidden) reset(); });
        startTimers();
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

        // Mobile Menu Toggle (Updated for new topbar)
        const menuToggle = document.getElementById('menuToggle');
        const topbar = document.querySelector('.topbar');
        
        if (menuToggle && topbar) {
            menuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                topbar.classList.toggle('open');
            });

            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!menuToggle.contains(e.target) && !topbar.contains(e.target)) {
                    topbar.classList.remove('open');
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

        const btnSolicitar = document.getElementById('btnSolicitarEstadoTarea');
        if (btnSolicitar) {
            btnSolicitar.addEventListener('click', async function(){
                if (!currentProject || !currentProject.id) { return; }
                const tareas = Array.isArray(currentTasks) ? currentTasks : [];
                if (tareas.length === 0) { Swal.fire({ icon:'info', title:'Sin tareas', text:'No hay tareas para solicitar cambio de estado.' }); return; }
                const estados = { pendiente:'Por Hacer', en_progreso:'En Progreso', revisando:'Revisando', completada:'Completada' };
                let selectedFiles = [];
                const html = `
                    <div class="sw-request">
                        <div class="sw-header"><i class="fas fa-clipboard-check"></i> Selecciona tarea y estado</div>
                        <div class="form-row" style="display:flex;flex-direction:column;align-items:center;text-align:center;">
                            <label style="margin-bottom:8px;font-weight:600;">Tarea</label>
                            <select id="swTareaSelect" class="form-control" style="width:100%;max-width:560px">
                                ${tareas.map(t=>`<option value="${t.id}">${(t.titulo||'Tarea')} (${estados[t.estado]||t.estado})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-row" style="display:flex;flex-direction:column;align-items:center;text-align:center;">
                            <label style="margin-bottom:8px;font-weight:600;">Estado</label>
                            <select id="swTareaEstado" class="form-control" style="width:100%;max-width:560px">
                                ${Object.entries(estados).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-row" style="display:flex;flex-direction:column;align-items:center;text-align:center;">
                            <label style="margin-bottom:8px;font-weight:600;">Mensaje</label>
                            <textarea id="swMsgEstado" class="form-control" rows="4" placeholder="Justificación (opcional)" style="width:100%;max-width:560px"></textarea>
                        </div>
                        <div class="form-row" style="display:flex;flex-direction:column;align-items:center;text-align:center;">
                            <label style="margin-bottom:8px;font-weight:600;">Adjuntar documentos</label>
                            <div id="swFilesList" class="muted" style="margin-bottom:8px;color:#6b7280;width:100%;max-width:560px">No hay archivos seleccionados</div>
                            <div id="swDropZone" style="width:100%;max-width:560px;border:2px dashed #c7cbe0;border-radius:10px;padding:14px;text-align:center;color:#4b5563;cursor:pointer">
                                Arrastra aquí los archivos o haz clic para buscar
                            </div>
                            <input id="swFilesInput" type="file" multiple style="display:none" />
                            <small class="form-hint" style="color:#6b7280;margin-top:8px;">Hasta 10 archivos; formatos comunes (PDF, imágenes, Word, Excel)</small>
                        </div>
                    </div>`;
                const res = await Swal.fire({ title: 'Solicitar estado de tarea', width: 720, html, showCancelButton: true, confirmButtonText: 'Enviar solicitud', cancelButtonText: 'Cancelar', customClass: { popup: 'sw-popup', confirmButton: 'btn btn-primary', cancelButton: 'btn btn-secondary' }, focusConfirm: false, didOpen: () => {
                    const drop = document.getElementById('swDropZone');
                    const input = document.getElementById('swFilesInput');
                    const list = document.getElementById('swFilesList');
                    const updateList = () => {
                        if (!selectedFiles.length) { list.textContent = 'No hay archivos seleccionados'; return; }
                        list.innerHTML = selectedFiles.map(f => `${f.name} (${Math.round((f.size||0)/1024)} KB)`).join('<br>');
                    };
                    const addFiles = (files) => {
                        const arr = Array.from(files || []);
                        selectedFiles = [...selectedFiles, ...arr].slice(0, 10);
                        updateList();
                    };
                    drop.style.width = '100%';
                    drop.addEventListener('click', () => input.click());
                    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.background = '#eef2f7'; });
                    drop.addEventListener('dragleave', () => { drop.style.background = ''; });
                    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.style.background = ''; addFiles(e.dataTransfer.files); });
                    input.addEventListener('change', (e) => addFiles(e.target.files));
                }, preConfirm: () => {
                    const tareaSel = document.getElementById('swTareaSelect');
                    const estadoSel = document.getElementById('swTareaEstado');
                    if (!tareaSel || !tareaSel.value) { Swal.showValidationMessage('Debes seleccionar una tarea'); return false; }
                    if (!estadoSel || !estadoSel.value) { Swal.showValidationMessage('Debes seleccionar un estado'); return false; }
                    return { tareaId: tareaSel.value, estado: estadoSel.value, mensaje: (document.getElementById('swMsgEstado')?.value||'').trim(), files: selectedFiles };
                }});
                if (!res.isConfirmed) return;
                const tareaId = res.value.tareaId;
                const estadoSolicitado = res.value.estado;
                const msg = res.value.mensaje || '';
                try {
                    const jefeEmail = currentProject.jefe_email || '';
                    if (!jefeEmail) { throw new Error('No se encontró correo del líder'); }
                    const tarea = tareas.find(t=>String(t.id)===String(tareaId));
                    const fd = new FormData();
                    fd.append('to_emails', jefeEmail);
                    const asunto = `Solicitud de estado de tarea: ${(tarea?.titulo||'Tarea')} · ${currentProject.nombre}`;
                    const estadosTxt = estados;
                    const actualTxt = estadosTxt[tarea?.estado] || tarea?.estado || '';
                    const solicitadoTxt = estadosTxt[estadoSolicitado] || estadoSolicitado;
                    const safeMsg = escapeHtml(msg).replace(/\n/g,'<br/>');
                    const cuerpo = `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#f8fafc;">
  <div style="margin-bottom:6px;">
    <span style="background:#eef2ff;border-radius:9999px;padding:6px 12px;color:#3730a3;font-weight:600;font-size:12px;display:inline-block;">Solicitud de estado de tarea</span>
  </div>
  <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 12px 0;">
    <tr>
      <td style="width:170px;color:#6b7280;padding:4px 8px;">Proyecto</td>
      <td style="padding:4px 8px;font-weight:600;color:#111827;">${currentProject.nombre}</td>
    </tr>
    <tr>
      <td style="width:170px;color:#6b7280;padding:4px 8px;">Tarea</td>
      <td style="padding:4px 8px;font-weight:600;color:#111827;">${tarea?.titulo||''}</td>
    </tr>
    <tr>
      <td style="width:170px;color:#6b7280;padding:4px 8px;">Estado actual</td>
      <td style="padding:4px 8px;"><span style="background:#e5e7eb;border-radius:6px;padding:3px 8px;font-weight:600;color:#374151;display:inline-block;">${actualTxt}</span></td>
    </tr>
    <tr>
      <td style="width:170px;color:#6b7280;padding:4px 8px;">Estado solicitado</td>
      <td style="padding:4px 8px;"><span style="background:#dbeafe;border-radius:6px;padding:3px 8px;font-weight:700;color:#1e3a8a;display:inline-block;">${solicitadoTxt}</span></td>
    </tr>
    <tr>
      <td style="width:170px;color:#6b7280;padding:4px 8px;vertical-align:top;">Descripción</td>
      <td style="padding:4px 8px;line-height:1.5;color:#111827;">${safeMsg || '—'}</td>
    </tr>
  </table>
  <div style="color:#6b7280;font-size:12px;">Solicitado por ${currentUser?.nombre||currentUser?.email||''} · ${new Date().toLocaleString('es-ES')}</div>
</div>
[[REQUEST_TASK_STATUS:${currentProject.id}|${tareaId}|${estadoSolicitado}|${currentUser?.email||''}]]`;
                    fd.append('asunto', asunto);
                    fd.append('cuerpo', cuerpo);
                    const files = Array.isArray(res.value?.files) ? res.value.files : [];
                    files.slice(0,10).forEach(f => { try { fd.append('adjuntos', f, f.name); } catch(_){ fd.append('adjuntos', f); } });
                    const r = await fetch('/api/correos', { method: 'POST', body: fd });
                    const d = await r.json().catch(()=>({}));
                    if (!r.ok || !d.ok) { throw new Error('No se pudo enviar la solicitud'); }
                    Swal.fire({ icon: 'success', title: 'Solicitud enviada', text: 'El líder recibirá tu solicitud por correo.', timer: 1800, showConfirmButton: false });
                } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Error', text: String(err.message||err) });
                }
            });
        }

        // Estado de tareas no clickeable (visual únicamente)

        // Ajuste de offset según barra topbar
        const main = document.querySelector('.main-content');
        const currentTopbar = document.querySelector('.topbar');
        const applyOffset = () => {
            const h = currentTopbar ? currentTopbar.offsetHeight : 64;
            if (main) main.style.paddingTop = (h + 20) + 'px';
        };
        applyOffset();
        window.addEventListener('resize', applyOffset);
    }

    function setupProfileModal() {
        const perfilModal = document.getElementById('perfilModal');
        const closePerfilModal = document.getElementById('closePerfilModal');
        const cancelarPerfil = document.getElementById('cancelarPerfil');
        const profileBtn = document.getElementById('profileBtn');
        const perfilNombre = document.getElementById('perfilNombre');
        const perfilEmail = document.getElementById('perfilEmail');
        const perfilRol = document.getElementById('perfilRol');
        const perfilAvatarPreview = document.getElementById('perfilAvatarPreview');
        const perfilFotoInput = document.getElementById('perfilFoto');
        const perfilForm = document.getElementById('perfilForm');
        let selectedAvatarFile = null;

        if (perfilNombre){
            perfilNombre.addEventListener('input', function(){
                const v = this.value || '';
                const filtered = v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
                if (filtered !== v) this.value = filtered;
            });
            perfilNombre.addEventListener('blur', function(){
                const v = this.value || '';
                const filtered = v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
                if (filtered !== v) this.value = filtered;
            });
        }

        const openPerfil = () => {
            if (!perfilModal) return;
            perfilModal.style.display = 'block';
            document.body.classList.add('modal-open');
            if (currentUser) {
                if (perfilNombre) perfilNombre.value = currentUser.nombre || '';
                if (perfilEmail) perfilEmail.value = currentUser.email || '';
                if (perfilRol) perfilRol.value = currentUser.rol || '';
                const url = currentUser.avatar_url;
                if (perfilAvatarPreview) {
                    if (url) {
                        perfilAvatarPreview.style.backgroundImage = `url('${url}')`;
                        perfilAvatarPreview.style.backgroundSize = 'cover';
                        perfilAvatarPreview.style.backgroundPosition = 'center';
                        perfilAvatarPreview.textContent = '';
                    } else {
                        const initial = (currentUser.nombre || currentUser.email || 'U').trim().charAt(0).toUpperCase();
                        perfilAvatarPreview.style.backgroundImage = '';
                        perfilAvatarPreview.textContent = initial;
                    }
                }
            }
        };

        const closePerfil = () => {
            if (!perfilModal) return;
            perfilModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        };

        if (profileBtn) profileBtn.addEventListener('click', (e) => { e.preventDefault(); openPerfil(); });
        if (closePerfilModal) closePerfilModal.addEventListener('click', closePerfil);
        if (cancelarPerfil) cancelarPerfil.addEventListener('click', closePerfil);

        // Cerrar al hacer click fuera
        window.addEventListener('click', (e) => {
            if (e.target === perfilModal) closePerfil();
        });

        if (perfilFotoInput) {
            perfilFotoInput.addEventListener('change', function() {
                const file = this.files && this.files[0];
                if (!file) return;
                selectedAvatarFile = file;
                const previewUrl = URL.createObjectURL(file);
                if (perfilAvatarPreview) {
                    perfilAvatarPreview.style.backgroundImage = `url('${previewUrl}')`;
                    perfilAvatarPreview.style.backgroundSize = 'cover';
                    perfilAvatarPreview.style.backgroundPosition = 'center';
                    perfilAvatarPreview.textContent = '';
                }
            });
        }

        if (perfilForm) {
            perfilForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                if (!currentUser) return;
                
                const nombre = perfilNombre ? (perfilNombre.value || '').trim() : '';
                const email = perfilEmail ? (perfilEmail.value || '').trim() : '';
                
                try {
                    // 1. Subir avatar si hay uno seleccionado
                    if (selectedAvatarFile) {
                        const fd = new FormData();
                        fd.append('avatar', selectedAvatarFile);
                        const avRes = await fetch(`/api/usuarios/${currentUser.id}/avatar`, {
                            method: 'POST',
                            body: fd
                        });
                        const avData = await avRes.json();
                        if (avRes.ok && avData.avatar_url) {
                            currentUser.avatar_url = avData.avatar_url;
                            // Actualizar avatar en topbar
                            const topAvatar = document.getElementById('profileAvatar');
                            if (topAvatar) {
                                topAvatar.style.backgroundImage = `url('${currentUser.avatar_url}')`;
                                topAvatar.style.backgroundSize = 'cover';
                                topAvatar.style.backgroundPosition = 'center';
                                topAvatar.textContent = '';
                            }
                        }
                    }

                    // 2. Actualizar datos (nombre, email)
                    const res = await fetch(`/api/usuarios/${currentUser.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre, email, rol: currentUser.rol })
                    });
                    const data = await res.json();
                    
                    if (res.ok) {
                        currentUser.nombre = nombre;
                        currentUser.email = email;
                        Swal.fire({
                            icon: 'success',
                            title: 'Perfil actualizado',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        closePerfil();
                    } else {
                        throw new Error(data.message || 'Error al actualizar perfil');
                    }
                } catch (err) {
                    console.error(err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: err.message || 'No se pudo actualizar el perfil'
                    });
                }
            });
        }
    }

    function updateTopCorreoBadge(){
        const el = document.getElementById('topCorreoBadge');
        if (!el) return;
        fetch('/api/correos/unread_count')
            .then(r=>r.json())
            .then(d=>{
                const cnt = Number((d && d.count) || 0);
                if (cnt > 0){ el.textContent = String(cnt); el.style.display = 'inline-block'; }
                else { el.style.display = 'none'; }
            })
            .catch(()=>{});
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
                    currentUser = response.user;
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
            const role = teammate.rol || 'Miembro'; // Default role if not provided
            
            // Random gradient or specific logic for avatar bg if desired, keeping it simple for now
            // or use the existing style.
            
            html += `
                <div class="teammate-card-new">
                    <div class="tm-avatar">
                        ${teammate.avatar_url ? `<img src="${teammate.avatar_url}" alt="${initials}">` : `<span>${initials}</span>`}
                    </div>
                    <div class="tm-info">
                        <h4>${teammate.nombre}</h4>
                        <span class="tm-role">${role}</span>
                        <p class="tm-email">${teammate.email}</p>
                    </div>
                    <div class="tm-actions">
                        <a href="mailto:${teammate.email}" class="btn-icon-sm" title="Contactar"><i class="fas fa-envelope"></i></a>
                    </div>
                </div>
            `;
        });

        // Wrap in a grid container if not already handled by CSS on #teammatesContainer
        // But #teammatesContainer is just a div.
        // We will style .teammates-container as a grid in CSS or here.
        // Let's rely on CSS for the grid layout of #teammatesContainer (which is class .teammates-container in HTML)
        
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
                        <span class="task-status ${task.estado}">${statusText}</span>
                    </div>
                </div>
            `;
        });

        $('#tasksContainer').html(html);
    }

    function updateTaskStats() {
        const tasks = Array.isArray(currentTasks) ? currentTasks : [];
        
        const total = tasks.length;
        const pending = tasks.filter(t => t.estado === 'pendiente').length;
        const inProgress = tasks.filter(t => t.estado === 'en_progreso').length;
        const completed = tasks.filter(t => t.estado === 'completada').length;

        // Update Stat Cards Text
        $('#statTotal').text(total);
        $('#statPending').text(pending);
        $('#statProgress').text(inProgress);
        $('#statCompleted').text(completed);

        // Update Stat Cards Bars (percentages relative to total)
        const getPct = val => total > 0 ? Math.round((val / total) * 100) : 0;
        
        $('#barFillPending').css('width', getPct(pending) + '%');
        $('#barFillProgress').css('width', getPct(inProgress) + '%');
        $('#barFillCompleted').css('width', getPct(completed) + '%');
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
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
      try {
          const res = await fetch(`/api/proyectos/${currentProject.id}/documentos`);
          const data = await res.json();
          if (res.ok && data.success){
              renderDocumentos(data.documentos || []);
          } else {
              tbody.innerHTML = '<tr><td colspan="6" class="text-center">No se pudieron cargar los documentos</td></tr>';
          }
      } catch(err){
          console.error(err);
          tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar documentos</td></tr>';
      }
  }

  function renderDocumentos(docs){
      const tbody = document.querySelector('#tablaDocumentos tbody');
      if (!tbody) return;
      if (!docs || docs.length === 0){
          tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin documentos</td></tr>';
          return;
      }
      const rows = docs.map(doc => {
          const fechaSub = doc.fecha_subida ? new Date(doc.fecha_subida).toLocaleString('es-ES') : '—';
          const venc = doc.fecha_vencimiento ? new Date(doc.fecha_vencimiento) : null;
          const vencHtml = venc ? getDueBadgeHtml(venc) : '<span class="badge">—</span>';
          const nombre = doc.nombre_archivo || 'archivo';
          return `
                <tr data-id="${doc.id}">
                    <td style="text-align:center;">
                        <input type="checkbox" data-id="${doc.id}" />
                    </td>
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
      $('#tablaDocumentos button[data-doc-id]').off('click').on('click', function(){
          const id = this.getAttribute('data-doc-id');
          confirmarEliminarDocumento(id);
      });
      
      const chkSelectAll = document.getElementById('chkDocsSelectAll');
      if (chkSelectAll){
        chkSelectAll.checked = false;
        chkSelectAll.onchange = () => {
          const checks = Array.from(tbody.querySelectorAll('input[type="checkbox"][data-id]'));
          checks.forEach(ch => { ch.checked = !!chkSelectAll.checked; });
        };
      }
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

    const tablaDocumentos = document.getElementById('tablaDocumentos');
    const btnDescTodos = document.getElementById('btnDescargarTodosDocs');
    const btnDescSel = document.getElementById('btnDescargarSeleccionadosDocs');

    function showInfo(title, text){
      try{ if (typeof Swal !== 'undefined'){ Swal.fire({ icon:'info', title, text }); } else { alert(text || title); } }
      catch(_){ alert(text || title); }
    }

    function triggerDownload(id){
      const a = document.createElement('a');
      a.href = `/api/documentos/${id}/download`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ document.body.removeChild(a); }, 0);
    }

    btnDescTodos?.addEventListener('click', (e)=>{
      e.preventDefault();
      const tbody = tablaDocumentos?.querySelector('tbody');
      const ids = Array.from(tbody?.querySelectorAll('tr[data-id]') || []).map(tr => tr.getAttribute('data-id'));
      if (!ids.length){ return showInfo('Sin documentos', 'No hay archivos para descargar'); }
      ids.forEach((id, idx)=> setTimeout(()=> triggerDownload(id), idx*150));
    });

    btnDescSel?.addEventListener('click', (e)=>{
      e.preventDefault();
      const tbody = tablaDocumentos?.querySelector('tbody');
      const ids = Array.from(tbody?.querySelectorAll('input[type="checkbox"][data-id]:checked') || []).map(ch => ch.getAttribute('data-id'));
      if (!ids.length){ return showInfo('Selecciona documentos', 'Marca uno o varios archivos para descargar'); }
      ids.forEach((id, idx)=> setTimeout(()=> triggerDownload(id), idx*150));
    });

    function logout() {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro de que quieres cerrar sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4D5180',
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
        // Solicitud de estado de proyecto (envía correo al líder)
        const btnSolicitar = document.getElementById('btnSolicitarEstadoProyecto');
        if (btnSolicitar) {
            btnSolicitar.addEventListener('click', async function(){
                if (!currentProject || !currentProject.id) { return; }
                const opts = {
                    'en_ejecucion': 'En ejecución',
                    'en_pausa': 'En pausa',
                    'finalizado': 'Finalizado'
                };
                const html = `
                    <div class="form-group">
                        <label>Selecciona estado solicitado</label>
                        <select id="swEstadoProyecto" class="form-control">
                            ${Object.entries(opts).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Mensaje (opcional)</label>
                        <textarea id="swMsgEstado" class="form-control" rows="4" placeholder="Ej.: Justificación de la solicitud"></textarea>
                    </div>`;
                const res = await Swal.fire({ title: 'Solicitud de estado de proyecto', html, showCancelButton: true, confirmButtonText: 'Enviar solicitud', cancelButtonText: 'Cancelar', focusConfirm: false, preConfirm: () => {
                    const sel = document.getElementById('swEstadoProyecto');
                    if (!sel || !sel.value) { Swal.showValidationMessage('Debes seleccionar un estado'); return false; }
                    return { estado: sel.value, mensaje: (document.getElementById('swMsgEstado')?.value||'').trim() };
                }});
                if (!res.isConfirmed) return;
                const estadoSolicitado = res.value.estado;
                const msg = res.value.mensaje || '';
                try {
                    const jefeEmail = currentProject.jefe_email || '';
                    if (!jefeEmail) { throw new Error('No se encontró correo del líder'); }
                    const fd = new FormData();
                    fd.append('to_emails', jefeEmail);
                    const asunto = `Solicitud de estado de proyecto: ${currentProject.nombre}`;
                    const cuerpo = `El trabajador ${(currentUser?.nombre||currentUser?.email||'')} solicita cambiar el estado del proyecto "${currentProject.nombre}" a "${opts[estadoSolicitado]}".\n\n${msg}\n\n[[REQUEST_PROJECT_STATUS:${currentProject.id}|${estadoSolicitado}|${currentUser?.email||''}]]`;
                    fd.append('asunto', asunto);
                    fd.append('cuerpo', cuerpo);
                    const r = await fetch('/api/correos', { method: 'POST', body: fd });
                    const d = await r.json().catch(()=>({}));
                    if (!r.ok || !d.ok) { throw new Error('No se pudo enviar la solicitud'); }
                    Swal.fire({ icon: 'success', title: 'Solicitud enviada', text: 'El líder recibirá tu solicitud por correo.', timer: 1800, showConfirmButton: false });
                } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Error', text: String(err.message||err) });
                }
            });
        }
