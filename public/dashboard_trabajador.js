// Variables globales
let currentUser = null;
let currentProject = null;
let allTasks = [];
let currentFilter = 'todas';

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();

    // --- Toggle del menú en el topbar ---
    const topbar = document.querySelector('.topbar');
    const toggleBtn = document.querySelector('.menu-toggle');
    const menu = topbar ? topbar.querySelector('.sidebar-menu') : null;
    console.log('Topbar:', topbar);
    console.log('Toggle button:', toggleBtn);
    
    if (topbar && toggleBtn) {
        const hasAnime = typeof window !== 'undefined' && window.anime;

        const openMenu = () => {
            console.log('Abrir menú');
            topbar.classList.add('open');
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
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
            console.log('Cerrar menú');
            if (hasAnime && menu) {
                window.anime({
                    targets: menu,
                    opacity: [1, 0],
                    translateY: [0, -12],
                    duration: 200,
                    easing: 'easeInQuad',
                    complete: () => {
                        topbar.classList.remove('open');
                        const icon = toggleBtn.querySelector('i');
                        if (icon) {
                            icon.classList.remove('fa-chevron-up');
                            icon.classList.add('fa-chevron-down');
                        }
                    }
                });
            } else {
                topbar.classList.remove('open');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            }
        };

        toggleBtn.addEventListener('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            console.log('Menu button clicked!');
            if (topbar.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
            console.log('Topbar classes:', topbar.className);
        });

        // Exponer funciones para que otros manejadores las usen
        topbar.__openMenu = openMenu;
        topbar.__closeMenu = closeMenu;
    } else {
        console.error('No se encontraron los elementos topbar o menu-toggle');
    }
    
    // Cerrar menú y animar contenido al seleccionar una sección
    const main = document.querySelector('.main-content');
    document.querySelectorAll('.sidebar-menu a[href^="#"], .sidebar-menu a[href^="/"]').forEach(a => {
        a.addEventListener('click', () => {
            if (topbar && topbar.__closeMenu) topbar.__closeMenu();
            if (main) {
                main.classList.add('content-enter');
                setTimeout(() => main.classList.remove('content-enter'), 300);
            }
        });
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', function(e) {
        if (topbar && !topbar.contains(e.target)) {
            if (topbar.__closeMenu) topbar.__closeMenu();
        }
    });

    // Perfil: abrir/cerrar y poblar datos
    const profileBtn = document.getElementById('profileBtn');
    const perfilModal = document.getElementById('perfilModal');
    const closePerfilModal = document.getElementById('closePerfilModal');
    const cancelarPerfil = document.getElementById('cancelarPerfil');
    const perfilNombre = document.getElementById('perfilNombre');
    const perfilEmail = document.getElementById('perfilEmail');
    const perfilAvatarPreview = document.getElementById('perfilAvatarPreview');
    const profileAvatar = document.getElementById('profileAvatar');

    const openPerfil = () => {
        if (!perfilModal) return;
        perfilModal.style.display = 'block';
        document.body.classList.add('modal-open');
        if (currentUser) {
            perfilNombre.value = currentUser.nombre || '';
            perfilEmail.value = currentUser.email || '';
            const initial = (currentUser.nombre || currentUser.email || 'U').trim().charAt(0).toUpperCase();
            if (perfilAvatarPreview) perfilAvatarPreview.textContent = initial;
        }
    };
    const closePerfil = () => {
        if (!perfilModal) return;
        perfilModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    };
    if (profileBtn) profileBtn.addEventListener('click', openPerfil);
    if (closePerfilModal) closePerfilModal.addEventListener('click', closePerfil);
    if (cancelarPerfil) cancelarPerfil.addEventListener('click', closePerfil);

    // Setear inicial del avatar en la barra
    const setAvatarInitial = () => {
        if (!profileAvatar) return;
        const initial = (currentUser && (currentUser.nombre || currentUser.email) ? (currentUser.nombre || currentUser.email) : 'U').trim().charAt(0).toUpperCase();
        profileAvatar.textContent = initial;
    };
    // Intentar setear inicial cuando ya cargamos usuario
    document.addEventListener('userLoaded', setAvatarInitial);
});

// Configurar event listeners
function setupEventListeners() {
    // Navegación del sidebar
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            if (section) {
                e.preventDefault();
                showSection(section);
            }
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Filtros de tareas
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setActiveFilter(this.dataset.filter);
        });
    });
    
    // Modal de detalles de tarea
    const btnActualizarTarea = document.getElementById('btnActualizarTarea');
    if (btnActualizarTarea) {
        btnActualizarTarea.addEventListener('click', actualizarEstadoTarea);
    }

    // Botón cerrar detalles del proyecto
    const btnCerrarDetalle = document.getElementById('btnCerrarDetalle');
    if (btnCerrarDetalle) {
        btnCerrarDetalle.addEventListener('click', cerrarProyectoDetalle);
    }
}

// Mostrar sección específica (similar al admin)
function showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Desactivar todos los enlaces del menú
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Activar el enlace correspondiente
    const targetLink = document.querySelector(`.sidebar-menu a[data-section="${sectionName}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // Guardar la sección activa en localStorage
    localStorage.setItem('activeDashboardSection', sectionName);
    
    // Cargar contenido específico según la sección
    if (sectionName === 'mi-proyecto') {
        loadProjectInfo();
    } else if (sectionName === 'mis-tareas') {
        loadTasks();
    }
}



// Inicializar dashboard
async function initializeDashboard() {
    try {
        await loadUserInfo();
        // Restaurar la sección activa desde localStorage o usar la primera por defecto
        const savedSection = localStorage.getItem('activeDashboardSection');
        const defaultSection = 'mi-proyecto';
        const sectionToShow = savedSection && document.getElementById(savedSection) ? savedSection : defaultSection;
        showSection(sectionToShow);
    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar el dashboard. Por favor, recarga la página.',
            confirmButtonColor: '#28a745'
        });
    }
}

// Cargar información del usuario
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.redirected || (response.url && response.url.includes('/login'))) {
            window.location.href = '/login';
            return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
            throw new Error('No autorizado');
        }
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = currentUser.nombre;
            }
            // Disparar evento para actualizar avatar inicial
            document.dispatchEvent(new Event('userLoaded'));
        } else {
            throw new Error('Error al obtener información del usuario');
        }
    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
        window.location.href = '/login';
    }
}

// Cargar información del proyecto asignado
async function loadProjectInfo() {
    const grid = document.getElementById('proyectoGrid');
    if (!grid) return;

    try {
        const response = await fetch('/api/trabajador/proyectos', { credentials: 'include' });
        if (response.redirected || (response.url && response.url.includes('/login'))) {
            window.location.href = '/login';
            return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Respuesta no válida del servidor');
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.proyectos) && data.proyectos.length > 0) {
            updateStatCards(data.proyectos.length);
            grid.innerHTML = '';
            data.proyectos.forEach((proyecto) => {
                const card = document.createElement('div');
                card.className = 'project-card';
                const porcentaje = Number(proyecto.porcentaje_avance || 0);
                card.innerHTML = `
                    <h4>${proyecto.nombre || 'Proyecto'}</h4>
                    <div class="project-progress">
                        <div class="progress"><div class="progress-bar" style="width:${porcentaje}%"></div></div>
                        <span>${porcentaje}%</span>
                    </div>
                `;
                card.addEventListener('click', () => {
                    window.location.href = `/proyecto-detalle?id=${proyecto.id}`;
                });
                grid.appendChild(card);
            });
        } else {
            updateStatCards(0);
            grid.innerHTML = `
                <div class="text-center" style="padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f6c23e; margin-bottom: 1rem;"></i>
                    <h3>No tienes proyectos asignados</h3>
                    <p class="text-muted">Contacta con tu administrador para que te asigne a un proyecto.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        grid.innerHTML = `
            <div class="text-center" style="padding: 2rem;">
                <i class="fas fa-times-circle" style="font-size: 3rem; color: #e74a3b; margin-bottom: 1rem;"></i>
                <h3>Error al cargar los proyectos</h3>
                <p class="text-muted">Por favor, intenta nuevamente más tarde.</p>
            </div>
        `;
    }
}

// Función para abrir detalles del proyecto
function abrirProyectoDetalle(proyectoId, nombreProyecto) {
    const card = document.getElementById('proyectoDetalleCard');
    const titulo = document.getElementById('proyectoDetalleTitulo');
    const tareasTable = document.getElementById('tablaTareasProyecto');
    const tareasTBody = tareasTable ? tareasTable.querySelector('tbody') : null;
    if (!card || !titulo || !tareasTBody) return;

    titulo.innerHTML = `<i class="fas fa-tasks"></i> Tareas del Proyecto: ${nombreProyecto || ''}`;
    card.style.display = 'block';
    tareasTBody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando tareas...</td></tr>';
    const liderEl = document.getElementById('proyectoInfoLider');
    if (liderEl) liderEl.textContent = 'Cargando...';

    fetch(`/api/trabajador/proyecto/${proyectoId}`, { credentials: 'include' })
        .then(r => {
            if (r.redirected || (r.url && r.url.includes('/login'))) {
                window.location.href = '/login';
                throw new Error('Redirigido a login');
            }
            const ct = r.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
                throw new Error('Respuesta no válida del servidor');
            }
            return r.json();
        })
        .then(data => {
            if (liderEl) {
                liderEl.textContent = (data && data.proyecto && data.proyecto.jefe_nombre) ? data.proyecto.jefe_nombre : 'Sin asignar';
            }
            if (data && data.success) {
                const tareas = Array.isArray(data.tareas) ? data.tareas : [];
                tareasTBody.innerHTML = '';
                if (tareas.length === 0) {
                    tareasTBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay tareas asignadas</td></tr>';
                } else {
                    tareas.forEach(tarea => {
                        const tr = document.createElement('tr');
                        const estadoBadge = getEstadoBadge(tarea.estado);
                        const prioridadBadge = getPrioridadBadge(tarea.prioridad);
                        tr.innerHTML = `
                            <td>${tarea.titulo}</td>
                            <td>${estadoBadge}</td>
                            <td>${prioridadBadge}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="verDetalleTarea(${tarea.id})">
                                    <i class="fas fa-eye"></i> Ver
                                </button>
                            </td>
                        `;
                        tareasTBody.appendChild(tr);
                    });
                }
            } else {
                tareasTBody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar tareas</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error cargando detalles del proyecto:', error);
            if (liderEl) liderEl.textContent = 'Error al cargar';
            tareasTBody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar información</td></tr>';
        });
}

// Función para cerrar detalles del proyecto
function cerrarProyectoDetalle() {
    const card = document.getElementById('proyectoDetalleCard');
    const tareasTable = document.getElementById('tablaTareasProyecto');
    const tareasTBody = tareasTable ? tareasTable.querySelector('tbody') : null;
    const titulo = document.getElementById('proyectoDetalleTitulo');
    const liderEl = document.getElementById('proyectoInfoLider');

    if (card) {
        card.style.display = 'none';
    }
    if (tareasTBody) {
        tareasTBody.innerHTML = '';
    }
    if (titulo) {
        titulo.innerHTML = '<i class="fas fa-tasks"></i> Tareas del Proyecto';
    }
    if (liderEl) {
        liderEl.textContent = '';
    }
}

// Exponer globalmente por si se invoca desde HTML/otros scripts
window.cerrarProyectoDetalle = cerrarProyectoDetalle;

// Cargar tareas del usuario
async function loadTasks() {
    try {
        const response = await fetch('/api/trabajador/tareas', { credentials: 'include' });
        if (response.redirected || (response.url && response.url.includes('/login'))) {
            window.location.href = '/login';
            return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Respuesta no válida del servidor');
        }
        const data = await response.json();
        if (data.success) {
            allTasks = data.tareas || [];
            renderTasks();
            updateTaskStats();
        } else {
            throw new Error(data.message || 'Error al cargar tareas');
        }
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        document.getElementById('tasksContainer').innerHTML = `
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #e74a3b; margin-bottom: 1rem;"></i>
                    <h3>Error al cargar tareas</h3>
                    <p class="text-muted">Error al cargar las tareas: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

// Ver detalles de una tarea
async function verDetalleTarea(tareaId) {
    try {
        const response = await fetch(`/api/tareas/${tareaId}`, { credentials: 'include' });
        if (response.redirected || (response.url && response.url.includes('/login'))) {
            window.location.href = '/login';
            return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Respuesta no válida del servidor');
        }
        const data = await response.json();
        if (data.success && data.tarea) {
            const tarea = data.tarea;
            document.getElementById('tareaId').value = tarea.id;
            document.getElementById('tareaTitulo').value = tarea.titulo;
            document.getElementById('tareaEstado').value = tarea.estado;
            document.getElementById('tareaFechaInicio').value = tarea.fecha_inicio ? tarea.fecha_inicio.split('T')[0] : '';
            document.getElementById('tareaFechaFin').value = tarea.fecha_fin ? tarea.fecha_fin.split('T')[0] : '';
            $('#modalDetalleTarea').modal('show');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la información de la tarea',
                confirmButtonColor: '#28a745'
            });
        }
    } catch (error) {
        console.error('Error al cargar detalles de la tarea:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los detalles de la tarea',
            confirmButtonColor: '#28a745'
        });
    }
}

// Logout
async function logout() {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true });
    } catch (e) {
        console.warn('Logout request error (continuo con redirección):', e);
    }
    window.location.href = '/login';
}

// Actualizar estado de una tarea
async function actualizarEstadoTarea() {
    try {
        const tareaId = document.getElementById('tareaId').value;
        const nuevoEstado = document.getElementById('tareaEstado').value;
        const response = await fetch(`/api/tareas/${tareaId}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Respuesta no válida del servidor');
        }
        const data = await response.json();
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Estado de la tarea actualizado correctamente',
                confirmButtonColor: '#28a745'
            });
            $('#modalDetalleTarea').modal('hide');
            loadTasks();
            loadProjectInfo();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'Error al actualizar el estado de la tarea',
                confirmButtonColor: '#28a745'
            });
        }
    } catch (error) {
        console.error('Error al actualizar estado de la tarea:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al actualizar el estado de la tarea',
            confirmButtonColor: '#28a745'
        });
    }
}

// Funciones auxiliares para badges
function getEstadoBadge(estado) {
    const badges = {
        'pendiente': '<span class="badge badge-warning">Pendiente</span>',
        'en_progreso': '<span class="badge badge-info">En Progreso</span>',
        'completada': '<span class="badge badge-success">Completada</span>',
        'revisando': '<span class="badge badge-primary">Revisando</span>'
    };
    return badges[estado] || '<span class="badge badge-secondary">Desconocido</span>';
}

function getPrioridadBadge(prioridad) {
    const badges = {
        'baja': '<span class="badge badge-success">Baja</span>',
        'media': '<span class="badge badge-warning">Media</span>',
        'alta': '<span class="badge badge-danger">Alta</span>'
    };
    return badges[prioridad] || '<span class="badge badge-secondary">Normal</span>';
}

// Actualizar tarjetas de estadísticas
function updateStatCards(projectCount = 0) {
    // Actualizar proyecto
    const miProyectoElement = document.getElementById('miProyecto');
    if (miProyectoElement) {
        miProyectoElement.textContent = projectCount;
    }
    
    // Actualizar tareas (se actualizará cuando se carguen las tareas)
    const misTareasElement = document.getElementById('misTareas');
    if (misTareasElement) {
        misTareasElement.textContent = allTasks.length || 0;
    }
    
    // Actualizar tareas completadas
    const tareasCompletadasElement = document.getElementById('tareasCompletadas');
    if (tareasCompletadasElement) {
        const completadas = allTasks.filter(task => task.estado === 'completada').length || 0;
        tareasCompletadasElement.textContent = completadas;
    }
}

// Cargar tareas del usuario
async function loadTasks() {
    try {
        const response = await fetch('/api/trabajador/tareas');
        const data = await response.json();
        
        if (data.success) {
            allTasks = data.tareas || [];
            renderTasks();
            // Actualizar estadísticas de tareas
            updateTaskStats();
        } else {
            throw new Error(data.message || 'Error al cargar tareas');
        }
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        document.getElementById('tasksContainer').innerHTML = `
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #e74a3b; margin-bottom: 1rem;"></i>
                    <h3>Error al cargar tareas</h3>
                    <p class="text-muted">Error al cargar las tareas: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

// Actualizar estadísticas de tareas
function updateTaskStats() {
    // Actualizar total de tareas
    const misTareasElement = document.getElementById('misTareas');
    if (misTareasElement) {
        misTareasElement.textContent = allTasks.length || 0;
    }
    
    // Actualizar tareas completadas
    const tareasCompletadasElement = document.getElementById('tareasCompletadas');
    if (tareasCompletadasElement) {
        const completadas = allTasks.filter(task => task.estado === 'completada').length || 0;
        tareasCompletadasElement.textContent = completadas;
    }
}

// Renderizar tareas
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    
    if (!allTasks || allTasks.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-tasks" style="font-size: 3rem; color: #858796; margin-bottom: 1rem;"></i>
                    <h3>No hay tareas asignadas</h3>
                    <p class="text-muted">No tienes tareas asignadas en este momento.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Filtrar tareas según el filtro activo
    let filteredTasks = allTasks;
    if (currentFilter !== 'todas') {
        filteredTasks = allTasks.filter(task => task.estado === currentFilter);
    }
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-filter" style="font-size: 3rem; color: #858796; margin-bottom: 1rem;"></i>
                    <h3>No hay tareas con este filtro</h3>
                    <p class="text-muted">No se encontraron tareas con el filtro seleccionado.</p>
                </div>
            </div>
        `;
        return;
    }
    
    const tasksHTML = filteredTasks.map(task => `
        <div class="task-card" onclick="openTaskModal(${task.id})">
            <div class="task-card-header">
                <h5 class="task-title">${task.nombre}</h5>
                <span class="task-status status-${task.estado}">${formatStatus(task.estado)}</span>
            </div>
            <div class="task-description">
                ${task.descripcion || 'Sin descripción'}
            </div>
            <div class="task-meta">
                <span class="task-priority priority-${task.prioridad}">${task.prioridad}</span>
                <span>${formatDate(task.fecha_fin)}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = tasksHTML;
}

// Establecer filtro activo
function setActiveFilter(filter) {
    currentFilter = filter;
    
    // Actualizar botones de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    renderTasks();
}

// Abrir modal de tarea
function openTaskModal(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Llenar información del modal
    document.getElementById('modalTaskTitle').textContent = task.nombre;
    document.getElementById('modalTaskDescription').textContent = task.descripcion || 'Sin descripción';
    document.getElementById('modalTaskPriority').textContent = task.prioridad;
    document.getElementById('modalTaskStatus').textContent = formatStatus(task.estado);
    document.getElementById('modalTaskStartDate').textContent = formatDate(task.fecha_inicio);
    document.getElementById('modalTaskEndDate').textContent = formatDate(task.fecha_fin);
    
    // Configurar select de estado
    const statusSelect = document.getElementById('taskStatusSelect');
    statusSelect.value = task.estado;
    statusSelect.dataset.taskId = taskId;
    
    // Mostrar modal
    document.getElementById('taskModal').style.display = 'block';
}

// Cerrar modal
function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
}

// Actualizar estado de tarea
async function updateTaskStatus() {
    const statusSelect = document.getElementById('taskStatusSelect');
    const taskId = statusSelect.dataset.taskId;
    const newStatus = statusSelect.value;
    
    if (!taskId || !newStatus) return;
    
    try {
        const response = await fetch(`/api/trabajador/tareas/${taskId}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: newStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Actualizar tarea en el array local
            const taskIndex = allTasks.findIndex(t => t.id == taskId);
            if (taskIndex !== -1) {
                allTasks[taskIndex].estado = newStatus;
            }
            
            // Cerrar modal y re-renderizar tareas
            closeTaskModal();
            renderTasks();
            
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Estado de la tarea actualizado correctamente',
                confirmButtonColor: '#28a745'
            });
        } else {
            throw new Error(data.message || 'Error al actualizar tarea');
        }
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al actualizar el estado de la tarea: ' + error.message,
            confirmButtonColor: '#e74a3b'
        });
    }
}

// (Eliminado duplicado) Logout consolidado se declara más arriba

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'No especificada';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Formatear estado
function formatStatus(status) {
    const statusMap = {
        'pendiente': 'Pendiente',
        'en_progreso': 'En Progreso',
        'completada': 'Completada',
        'activo': 'Activo',
        'completado': 'Completado',
        'pausado': 'Pausado'
    };
    
    return statusMap[status] || status;
}