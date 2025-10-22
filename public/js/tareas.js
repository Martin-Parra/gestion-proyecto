// Funciones para gestionar tareas
let proyectosTareas = [];

// Cargar proyectos en el select de tareas
async function cargarProyectosParaTareas() {
    try {
        const response = await fetch('/api/proyectos');
        if (!response.ok) throw new Error('Error al cargar proyectos');
        
        const data = await response.json();
        if (!Array.isArray(data.proyectos)) {
            throw new Error('Formato de datos inválido');
        }
        
        proyectosTareas = data.proyectos;
        const selectProyecto = document.getElementById('proyectoTarea');
        selectProyecto.innerHTML = '<option value="">Seleccione un proyecto...</option>';
        
        proyectosTareas.forEach(proyecto => {
            const option = document.createElement('option');
            option.value = proyecto.id;
            option.textContent = proyecto.nombre;
            selectProyecto.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los proyectos: ' + error.message);
    }
}

// Crear nueva tarea
async function crearTarea(evento) {
    evento.preventDefault();
    
    const proyectoId = document.getElementById('proyectoTarea').value;
    const titulo = document.getElementById('tituloTarea').value;
    const descripcion = document.getElementById('descripcionTarea').value;
    
    if (!proyectoId || !titulo || !descripcion) {
        mostrarError('Por favor complete todos los campos');
        return;
    }
    
    try {
        const response = await fetch('/api/tareas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                proyecto_id: proyectoId,
                titulo: titulo,
                descripcion: descripcion
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la tarea');
        }
        
        const resultado = await response.json();
        
        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Tarea creada correctamente',
            showConfirmButton: false,
            timer: 1500
        });
        
        // Limpiar el formulario
        document.getElementById('formAsignarTarea').reset();
        // Cerrar el modal si está abierto
        const modalAsignacion = document.getElementById('modalAsignacionTareas');
        if (modalAsignacion) {
            modalAsignacion.style.display = 'none';
        }
        
        // Actualizar la vista de proyectos
        if (typeof window.cargarProyectosTarjetas === 'function') {
            await window.cargarProyectosTarjetas();
        }
        
        // Si hay un proyecto abierto, actualizar su detalle
        const detalleCard = document.getElementById('proyectoDetalleCard');
        if (detalleCard && detalleCard.style.display !== 'none') {
            const proyectoSeleccionado = proyectosTareas.find(p => String(p.id) === String(proyectoId));
            if (proyectoSeleccionado && typeof window.abrirProyectoDetalle === 'function') {
                await window.abrirProyectoDetalle(proyectoId, proyectoSeleccionado.nombre);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al crear la tarea: ' + error.message);
    }
}

// Cargar tareas de un proyecto
async function cargarTareasProyecto(proyectoId) {
    try {
        const response = await fetch(`/api/tareas/proyecto/${proyectoId}`);
        if (!response.ok) throw new Error('Error al cargar las tareas');
        
        const tareas = await response.json();
        return tareas;
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar las tareas del proyecto: ' + error.message);
        return [];
    }
}

// Actualizar estado de una tarea
async function actualizarEstadoTarea(tareaId, nuevoEstado) {
    try {
        const response = await fetch(`/api/tareas/${tareaId}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el estado');
        }
        
        return true;
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al actualizar el estado de la tarea: ' + error.message);
        return false;
    }
}

// Eliminar una tarea
async function eliminarTarea(tareaId) {
    try {
        const confirmacion = await Swal.fire({
            title: '¿Está seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        
        if (confirmacion.isConfirmed) {
            const response = await fetch(`/api/tareas/${tareaId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar la tarea');
            }
            
            Swal.fire(
                '¡Eliminada!',
                'La tarea ha sido eliminada.',
                'success'
            );
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al eliminar la tarea: ' + error.message);
        return false;
    }
}

// Mostrar error
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar proyectos al iniciar
    cargarProyectosParaTareas();
    
    // Configurar formulario de asignación de tareas
    const formAsignarTarea = document.getElementById('formAsignarTarea');
    if (formAsignarTarea) {
        formAsignarTarea.addEventListener('submit', crearTarea);
    }
    
    // Cargar proyectos cuando se active la sección de revisión
    const seccionRevision = document.getElementById('revicion_proyectos');
    if (seccionRevision) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.style.display === 'block') {
                    if (typeof window.cargarProyectosTarjetas === 'function') {
                        window.cargarProyectosTarjetas();
                    }
                }
            });
        });
        
        observer.observe(seccionRevision, { attributes: true, attributeFilter: ['style'] });
    }
});