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
    }

    function setupEventListeners() {
        // Logout
        $('#logoutBtn').click(function(e) {
            e.preventDefault();
            logout();
        });

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
    }

    function loadUserInfo() {
        $.get('/api/auth/me')
            .done(function(response) {
                if (response.success && response.user) {
                    $('#userName').text(response.user.nombre);
                }
            })
            .fail(function() {
                console.error('Error al cargar información del usuario');
            });
    }

    async function loadProjectDetails() {
        try {
            // Primero obtener el proyecto asignado al trabajador
            const projectResponse = await $.get('/api/trabajador/proyecto');
            
            if (!projectResponse.success || !projectResponse.proyecto) {
                showError('No tienes un proyecto asignado');
                return;
            }
            
            currentProject = projectResponse.proyecto;
            
            // Ahora obtener los detalles completos del proyecto
            const detailResponse = await $.get(`/api/trabajador/proyecto/${currentProject.id}`);
            
            if (detailResponse.success) {
                // Combinar la información
                currentProject = { ...currentProject, ...detailResponse.proyecto };
                currentProject.equipo = detailResponse.equipo;
                currentProject.tareas = detailResponse.tareas || [];
                
                // Cargar en memoria las tareas para la página
                currentTasks = currentProject.tareas;
                
                // Render de la UI
                displayProjectInfo(currentProject);
                loadTeammates(currentProject.id);
                displayTasks(currentTasks);
                updateTaskStats();
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
        $('#projectDescription').text(proyecto.descripcion || 'Sin descripción');
        
        // Formatear fechas
        const fechaInicio = new Date(proyecto.fecha_inicio).toLocaleDateString('es-ES');
        const fechaFin = new Date(proyecto.fecha_fin).toLocaleDateString('es-ES');
        $('#projectDates').text(`${fechaInicio} - ${fechaFin}`);
        
        $('#projectManager').text(proyecto.jefe_nombre || 'Sin asignar');
        
        // Actualizar progreso
        const progress = (proyecto.porcentaje_avance !== undefined && proyecto.porcentaje_avance !== null)
            ? Number(proyecto.porcentaje_avance)
            : 0;
        $('#progressPercentage').text(`${progress}%`);
        updateProgressCircle(progress);
    }

    function updateProgressCircle(percentage) {
        const degrees = (percentage / 100) * 360;
        $('.progress-circle').css('background', 
            `conic-gradient(#4CAF50 ${degrees}deg, #e9ecef ${degrees}deg)`
        );
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

        let html = '';
        tasks.forEach(task => {
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
        if (!currentTasks || currentTasks.length === 0) {
            $('#totalTasks').text(0);
            $('#pendingTasks').text(0);
            $('#inProgressTasks').text(0);
            $('#completedTasks').text(0);
            return;
        }
        
        const total = currentTasks.length;
        const pending = currentTasks.filter(t => t.estado === 'pendiente').length;
        const inProgress = currentTasks.filter(t => t.estado === 'en_progreso').length;
        const completed = currentTasks.filter(t => t.estado === 'completada').length;

        $('#totalTasks').text(total);
        $('#pendingTasks').text(pending);
        $('#inProgressTasks').text(inProgress);
        $('#completedTasks').text(completed);
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

    function getInitials(name) {
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
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