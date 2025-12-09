// Variables globales para la gestión de usuarios
let todosLosUsuarios = [];
let usuariosFiltrados = [];
let cantidadPorPagina = 7; // Por defecto mostrar 7 registros
let paginaActual = 1;
let terminoBusqueda = '';

// Variables globales para la gestión de proyectos
let jefesProyecto = [];
let jefeSeleccionadoId = null;

// Función para cargar usuarios
function cargarUsuarios() {
    fetch('/api/usuarios')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar usuarios');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                todosLosUsuarios = data.usuarios;
                filtrarYMostrarUsuarios();
            } else {
                console.error('Error al cargar usuarios:', data.message);
            }
        })
        .catch(error => {
            console.error('Error de conexión:', error);
        });
}

// Función para filtrar y mostrar usuarios
function filtrarYMostrarUsuarios() {
    if (terminoBusqueda.trim() === '') {
        usuariosFiltrados = [...todosLosUsuarios];
    } else {
        const termino = terminoBusqueda.toLowerCase();
        usuariosFiltrados = todosLosUsuarios.filter(usuario => 
            usuario.nombre.toLowerCase().includes(termino) || 
            usuario.email.toLowerCase().includes(termino) ||
            usuario.rol.toLowerCase().includes(termino)
        );
    }
    
    mostrarUsuariosEnTabla();
}

// Función para mostrar usuarios en la tabla con paginación
function mostrarUsuariosEnTabla() {
    const tablaBody = document.querySelector('#tablaUsuarios tbody');
    if (!tablaBody) {
        console.error('No se encontró el cuerpo de la tabla de usuarios');
        return;
    }
    
    tablaBody.innerHTML = '';
    
    if (usuariosFiltrados.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" class="text-center">No se encontraron usuarios</td>';
        tablaBody.appendChild(tr);
        
        // Actualizar información de registros
        document.getElementById('infoRegistros').textContent = 'Mostrando 0 de 0 registros';
        document.getElementById('paginaActual').textContent = 'Página 0';
        
        // Deshabilitar botones de paginación
        document.getElementById('btnAnterior').disabled = true;
        document.getElementById('btnSiguiente').disabled = true;
        
        return;
    }
    
    // Calcular índices para la paginación
    const inicio = (paginaActual - 1) * cantidadPorPagina;
    const fin = Math.min(inicio + cantidadPorPagina, usuariosFiltrados.length);
    
    // Obtener solo los usuarios de la página actual
    const usuariosPagina = usuariosFiltrados.slice(inicio, fin);
    
    // Mostrar los usuarios de la página actual
    usuariosPagina.forEach(usuario => {
        const tr = document.createElement('tr');
        
        const estadoTexto = usuario.activo ? 'Activo' : 'Inactivo';
        
        tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>${usuario.rol}</td>
            <td><span class="badge ${usuario.activo ? 'badge-success' : 'badge-danger'}">${estadoTexto}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" data-id="${usuario.id}" title="Editar usuario">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" data-id="${usuario.id}" title="Eliminar usuario">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tablaBody.appendChild(tr);
    });
    
    // Actualizar información de registros
    document.getElementById('infoRegistros').textContent = `Mostrando ${inicio + 1} a ${fin} de ${usuariosFiltrados.length} registros`;
    document.getElementById('paginaActual').textContent = `Página ${paginaActual}`;
    
    // Actualizar estado de los botones de paginación
    document.getElementById('btnAnterior').disabled = paginaActual === 1;
    document.getElementById('btnSiguiente').disabled = fin >= usuariosFiltrados.length;
    
    agregarEventosAcciones();
}

// Función para agregar eventos a los botones de acción
function agregarEventosAcciones() {
    // Agregar eventos a los botones de editar
    document.querySelectorAll('.btn-primary[data-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            abrirModalEditarUsuario(userId);
        });
    });
    
    // Agregar eventos a los botones de eliminar
    document.querySelectorAll('.btn-danger[data-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            abrirModalEliminarUsuario(userId);
        });
    });
}

// Función para abrir el modal de editar usuario
// Función para desnormalizar roles (convertir de BD a frontend)
function desnormalizarRol(rolBD) {
    const mapa = {
        'admin': 'administrador',
        'trabajador': 'miembro',
        'jefe_proyecto': 'jefe_proyecto'
    };
    return mapa[rolBD] || rolBD;
}

function abrirModalEditarUsuario(userId) {
    fetch(`/api/usuarios/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar datos del usuario');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const usuario = data.usuario;
                console.log('Datos del usuario cargados:', usuario);
                console.log('Rol del usuario (BD):', usuario.rol);
                
                // Desnormalizar el rol para que coincida con las opciones del select
                const rolDesnormalizado = desnormalizarRol(usuario.rol);
                console.log('Rol desnormalizado:', rolDesnormalizado);
                
                document.getElementById('editarUsuarioId').value = usuario.id;
                document.getElementById('editarNombre').value = usuario.nombre;
                document.getElementById('editarEmail').value = usuario.email;
                document.getElementById('editarRol').value = rolDesnormalizado;
                document.getElementById('editarEstado').value = usuario.activo ? 'activo' : 'inactivo';
                
                // Verificar que el valor se asignó correctamente
                console.log('Valor asignado al select rol:', document.getElementById('editarRol').value);
                const btnCambiarPwd = document.getElementById('btnAbrirCambiarPwd');
                const cambiarModal = document.getElementById('modalCambiarPwd');
                const closeCambiar = document.getElementById('closeCambiarPwd');
                const cambiarUserId = document.getElementById('cambiarPwdUserId');
                const nuevaPwdInput = document.getElementById('cambiarPwdNueva');
                const confirmPwdInput = document.getElementById('cambiarPwdConfirm');
                const toggleNueva = document.getElementById('toggleNuevaPwd');
                const toggleConfirm = document.getElementById('toggleConfirmPwd');
                const submitCambiar = document.getElementById('submitCambiarPwd');

                if (btnCambiarPwd && cambiarModal) {
                    btnCambiarPwd.onclick = () => {
                        const uid = document.getElementById('editarUsuarioId').value;
                        cambiarUserId.value = uid || '';
                        if (nuevaPwdInput) nuevaPwdInput.value = '';
                        if (confirmPwdInput) confirmPwdInput.value = '';
                        cambiarModal.style.display = 'block';
                    };
                }
                if (closeCambiar && cambiarModal) {
                    closeCambiar.onclick = () => { cambiarModal.style.display = 'none'; };
                }
                if (toggleNueva && nuevaPwdInput) {
                    toggleNueva.onclick = () => {
                        nuevaPwdInput.type = nuevaPwdInput.type === 'password' ? 'text' : 'password';
                        toggleNueva.classList.toggle('fa-eye-slash');
                        toggleNueva.classList.toggle('fa-eye');
                    };
                }
                if (toggleConfirm && confirmPwdInput) {
                    toggleConfirm.onclick = () => {
                        confirmPwdInput.type = confirmPwdInput.type === 'password' ? 'text' : 'password';
                        toggleConfirm.classList.toggle('fa-eye-slash');
                        toggleConfirm.classList.toggle('fa-eye');
                    };
                }
                if (submitCambiar && cambiarModal) {
                    submitCambiar.addEventListener('click', async (e) => {
                        e.preventDefault();
                        try{
                            const uid = cambiarUserId.value;
                            const nueva = (nuevaPwdInput?.value || '').trim();
                            const confirm = (confirmPwdInput?.value || '').trim();
                            if (nueva.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
                            if (nueva !== confirm) throw new Error('La confirmación no coincide');
                            submitCambiar.disabled = true;
                            const res = await fetch(`/api/usuarios/${uid}/password`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ password: nueva })
                            });
                            const data = await res.json().catch(()=>({}));
                            if (res.ok && data.success) {
                                cambiarModal.style.display = 'none';
                                Swal.fire({ icon:'success', title:'Contraseña actualizada', timer: 1500, showConfirmButton: false });
                            } else {
                                const msg = data?.message || 'No se pudo actualizar la contraseña';
                                throw new Error(msg);
                            }
                        } catch (err) {
                            Swal.fire({ icon:'error', title:'Error', text: String(err.message || err) });
                        } finally {
                            submitCambiar.disabled = false;
                        }
                    });
                }
                
                
                
                const modal = document.getElementById('modalEditarUsuario');
                if (modal) {
                    modal.style.display = 'block';
                }
            } else {
                console.error('Error al cargar datos del usuario:', data.message);
            }
        })
        .catch(error => {
            console.error('Error de conexión:', error);
        });
}

// Función para abrir el modal de eliminar usuario
function abrirModalEliminarUsuario(userId) {
    document.getElementById('confirmarEliminarUsuario').setAttribute('data-id', userId);
    const modal = document.getElementById('modalEliminarUsuario');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Función para cargar jefes de proyecto
window.cargarJefesProyecto = function() {
    fetch('/api/proyectos/jefes')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar jefes de proyecto');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.jefes) {
                jefesProyecto = data.jefes.sort((a, b) => a.nombre.localeCompare(b.nombre));
                const hasCrear = document.getElementById('buscadorJefe');
                const hasEditar = document.getElementById('buscadorJefeEditar');
                if (hasCrear) { window.configurarBuscadorJefes(); }
                if (hasEditar) { window.configurarBuscadorJefesEditar(); }
            } else {
                console.error('Error al cargar jefes de proyecto:', data.message || 'No se recibieron datos');
                jefesProyecto = [];
                // Configurar buscadores solo si existen en el DOM
                if (document.getElementById('buscadorJefe')) { window.configurarBuscadorJefes(); }
                if (document.getElementById('buscadorJefeEditar')) { window.configurarBuscadorJefesEditar(); }
            }
        })
        .catch(error => {
            console.error('Error de conexión:', error);
            jefesProyecto = [];
            // Configurar buscadores solo si existen en el DOM
            if (document.getElementById('buscadorJefe')) { window.configurarBuscadorJefes(); }
            if (document.getElementById('buscadorJefeEditar')) { window.configurarBuscadorJefesEditar(); }
        });
};

// Función para configurar el buscador de jefes de proyecto
window.configurarBuscadorJefes = function() {
    const buscadorJefe = document.getElementById('buscadorJefe');
    const resultadosJefe = document.getElementById('resultadosJefe');
    
    if (!buscadorJefe || !resultadosJefe) { return; }
    
    // Eliminar eventos anteriores para evitar duplicados
    const nuevoInputBuscador = buscadorJefe.cloneNode(true);
    buscadorJefe.parentNode.replaceChild(nuevoInputBuscador, buscadorJefe);
    
    nuevoInputBuscador.addEventListener('input', function() {
        const termino = this.value.toLowerCase();
        const jefesFiltrados = jefesProyecto.filter(jefe => 
            jefe.nombre.toLowerCase().includes(termino) || 
            jefe.email.toLowerCase().includes(termino)
        );
        
        window.mostrarResultadosJefes(jefesFiltrados);
    });
    
    nuevoInputBuscador.addEventListener('focus', function() {
        resultadosJefe.style.display = 'block';
        window.mostrarResultadosJefes(jefesProyecto);
    });
    
    // Usar un solo listener global para los clics
    if (!window.clickListenerConfigured) {
        document.addEventListener('click', function(e) {
            const buscador = document.getElementById('buscadorJefe');
            const resultados = document.getElementById('resultadosJefe');
            
            if (buscador && resultados && !buscador.contains(e.target) && !resultados.contains(e.target)) {
                resultados.style.display = 'none';
            }
        });
        window.clickListenerConfigured = true;
    }
};

// Función para mostrar resultados de jefes de proyecto
window.mostrarResultadosJefes = function(jefes) {
    const resultadosJefe = document.getElementById('resultadosJefe');
    
    if (!resultadosJefe) {
        console.error('No se encontró el elemento de resultados de jefes');
        return;
    }
    
    resultadosJefe.innerHTML = '';
    
    if (jefes.length === 0) {
        const item = document.createElement('div');
        item.className = 'resultado-item';
        item.textContent = 'No se encontraron jefes de proyecto';
        resultadosJefe.appendChild(item);
        return;
    }
    
    jefes.forEach(jefe => {
        const item = document.createElement('div');
        item.className = 'resultado-item';
        item.textContent = `${jefe.nombre} (${jefe.email})`;
        item.setAttribute('data-id', jefe.id);
        item.addEventListener('click', function() {
            window.seleccionarJefe(jefe.id, jefe.nombre);
            resultadosJefe.style.display = 'none';
        });
        
        resultadosJefe.appendChild(item);
    });
};

// Función para seleccionar un jefe de proyecto
window.seleccionarJefe = function(id, nombre) {
    const jefeProyectoId = document.getElementById('jefeProyectoId');
    const buscadorJefe = document.getElementById('buscadorJefe');
    const limpiarJefeBtn = document.getElementById('limpiarJefeBtn');
    
    if (!jefeProyectoId || !buscadorJefe || !limpiarJefeBtn) {
        console.error('No se encontraron los elementos para seleccionar jefe');
        return;
    }
    
    // Guardar el ID del jefe seleccionado
    jefeProyectoId.value = id;
    jefeSeleccionadoId = id;
    
    // Mostrar el nombre del jefe en el campo de búsqueda
    buscadorJefe.value = nombre;
    
    // Mostrar el botón para limpiar la selección
    limpiarJefeBtn.style.display = 'flex';
    
    // Desactivar el campo de búsqueda mientras hay un jefe seleccionado
    buscadorJefe.setAttribute('readonly', 'readonly');
    
    // Configurar el botón para limpiar la selección
    // Eliminar eventos anteriores para evitar duplicados
    const nuevoBtn = limpiarJefeBtn.cloneNode(true);
    limpiarJefeBtn.parentNode.replaceChild(nuevoBtn, limpiarJefeBtn);
    
    // Actualizar la referencia al nuevo botón
    const limpiarBtn = document.getElementById('limpiarJefeBtn');
    
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Limpiar la selección
            jefeProyectoId.value = '';
            jefeSeleccionadoId = null;
            buscadorJefe.value = '';
            buscadorJefe.removeAttribute('readonly');
            limpiarBtn.style.display = 'none';
        });
    }
};

// Variables y paginación para proyectos
let todosLosProyectos = [];
let paginaProyectos = 1;
const proyectosPorPagina = 6; // mostrar 6 por página

// Función para cargar proyectos
window.cargarProyectos = function() {
    console.log('Cargando proyectos...');
    
    fetch('/api/proyectos')
        .then(response => {
            console.log('Respuesta del servidor (proyectos):', response.status);
            if (!response.ok) {
                return response.json().then(errorData => {
                    console.error('Error del servidor:', errorData);
                    throw new Error(errorData.message || 'Error al cargar proyectos');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos de proyectos recibidos:', data);
            
            if (data.success) {
                const tablaBody = document.querySelector('#tablaProyectos tbody');
                
                if (!tablaBody) {
                    console.error('No se encontró el cuerpo de la tabla de proyectos');
                    return;
                }
                
                // Guardar y renderizar con paginación
                todosLosProyectos = Array.isArray(data.proyectos) ? data.proyectos : [];
                tablaBody.innerHTML = '';
                
                if (!todosLosProyectos || todosLosProyectos.length === 0) {
                    console.log('No hay proyectos para mostrar');
                    const tr = document.createElement('tr');
                    tr.innerHTML = '<td colspan="6" class="text-center">No hay proyectos registrados</td>';
                    tablaBody.appendChild(tr);
                    return;
                }
                mostrarProyectosEnTabla();
                agregarEventosPaginacionProyectos();
                // Agregar eventos a los botones de acción de proyectos
                agregarEventosAccionesProyectos();
            } else {
                console.error('Error al cargar proyectos:', data.message);
                alert('Error al cargar proyectos: ' + data.message);
            }
        })
        .catch(error => {
                console.error('Error de conexión:', error);
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar proyectos',
                    text: error.message,
                    confirmButtonColor: '#4e73df'
                });
                
                const tablaBody = document.querySelector('#tablaProyectos tbody');
                if (tablaBody) {
                    tablaBody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar proyectos. Intente nuevamente.</td></tr>';
                }
            });
};

function mostrarProyectosEnTabla() {
    const tablaBody = document.querySelector('#tablaProyectos tbody');
    if (!tablaBody) return;
    tablaBody.innerHTML = '';
    const total = todosLosProyectos.length;
    const totalPaginas = Math.ceil(total / proyectosPorPagina);
    if (paginaProyectos > totalPaginas) paginaProyectos = totalPaginas || 1;
    const inicio = (paginaProyectos - 1) * proyectosPorPagina;
    const fin = Math.min(inicio + proyectosPorPagina, total);
    const paginaItems = todosLosProyectos.slice(inicio, fin);

    paginaItems.forEach(proyecto => {
        try {
            console.log('Procesando proyecto:', proyecto);
                        
                        // Asegurarse de que las fechas sean válidas
                        let fechaInicio = 'No definida';
                        let fechaFin = 'No definida';
                        
                        try {
                            if (proyecto.fecha_inicio) {
                                fechaInicio = new Date(proyecto.fecha_inicio).toLocaleDateString();
                            }
                            if (proyecto.fecha_fin) {
                                fechaFin = new Date(proyecto.fecha_fin).toLocaleDateString();
                            }
                        } catch (e) {
                            console.error('Error al formatear fechas:', e);
                        }
                        
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${proyecto.id || ''}</td>
                            <td>${proyecto.nombre || ''}</td>
                            <td>${fechaInicio}</td>
                            <td>${fechaFin}</td>
                            <td>${proyecto.jefe_nombre || 'Sin asignar'}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" data-id="${proyecto.id}" title="Editar proyecto">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" data-id="${proyecto.id}" title="Eliminar proyecto">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        `;
                        
                        tablaBody.appendChild(tr);
        } catch (error) {
            console.error('Error al procesar proyecto:', error, proyecto);
        }
    });
    actualizarInfoPaginacionProyectos(total, inicio, fin);
}

function actualizarInfoPaginacionProyectos(total, inicio, fin) {
    const pageLabel = document.getElementById('paginaActualProy');
    const btnAnt = document.getElementById('btnAnteriorProy');
    const btnSig = document.getElementById('btnSiguienteProy');
    const info = document.getElementById('infoRegistrosProy');
    const totalPaginas = Math.ceil(total / proyectosPorPagina);
    if (pageLabel) pageLabel.textContent = `Página ${paginaProyectos}`;
    if (btnAnt) btnAnt.disabled = paginaProyectos <= 1;
    if (btnSig) btnSig.disabled = paginaProyectos >= totalPaginas;
    const inicioMostrar = total > 0 ? inicio + 1 : 0;
    const finMostrar = total > 0 ? fin : 0;
    if (info) info.textContent = `Mostrando ${inicioMostrar} a ${finMostrar} de ${total} registros`;
}

function agregarEventosPaginacionProyectos() {
    const btnAnt = document.getElementById('btnAnteriorProy');
    const btnSig = document.getElementById('btnSiguienteProy');
    if (btnAnt) {
        btnAnt.onclick = () => { paginaProyectos = Math.max(1, paginaProyectos - 1); mostrarProyectosEnTabla(); agregarEventosAccionesProyectos(); };
    }
    if (btnSig) {
        btnSig.onclick = () => { paginaProyectos = paginaProyectos + 1; mostrarProyectosEnTabla(); agregarEventosAccionesProyectos(); };
    }
}

// Función para agregar eventos a los botones de acción de proyectos
function agregarEventosAccionesProyectos() {
    // Agregar eventos a los botones de editar proyecto
    document.querySelectorAll('.btn-primary[data-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const proyectoId = btn.getAttribute('data-id');
            abrirModalEditarProyecto(proyectoId);
        });
    });
    
    // Agregar eventos a los botones de eliminar proyecto
    document.querySelectorAll('.btn-danger[data-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const proyectoId = btn.getAttribute('data-id');
            abrirModalEliminarProyecto(proyectoId);
        });
    });
}

// Función para abrir el modal de editar proyecto
function abrirModalEditarProyecto(proyectoId) {
    fetch(`/api/proyectos/${proyectoId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar datos del proyecto');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const proyecto = data.proyecto;
                document.getElementById('editarProyectoId').value = proyecto.id;
                document.getElementById('editarNombreProyecto').value = proyecto.nombre || '';
                
                // Formatear fechas para el input date
                if (proyecto.fecha_inicio) {
                    const fechaInicio = new Date(proyecto.fecha_inicio);
                    const fechaInicioFormateada = fechaInicio.toISOString().split('T')[0];
                    document.getElementById('editarFechaInicio').value = fechaInicioFormateada;
                }
                
                if (proyecto.fecha_fin) {
                    const fechaFin = new Date(proyecto.fecha_fin);
                    const fechaFinFormateada = fechaFin.toISOString().split('T')[0];
                    document.getElementById('editarFechaTermino').value = fechaFinFormateada;
                }
                
                // Limpiar y configurar el campo de jefe de proyecto
                const editarBuscadorJefe = document.getElementById('editarBuscadorJefe');
                const editarLimpiarJefeBtn = document.getElementById('editarLimpiarJefeBtn');
                const editarJefeProyectoId = document.getElementById('editarJefeProyectoId');
                
                if (editarBuscadorJefe && editarLimpiarJefeBtn && editarJefeProyectoId) {
                    editarBuscadorJefe.value = '';
                    editarBuscadorJefe.removeAttribute('readonly');
                    editarLimpiarJefeBtn.style.display = 'none';
                    editarJefeProyectoId.value = '';
                    
                    // Si el proyecto tiene un jefe, mostrarlo
                    if (proyecto.responsable_id && proyecto.jefe_nombre) {
                        editarBuscadorJefe.value = proyecto.jefe_nombre;
                        editarBuscadorJefe.setAttribute('readonly', 'readonly');
                        editarLimpiarJefeBtn.style.display = 'block';
                        editarJefeProyectoId.value = proyecto.responsable_id;
                    }
                }
                
                // Mostrar el modal
                const modal = document.getElementById('modalEditarProyecto');
                if (modal) {
                    modal.style.display = 'block';
                }
            } else {
                console.error('Error al cargar datos del proyecto:', data.message);
                alert('Error al cargar datos del proyecto: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error de conexión:', error);
            alert('Error al cargar datos del proyecto: ' + error.message);
        });
}

// Función para abrir el modal de eliminar proyecto
function abrirModalEliminarProyecto(proyectoId) {
    const confirmarEliminarProyecto = document.getElementById('confirmarEliminarProyecto');
    if (confirmarEliminarProyecto) {
        confirmarEliminarProyecto.setAttribute('data-id', proyectoId);
    }
    
    const modal = document.getElementById('modalEliminarProyecto');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Función para manejar la navegación entre secciones
function setupNavigation() {
    // Obtener todos los enlaces del menú
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    
    // Obtener todas las secciones
    const sections = document.querySelectorAll('.dashboard-section');
    
    // Función para activar una sección específica
    function activateSection(sectionId) {
        // Desactivar todas las secciones
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Desactivar todos los enlaces
        menuLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Activar la sección correspondiente
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Activar el enlace correspondiente
        const targetLink = document.querySelector(`.sidebar-menu a[href="#${sectionId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
        // Guardar la sección activa en localStorage para mantenerla al recargar
        localStorage.setItem('activeDashboardSection', sectionId);

        // Cargar contenido según la sección
        if (sectionId === 'revicion_proyectos') {
            if (typeof window.cargarProyectosTarjetas === 'function') {
                window.cargarProyectosTarjetas();
            }
        }
        if (sectionId === 'proyectos') {
            if (typeof window.cargarProyectos === 'function') {
                window.cargarProyectos();
            }
        }
        if (sectionId === 'registro_cambios') {
            if (typeof window.cargarRegistroCambios === 'function') {
                window.cargarRegistroCambios();
            }
        }
    }
    // Exponer activación de sección para que otros módulos controlen la navegación
    window.activateDashboardSection = activateSection;
    
    // Función para mostrar overlay de carga entre secciones
    function showLoadingOverlay(durationMs = 2000, onDone) {
        const overlay = document.getElementById('globalLoader');
        if (!overlay) { onDone && onDone(); return; }
        document.body.classList.add('loading');
        overlay.classList.add('active');
        setTimeout(() => {
            overlay.classList.remove('active');
            document.body.classList.remove('loading');
            onDone && onDone();
        }, durationMs);
    }
    // La navegación de secciones se controla desde setupNavLoader para evitar duplicidades.
    
    // Activar la sección guardada en localStorage o la primera por defecto
    const savedSection = localStorage.getItem('activeDashboardSection');
    if (savedSection && document.getElementById(savedSection)) {
        activateSection(savedSection);
    } else if (sections.length > 0) {
        // Si no hay sección guardada, activar la primera
        activateSection(sections[0].id);
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

// Función para alternar la visibilidad de la contraseña
 

// Evento cuando el DOM está completamente cargado
// Configurar el buscador de jefes para el modal de editar proyecto
window.configurarBuscadorJefesEditar = function() {
    const buscador = document.getElementById('editarBuscadorJefe');
    const resultados = document.getElementById('editarResultadosJefe');
    const limpiarJefeBtn = document.getElementById('editarLimpiarJefeBtn');
    
    if (!buscador || !resultados) {
        console.error('No se encontraron los elementos para el buscador de jefes en el modal de editar');
        return;
    }
    
    // Cargar jefes de proyecto si aún no se han cargado
    if (!jefesProyecto || jefesProyecto.length === 0) {
        fetch('/api/proyectos/jefes')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar jefes de proyecto');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    jefesProyecto = data.jefes || [];
                    console.log('Jefes de proyecto cargados:', jefesProyecto);
                } else {
                    console.error('Error al cargar jefes de proyecto:', data.message);
                }
            })
            .catch(error => {
                console.error('Error de conexión:', error);
            });
    }
    
    // Configurar el botón para limpiar la selección
    if (limpiarJefeBtn) {
        limpiarJefeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const jefeProyectoId = document.getElementById('editarJefeProyectoId');
            
            // Limpiar la selección
            if (jefeProyectoId) jefeProyectoId.value = '';
            buscador.value = '';
            buscador.removeAttribute('readonly');
            limpiarJefeBtn.style.display = 'none';
            
            // Mostrar todos los jefes disponibles al quitar la selección
            setTimeout(() => {
                if (resultados && jefesProyecto && jefesProyecto.length > 0) {
                    window.mostrarResultadosJefesEditar(jefesProyecto);
                    resultados.style.display = 'block';
                }
            }, 100);
        });
    }
    
    // Clonar el input para eliminar eventos anteriores
    const nuevoBuscador = buscador.cloneNode(true);
    buscador.parentNode.replaceChild(nuevoBuscador, buscador);
    
    // Actualizar la referencia al nuevo input
    const editarBuscador = document.getElementById('editarBuscadorJefe');
    
    if (editarBuscador) {
        editarBuscador.addEventListener('click', function() {
            // Si el campo está en modo readonly, no hacer nada
            if (this.hasAttribute('readonly')) {
                return;
            }
            
            // Mostrar todos los jefes disponibles al hacer clic
            window.mostrarResultadosJefesEditar(jefesProyecto);
            resultados.style.display = 'block';
        });
        
        editarBuscador.addEventListener('input', function() {
            const termino = this.value.toLowerCase();
            
            if (termino.length < 2) {
                resultados.style.display = 'none';
                return;
            }
            
            const jefesFiltrados = jefesProyecto.filter(jefe => 
                jefe.nombre.toLowerCase().includes(termino) || 
                jefe.email.toLowerCase().includes(termino)
            );
            
            window.mostrarResultadosJefesEditar(jefesFiltrados);
            resultados.style.display = 'block';
        });
    }
    
    // Configurar evento global para cerrar resultados al hacer clic fuera
    if (!window.clickListenerConfiguredEditar) {
        document.addEventListener('click', function(e) {
            const buscador = document.getElementById('editarBuscadorJefe');
            const resultados = document.getElementById('editarResultadosJefe');
            
            if (buscador && resultados && !buscador.contains(e.target) && !resultados.contains(e.target)) {
                resultados.style.display = 'none';
            }
        });
        window.clickListenerConfiguredEditar = true;
    }
};

// Función para mostrar resultados de jefes de proyecto en el modal de editar
window.mostrarResultadosJefesEditar = function(jefes) {
    const resultadosJefe = document.getElementById('editarResultadosJefe');
    
    if (!resultadosJefe) {
        console.error('No se encontró el elemento de resultados de jefes en el modal de editar');
        return;
    }
    
    resultadosJefe.innerHTML = '';
    
    if (jefes.length === 0) {
        const item = document.createElement('div');
        item.className = 'resultado-item';
        item.textContent = 'No se encontraron jefes de proyecto';
        resultadosJefe.appendChild(item);
        return;
    }
    
    jefes.forEach(jefe => {
        const item = document.createElement('div');
        item.className = 'resultado-item';
        item.textContent = `${jefe.nombre} (${jefe.email})`;
        item.setAttribute('data-id', jefe.id);
        item.addEventListener('click', function() {
            window.seleccionarJefeEditar(jefe.id, jefe.nombre);
            resultadosJefe.style.display = 'none';
        });
        
        resultadosJefe.appendChild(item);
    });
};

// Función para seleccionar un jefe de proyecto en el modal de editar
window.seleccionarJefeEditar = function(id, nombre) {
    const jefeProyectoId = document.getElementById('editarJefeProyectoId');
    const buscadorJefe = document.getElementById('editarBuscadorJefe');
    const limpiarJefeBtn = document.getElementById('editarLimpiarJefeBtn');
    
    if (!jefeProyectoId || !buscadorJefe || !limpiarJefeBtn) {
        console.error('No se encontraron los elementos para seleccionar jefe en el modal de editar');
        return;
    }
    
    // Guardar el ID del jefe seleccionado
    jefeProyectoId.value = id;
    
    // Mostrar el nombre del jefe en el campo de búsqueda
    buscadorJefe.value = nombre;
    
    // Mostrar el botón para limpiar la selección
    limpiarJefeBtn.style.display = 'block';
    
    // Desactivar el campo de búsqueda mientras hay un jefe seleccionado
    buscadorJefe.setAttribute('readonly', 'readonly');
    
    // Configurar el botón para limpiar la selección
    // Eliminar eventos anteriores para evitar duplicados
    const nuevoBtn = limpiarJefeBtn.cloneNode(true);
    limpiarJefeBtn.parentNode.replaceChild(nuevoBtn, limpiarJefeBtn);
    
    // Actualizar la referencia al nuevo botón
    const limpiarBtn = document.getElementById('editarLimpiarJefeBtn');
    
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Limpiar la selección
            jefeProyectoId.value = '';
            buscadorJefe.value = '';
            buscadorJefe.removeAttribute('readonly');
            limpiarBtn.style.display = 'none';
            
            // Mostrar todos los jefes disponibles al quitar la selección
            setTimeout(() => {
                const resultadosJefe = document.getElementById('editarResultadosJefe');
                if (resultadosJefe && jefesProyecto && jefesProyecto.length > 0) {
                    window.mostrarResultadosJefesEditar(jefesProyecto);
                    resultadosJefe.style.display = 'block';
                }
            }, 100);
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Cargar información del usuario actual
    fetch('/api/usuario/info')
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Redirigir al login si no está autenticado o no tiene permisos
                    window.location.href = '/login';
                    throw new Error('No autenticado o sin permisos');
                }
                throw new Error('Error al cargar información del usuario');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const usuario = data.usuario;
                const nombreUsuario = document.querySelector('.sidebar-header h2');
                if (nombreUsuario) {
                    nombreUsuario.textContent = usuario.nombre;
                }
                
                // Verificar si el usuario es administrador (aceptar 'administrador' o 'admin')
                if (usuario.rol !== 'administrador' && usuario.rol !== 'admin') {
                    console.error('Acceso denegado: no es administrador');
                    window.location.href = '/login';
                    return;
                }
                
                // Configurar la navegación entre secciones
    setupNavigation();
                
                updateTopCorreoBadge();
                setInterval(updateTopCorreoBadge, 30000);
                
                
                // Configurar logout con confirmación
                setupLogout();

                // --- Toggle del menú en el topbar ---
                const topbar = document.querySelector('.topbar');
                const toggleBtn = document.querySelector('.menu-toggle');
                const menu = topbar ? topbar.querySelector('.sidebar-menu') : null;
                if (topbar && toggleBtn) {
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

                    toggleBtn.addEventListener('click', function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        if (topbar.classList.contains('open')) { closeMenu(); } else { openMenu(); }
                    });

                    // Cerrar al hacer click fuera
                    document.addEventListener('click', function(e){
                        if (topbar && !topbar.contains(e.target)) { closeMenu(); }
                    });
                }
                // Cerrar menú y animar contenido al seleccionar una sección
                const main = document.querySelector('.main-content');
                document.querySelectorAll('.sidebar-menu a[href^="#"]').forEach(a => {
                    a.addEventListener('click', () => {
                        if (topbar && topbar.classList.contains('open')) {
                            // usa el mismo cierre animado
                            const icon = toggleBtn ? toggleBtn.querySelector('i') : null;
                            const menu = topbar.querySelector('.sidebar-menu');
                            const hasAnime = typeof window !== 'undefined' && window.anime;
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
                        }
                        if (main) {
                            main.classList.add('content-enter');
                            setTimeout(() => main.classList.remove('content-enter'), 300);
                        }
                    });
                });
            } else {
                console.error('Error al cargar información del usuario:', data.message);
                window.location.href = '/login';
            }
        })
        .catch(error => {
            console.error('Error de conexión:', error);
            // No redirigir aquí para evitar redirecciones en caso de errores temporales de red
        });
    
    // Configurar eventos para la búsqueda de usuarios
    const busquedaUsuario = document.getElementById('busquedaUsuario');
    if (busquedaUsuario) {
        busquedaUsuario.addEventListener('input', function() {
            terminoBusqueda = this.value;
            paginaActual = 1; // Volver a la primera página al buscar
            filtrarYMostrarUsuarios();
        });
    }
    
    // Configurar evento para el selector de cantidad de registros
    const cantidadRegistros = document.getElementById('cantidadRegistros');
    if (cantidadRegistros) {
        cantidadRegistros.addEventListener('change', function() {
            cantidadPorPagina = parseInt(this.value);
            paginaActual = 1; // Volver a la primera página al cambiar la cantidad
            filtrarYMostrarUsuarios();
        });
    }
    
    // Configurar eventos para los botones de paginación
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    
    if (btnAnterior) {
        btnAnterior.addEventListener('click', function() {
            if (paginaActual > 1) {
                paginaActual--;
                mostrarUsuariosEnTabla();
            }
        });
    }
    
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', function() {
            const totalPaginas = Math.ceil(usuariosFiltrados.length / cantidadPorPagina);
            if (paginaActual < totalPaginas) {
                paginaActual++;
                mostrarUsuariosEnTabla();
            }
        });
    }
    
    // Configurar eventos para cerrar modales
    const closeEditarUsuario = document.getElementById('closeEditarUsuario');
    const closeEliminarUsuario = document.getElementById('closeEliminarUsuario');
    const closeEditarProyecto = document.getElementById('closeEditarProyecto');
    const closeEliminarProyecto = document.getElementById('closeEliminarProyecto');
    
    const modalEditarUsuario = document.getElementById('modalEditarUsuario');
    const modalEliminarUsuario = document.getElementById('modalEliminarUsuario');
    const modalEditarProyecto = document.getElementById('modalEditarProyecto');
    const modalEliminarProyecto = document.getElementById('modalEliminarProyecto');
    
    if (closeEditarUsuario && modalEditarUsuario) {
        closeEditarUsuario.addEventListener('click', function() {
            modalEditarUsuario.style.display = 'none';
        });
    }
    
    if (closeEliminarUsuario && modalEliminarUsuario) {
        closeEliminarUsuario.addEventListener('click', function() {
            modalEliminarUsuario.style.display = 'none';
        });
    }
    
    if (closeEditarProyecto && modalEditarProyecto) {
        closeEditarProyecto.addEventListener('click', function() {
            modalEditarProyecto.style.display = 'none';
        });
    }
    
    if (closeEliminarProyecto && modalEliminarProyecto) {
        closeEliminarProyecto.addEventListener('click', function() {
            modalEliminarProyecto.style.display = 'none';
        });
    }
    
    // Configurar evento para el formulario de editar usuario
    const formEditarUsuario = document.getElementById('formEditarUsuario');
    if (formEditarUsuario) {
        formEditarUsuario.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = formEditarUsuario.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            
            const userId = document.getElementById('editarUsuarioId').value;
            const nombre = document.getElementById('editarNombre').value;
            const email = document.getElementById('editarEmail').value;
            const rol = document.getElementById('editarRol').value;
            const activo = document.getElementById('editarEstado').value === 'activo';
            
            console.log('Valores del formulario al enviar:');
            console.log('- userId:', userId);
            console.log('- nombre:', nombre);
            console.log('- email:', email);
            console.log('- rol:', rol);
            console.log('- activo:', activo);
            
            // Validar que los campos requeridos no estén vacíos
            if (!nombre.trim()) {
                throw new Error('El nombre es requerido');
            }
            if (!email.trim()) {
                throw new Error('El email es requerido');
            }
            if (!rol || rol.trim() === '') {
                throw new Error('El rol es requerido');
            }
            
            // Validar que el rol sea uno de los valores permitidos
            const rolesPermitidos = ['administrador', 'jefe_proyecto', 'miembro'];
            if (!rolesPermitidos.includes(rol)) {
                throw new Error('El rol seleccionado no es válido');
            }
            
            // Crear objeto con los datos del usuario
            const userData = { nombre, email, rol, activo };
            
            try {
                const response = await fetch(`/api/usuarios/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                let data = {};
                try {
                    data = await response.json();
                } catch (_) {}

                if (!response.ok) {
                    const msg = data?.message || data?.error || 'Error al actualizar usuario';
                    throw new Error(msg);
                }

                if (data.success) {
                    modalEditarUsuario.style.display = 'none';
                    cargarUsuarios();
                    Swal.fire({
                        icon: 'success',
                        title: 'Actualizado',
                        text: 'Usuario actualizado exitosamente',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    const msg = data?.message || 'No se pudo actualizar el usuario';
                    throw new Error(msg);
                }
            } catch (error) {
                console.error('Error al actualizar usuario:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: String(error.message || error)
                });
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
    
    // Configurar evento para confirmar eliminación de usuario
    const confirmarEliminarUsuario = document.getElementById('confirmarEliminarUsuario');
    if (confirmarEliminarUsuario) {
        confirmarEliminarUsuario.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            
            fetch(`/api/usuarios/${userId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al eliminar usuario');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    modalEliminarUsuario.style.display = 'none';
                    cargarUsuarios();
                } else {
                    console.error('Error al eliminar usuario:', data.message);
                }
            })
            .catch(error => {
                console.error('Error de conexión:', error);
            });
        });
    }
    
    // Configurar evento para el formulario de crear proyecto
    const formCrearProyecto = document.getElementById('formCrearProyecto');
    if (formCrearProyecto) {
        formCrearProyecto.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nombreProyecto = document.getElementById('nombreProyecto').value;
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaTermino = document.getElementById('fechaTermino').value;
            const jefeProyectoId = document.getElementById('jefeProyectoId')?.value || null;
            
            const proyectoData = {
                nombre_proyecto: nombreProyecto,
                descripcion_proyecto: "", // Añadiendo descripción vacía ya que es requerida por el backend
                fecha_inicio: fechaInicio,
                fecha_fin: fechaTermino,
                responsable_id: jefeProyectoId
            };
            
            console.log('Enviando datos del proyecto:', proyectoData);
            
            fetch('/api/proyectos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(proyectoData)
            })
            .then(response => {
                console.log('Respuesta del servidor:', response.status);
                if (!response.ok) {
                    return response.json().then(errorData => {
                        console.error('Error del servidor:', errorData);
                        throw new Error(errorData.message || 'Error al crear proyecto');
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Datos de respuesta:', data);
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'Proyecto creado exitosamente',
                        showConfirmButton: false,
                        timer: 1500,
                        background: '#fff',
                        customClass: {
                            title: 'text-success',
                            popup: 'border-success'
                        }
                    });
                    formCrearProyecto.reset();
            
                    // Limpiar la selección del jefe de proyecto
                    const buscadorJefe = document.getElementById('buscadorJefe');
                    const limpiarJefeBtn = document.getElementById('limpiarJefeBtn');
                    
                    if (buscadorJefe) {
                        buscadorJefe.value = '';
                        buscadorJefe.removeAttribute('readonly');
                    }
                    
                    if (limpiarJefeBtn) {
                        limpiarJefeBtn.style.display = 'none';
                    }
                    
                    jefeSeleccionadoId = null;
                    window.cargarProyectos();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error al crear proyecto: ' + data.message,
                        confirmButtonColor: '#4e73df'
                    });
                    console.error('Error al crear proyecto:', data.message);
                }
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: error.message,
                    confirmButtonColor: '#4e73df'
                });
                console.error('Error de conexión:', error);
            });
        });
    }
    
    // Configurar evento para el formulario de editar proyecto
    const formEditarProyecto = document.getElementById('formEditarProyecto');
    if (formEditarProyecto) {
        formEditarProyecto.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const proyectoId = document.getElementById('editarProyectoId').value;
            const nombre = document.getElementById('editarNombreProyecto').value;
            const fechaInicio = document.getElementById('editarFechaInicio').value;
            const fechaTermino = document.getElementById('editarFechaTermino').value;
            const responsableId = document.getElementById('editarJefeProyectoId').value;
            
            const proyectoData = {
                nombre_proyecto: nombre,
                descripcion_proyecto: "",
                fecha_inicio: fechaInicio,
                fecha_fin: fechaTermino,
                responsable_id: responsableId || null
            };
            
            console.log('Enviando datos para actualizar proyecto:', proyectoData);
            
            fetch(`/api/proyectos/${proyectoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(proyectoData)
            })
            .then(response => {
                console.log('Respuesta del servidor:', response.status);
                if (!response.ok) {
                    return response.json().then(errorData => {
                        console.error('Error del servidor:', errorData);
                        throw new Error(errorData.message || 'Error al actualizar proyecto');
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Datos de respuesta:', data);
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'Proyecto actualizado exitosamente',
                        showConfirmButton: false,
                        timer: 1500,
                        background: '#fff',
                        customClass: {
                            title: 'text-success',
                            popup: 'border-success'
                        }
                    });
                    modalEditarProyecto.style.display = 'none';
                    window.cargarProyectos();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error al actualizar proyecto: ' + data.message,
                        confirmButtonColor: '#4e73df'
                    });
                    console.error('Error al actualizar proyecto:', data.message);
                }
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: error.message,
                    confirmButtonColor: '#4e73df'
                });
                console.error('Error de conexión:', error);
            });
        });
    }
    
    // Configurar evento para confirmar eliminación de proyecto
    const confirmarEliminarProyecto = document.getElementById('confirmarEliminarProyecto');
    if (confirmarEliminarProyecto) {
        confirmarEliminarProyecto.addEventListener('click', function() {
            const proyectoId = this.getAttribute('data-id');
            
            fetch(`/api/proyectos/${proyectoId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al eliminar proyecto');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: 'El proyecto ha sido eliminado exitosamente',
                        showConfirmButton: false,
                        timer: 1500,
                        background: '#fff',
                        customClass: {
                            title: 'text-success',
                            popup: 'border-success'
                        }
                    });
                    modalEliminarProyecto.style.display = 'none';
                    window.cargarProyectos();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error al eliminar proyecto: ' + data.message,
                        confirmButtonColor: '#4e73df'
                    });
                    console.error('Error al eliminar proyecto:', data.message);
                }
            })
            .catch(error => {
                console.error('Error de conexión:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: error.message,
                    confirmButtonColor: '#4e73df'
                });
            });
        });
    }
    
    // Cargar datos iniciales
    cargarUsuarios();
    window.cargarJefesProyecto();
    window.cargarProyectos();
    
    // Configurar el buscador de jefes para el modal de editar
    window.configurarBuscadorJefesEditar();
});

// Manejar el formulario de creación de usuarios y se ha mejorado la lógica de paginación para evitar errores al eliminar usuarios
const formCrearUsuario = document.getElementById('formCrearUsuario');
if (formCrearUsuario) {
    formCrearUsuario.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            rol: document.getElementById('rol').value
        };
        
        fetch('/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Usuario creado exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
                
                // Limpiar el formulario
                formCrearUsuario.reset();
                
                // Recargar la lista de usuarios
                cargarUsuarios();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Error al crear usuario'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error de conexión'
            });
        });
    });
}

// Toggle de visibilidad de contraseña
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', function() {
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
}

// Función modificada para mostrar usuarios en la tabla
function mostrarUsuariosEnTabla() {
    const tablaBody = document.querySelector('#tablaUsuarios tbody');
    if (!tablaBody) return;
    
    tablaBody.innerHTML = '';
    
    if (usuariosFiltrados.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" class="text-center">No se encontraron usuarios</td>';
        tablaBody.appendChild(tr);
        actualizarInfoPaginacion();
        return;
    }
    
    // Calcular índices para la paginación
    const inicio = (paginaActual - 1) * cantidadPorPagina;
    const fin = Math.min(inicio + cantidadPorPagina, usuariosFiltrados.length);
    const usuariosPagina = usuariosFiltrados.slice(inicio, fin);
    
    usuariosPagina.forEach(usuario => {
        const tr = document.createElement('tr');
        const estadoTexto = usuario.activo ? 'Activo' : 'Inactivo';
        const estadoClase = usuario.activo ? 'badge-success' : 'badge-danger';
        
        tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>${usuario.rol}</td>
            <td><span class="badge ${estadoClase}">${estadoTexto}</span></td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="abrirModalEditarUsuario(${usuario.id})" title="Editar usuario">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="abrirModalEliminarUsuario(${usuario.id})" title="Eliminar usuario">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tablaBody.appendChild(tr);
    });
    
    actualizarInfoPaginacion();
}

// Función para actualizar la información de paginación
function actualizarInfoPaginacion() {
    const totalPaginas = Math.ceil(usuariosFiltrados.length / cantidadPorPagina);
    const inicio = usuariosFiltrados.length > 0 ? (paginaActual - 1) * cantidadPorPagina + 1 : 0;
    const fin = Math.min(inicio + cantidadPorPagina - 1, usuariosFiltrados.length);
    
    document.getElementById('infoRegistros').textContent = 
        `Mostrando ${inicio} a ${fin} de ${usuariosFiltrados.length} registros`;
    document.getElementById('paginaActual').textContent = `Página ${paginaActual}`;
    
    document.getElementById('btnAnterior').disabled = paginaActual <= 1;
    document.getElementById('btnSiguiente').disabled = paginaActual >= totalPaginas;
}

// Event listener para cambio en cantidad de registros por página
document.getElementById('cantidadRegistros').addEventListener('change', function() {
    cantidadPorPagina = parseInt(this.value);
    paginaActual = 1; // Resetear a la primera página
    mostrarUsuariosEnTabla();
});

// ----- Tarjetas de Proyectos y Detalle de Tareas -----
window.cargarProyectosTarjetas = function() {
    const grid = document.getElementById('proyectosGrid');
    if (!grid) return;

    fetch('/api/proyectos')
        .then(r => r.json())
        .then(data => {
            if (!data.success) throw new Error(data.error || 'Error al cargar proyectos');
            const proyectos = Array.isArray(data.proyectos) ? data.proyectos : [];
            grid.innerHTML = '';
            if (proyectos.length === 0) {
                grid.innerHTML = '<p>No hay proyectos registrados.</p>';
                return;
            }
            proyectos.forEach(p => {
                const card = document.createElement('div');
                card.className = 'project-card';
                const porcentaje = Number(p.porcentaje_avance || 0);
                // Fechas legibles
                let fechaInicio = 'No definida';
                let fechaFin = 'No definida';
                try {
                    if (p.fecha_inicio) fechaInicio = new Date(p.fecha_inicio).toLocaleDateString();
                    if (p.fecha_fin) fechaFin = new Date(p.fecha_fin).toLocaleDateString();
                } catch {}
                // Estado y badge
                const estadoDB = p.estado || 'pendiente';
                const estadoLabelMap = {
                    pendiente: 'Pendiente',
                    en_progreso: 'En progreso',
                    completada: 'Completada',
                    revisando: 'Revisando'
                };
                const estadoLabel = estadoLabelMap[estadoDB] || estadoDB;

                card.innerHTML = `
                    <div class="project-card-top">
                        <h4>${p.nombre || 'Proyecto'}</h4>
                        <span class="status-badge ${estadoDB}">${estadoLabel}</span>
                    </div>
                    <div class="project-progress">
                        <div class="progress"><div class="progress-bar" style="width:${porcentaje}%"></div></div>
                        <span>${porcentaje}%</span>
                    </div>
                    <div class="mini-summary">
                        <div class="summary-item" title="Jefe de proyecto">
                            <i class="fas fa-user-tie"></i>
                            <span>${p.jefe_nombre || 'Sin asignar'}</span>
                        </div>
                        <div class="summary-item" title="Rango de fechas">
                            <i class="far fa-calendar-alt"></i>
                            <span>${fechaInicio} — ${fechaFin}</span>
                        </div>
                    </div>
                `;
                card.addEventListener('click', () => { window.location.href = '/admin/proyecto/' + p.id; });
                grid.appendChild(card);
            });
        })
        .catch(err => {
            console.error('Error cargando proyectos:', err);
            grid.innerHTML = '<p>Error al cargar proyectos. Intente nuevamente.</p>';
        });
};

window.cargarRegistroCambios = async function() {
    const tbody = document.querySelector('#tablaRegistroCambios tbody');
    const select = document.getElementById('selectProyectoCambios');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando registro de cambios...</td></tr>';
    try {
        const rProy = await fetch('/api/proyectos');
        const dProy = await rProy.json();
        const proyectos = dProy && dProy.success ? (dProy.proyectos || []) : [];
        const projectMap = new Map(proyectos.map(p => [p.id, p]));
        let events = [];
        proyectos.forEach(p => {
            if (p.created_at) {
                events.push({ type: 'proyecto', projectId: p.id, title: 'Proyecto creado', detail: p.nombre || 'Proyecto', date: new Date(p.created_at) });
            }
            if (typeof p.porcentaje_avance === 'number' && p.created_at) {
                events.push({ type: 'porcentaje', projectId: p.id, title: 'Porcentaje de avance', detail: `${p.porcentaje_avance}%`, date: new Date(p.created_at) });
            }
            if (p.estado && p.created_at) {
                events.push({ type: 'estado', projectId: p.id, title: 'Estado del proyecto', detail: p.estado, date: new Date(p.created_at) });
            }
        });
        const tareasPromises = proyectos.map(p => fetch(`/api/tareas/proyecto/${p.id}`).then(r => r.json().catch(() => ({}))).then(d => ({ pid: p.id, tareas: d && d.success ? (d.tareas || []) : [] })).catch(() => ({ pid: p.id, tareas: [] })));
        const docsPromises = proyectos.map(p => fetch(`/api/proyectos/${p.id}/documentos`).then(r => r.json().catch(() => ({}))).then(d => ({ pid: p.id, documentos: d && d.success ? (d.documentos || []) : [] })).catch(() => ({ pid: p.id, documentos: [] })));
        const asignRes = await fetch('/api/asignaciones').then(r => r.json().catch(() => ({}))).catch(() => ({}));
        const asignaciones = asignRes && asignRes.success ? (asignRes.asignaciones || []) : [];
        const tareasResults = await Promise.all(tareasPromises);
        const docsResults = await Promise.all(docsPromises);
        tareasResults.forEach(({ pid, tareas }) => {
            tareas.forEach(t => {
                if (t.created_at) {
                    events.push({ type: 'tarea', projectId: pid, title: 'Tarea creada', detail: t.titulo || 'Tarea', date: new Date(t.created_at) });
                }
            });
        });
        docsResults.forEach(({ pid, documentos }) => {
            documentos.forEach(doc => {
                const f = doc.fecha_subida ? new Date(doc.fecha_subida) : null;
                events.push({ type: 'documento', projectId: pid, title: 'Documento subido', detail: doc.nombre_archivo || 'Documento', who: doc.subido_por || '', date: f });
            });
        });
        asignaciones.forEach(a => {
            const f = a.created_at ? new Date(a.created_at) : null;
            events.push({ type: 'asignacion', projectId: a.proyecto_id, title: 'Miembro asignado', detail: a.usuario_nombre || a.usuario_id || '', date: f });
        });
        events = events.filter(e => e.date instanceof Date && !Number.isNaN(e.date.getTime()));
        events.sort((a, b) => b.date.getTime() - a.date.getTime());

        window._registroCambios = { events, projectMap };

        const render = (projectId) => {
            const filtered = projectId && projectId !== '__all__'
                ? events.filter(ev => String(ev.projectId) === String(projectId))
                : events;
            tbody.innerHTML = '';
            if (filtered.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="4" class="text-center">Sin cambios</td>';
                tbody.appendChild(tr);
                return;
            }
            filtered.forEach(ev => {
                const p = projectMap.get(ev.projectId);
                const pName = p ? (p.nombre || `Proyecto ${ev.projectId}`) : `Proyecto ${ev.projectId}`;
                const fechaTxt = ev.date ? ev.date.toLocaleString() : '';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${fechaTxt}</td>
                    <td>${pName}</td>
                    <td>${ev.title}</td>
                    <td>${ev.detail}${ev.who ? ' · ' + ev.who : ''}</td>
                `;
                tbody.appendChild(tr);
            });
        };

        if (select) {
            while (select.options.length > 1) { select.remove(1); }
            proyectos.forEach(p => {
                const opt = document.createElement('option');
                opt.value = String(p.id);
                opt.textContent = p.nombre || `Proyecto ${p.id}`;
                select.appendChild(opt);
            });
            const old = select.cloneNode(true);
            select.parentNode.replaceChild(old, select);
            old.addEventListener('change', (e) => render(e.target.value));
        }

        render('__all__');
    } catch (err) {
        console.error('Error al cargar registro de cambios:', err);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar registro de cambios</td></tr>';
    }
};

function mapEstadoDBaUI(estado) {
    switch (estado) {
        case 'en_progreso': return 'haciendo';
        case 'completada': return 'hecho';
        case 'revisando': return 'revisando';
        case 'pendiente': return 'pendiente';
        default: return estado || 'pendiente';
    }
}

function mapEstadoUIaDB(estado) {
    switch (estado) {
        case 'haciendo': return 'en_progreso';
        case 'hecho': return 'completada';
        case 'revisando': return 'revisando';
        case 'pendiente': return 'pendiente';
        default: return 'pendiente';
    }
}

function abrirProyectoDetalle(proyectoId, nombreProyecto) {
    const card = document.getElementById('proyectoDetalleCard');
    const titulo = document.getElementById('proyectoDetalleTitulo');
    const tareasTable = document.getElementById('tablaTareasProyecto');
    const tareasTBody = tareasTable ? tareasTable.querySelector('tbody') : null;
    // Fallback para código antiguo basado en lista; evita errores si aún existe lógica vieja
    const lista = { innerHTML: '', appendChild: () => {} };
    if (!card || !titulo || !tareasTBody) return;

    titulo.innerHTML = `<i class="fas fa-tasks"></i> Tareas del Proyecto: ${nombreProyecto || ''}`;
    card.style.display = 'block';
    tareasTBody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando tareas...</td></tr>';

    // Cargar información del líder y preparar tabla de miembros
    const liderEl = document.getElementById('proyectoInfoLider');
    const miembrosTable = document.getElementById('tablaMiembrosProyecto');
    const miembrosTBody = miembrosTable ? miembrosTable.querySelector('tbody') : null;
    if (liderEl) liderEl.textContent = 'Cargando...';
    if (miembrosTBody) miembrosTBody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando miembros...</td></tr>';

    // Detalle del proyecto para obtener líder y miembros
    fetch(`/api/proyectos/${proyectoId}`)
        .then(r => r.json())
        .then(d => {
            // Líder
            if (liderEl) {
                const nombreLider = d && d.success && d.proyecto ? (d.proyecto.jefe_nombre || null) : null;
                liderEl.textContent = nombreLider || 'Sin asignar';
            }

            // Renderizar miembros del proyecto en la tabla
            const miembros = d && d.success && d.proyecto && Array.isArray(d.proyecto.miembros) ? d.proyecto.miembros : [];
            if (miembrosTBody) {
                miembrosTBody.innerHTML = '';
                if (miembros.length === 0) {
                    miembrosTBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay miembros asignados</td></tr>';
                } else {
                    miembros.forEach(m => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${m.nombre || '-'}</td>
                            <td>${m.email || '-'}</td>
                            <td>${m.rol || '-'}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-danger btn-remove-member" data-asignacion-id="${m.asignacion_id}" title="Quitar del proyecto">
                                    <i class="fas fa-user-minus"></i> Quitar
                                </button>
                            </td>
                        `;
                        const btn = tr.querySelector('.btn-remove-member');
                        if (btn) {
                            if (!m.asignacion_id) {
                                btn.disabled = true;
                                btn.title = 'No se encontró la asignación';
                            } else {
                                btn.addEventListener('click', async () => {
                                    const result = await Swal.fire({
                                        icon: 'warning',
                                        title: '¿Desea quitar a este miembro?',
                                        text: `${m.nombre || 'Miembro'} será removido del proyecto`,
                                        showCancelButton: true,
                                        confirmButtonText: 'Sí, quitar',
                                        cancelButtonText: 'No, cancelar'
                                    });
                                    if (!result.isConfirmed) return;
                                    try {
                                        btn.disabled = true;
                                        const resp = await fetch(`/api/asignaciones/${m.asignacion_id}`, { method: 'DELETE' });
                                        if (!resp.ok) throw new Error('Error al eliminar asignación');
                                        await Swal.fire({ icon: 'success', title: 'Miembro eliminado', timer: 1200, showConfirmButton: false });
                                        // Recargar detalle para reflejar cambios
                                        abrirProyectoDetalle(proyectoId, nombreProyecto);
                                    } catch (err) {
                                        console.error('Error eliminando miembro:', err);
                                        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo quitar al miembro del proyecto' });
                                        btn.disabled = false;
                                    }
                                });
                            }
                        }
                        miembrosTBody.appendChild(tr);
                    });
                }
            }
        })
        .catch(err => {
            console.error('Error cargando líder/miembros del proyecto:', err);
            if (liderEl) liderEl.textContent = 'Error al cargar';
            if (miembrosTBody) miembrosTBody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar miembros</td></tr>';
        });

    // Miembros se cargan desde el detalle del proyecto

    fetch(`/api/tareas/proyecto/${proyectoId}`)
        .then(r => r.json())
        .then(data => {
            tareasTBody.innerHTML = '';
            // Soportar tanto respuesta normalizada { success, tareas } como arreglo directo
            const tareas = Array.isArray(data) ? data : (data && data.success ? (data.tareas || []) : []);
            if (!Array.isArray(tareas) || tareas.length === 0) {
                tareasTBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay tareas para este proyecto</td></tr>';
                return;
            }
            tareas.forEach(t => {
                const estadoUI = mapEstadoDBaUI(t.estado);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${t.titulo || 'Tarea'}</td>
                    <td>${t.descripcion || '-'}</td>
                    <td>
                        <select class="task-status" data-tarea-id="${t.id}">
                            <option value="pendiente" ${estadoUI === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="haciendo" ${estadoUI === 'haciendo' ? 'selected' : ''}>Haciendo</option>
                            <option value="revisando" ${estadoUI === 'revisando' ? 'selected' : ''}>Revisando</option>
                            <option value="hecho" ${estadoUI === 'hecho' ? 'selected' : ''}>Hecho</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1" onclick="editarTarea(${t.id}, '${(t.titulo || '').replace(/'/g, "\\'")}', '${(t.descripcion || '').replace(/'/g, "\\'")}', ${proyectoId})" title="Editar tarea">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarTarea(${t.id}, ${proyectoId})" title="Eliminar tarea">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                const select = tr.querySelector('.task-status');
                select.addEventListener('change', async (e) => {
                    try {
                        const response = await fetch(`/api/tareas/${t.id}/estado`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ estado: e.target.value })
                        });
                        
                        if (!response.ok) throw new Error('Error al actualizar estado');
                        
                        // Recargar tarjetas para actualizar porcentajes
                        cargarProyectosTarjetas();
                        
                        Swal.fire({
                            icon: 'success',
                            title: 'Estado actualizado',
                            showConfirmButton: false,
                            timer: 1500
                        });
                    } catch (error) {
                        console.error('Error:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo actualizar el estado de la tarea'
                        });
                        // Revertir el cambio en el select
                        e.target.value = estadoUI;
                    }
                });
                
                tareasTBody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error('Error al cargar tareas del proyecto:', err);
            if (tareasTBody) tareasTBody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar tareas</td></tr>';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las tareas del proyecto.'
            });
        });
}

// Exponer funciones al ámbito global para su uso desde otros scripts
window.abrirProyectoDetalle = abrirProyectoDetalle;

// --- Modal de Asignación de Tareas ---
document.addEventListener('DOMContentLoaded', () => {
    const btnAbrirAsignacion = document.getElementById('btnAbrirAsignacionTareas');
    const modalAsignacion = document.getElementById('modalAsignacionTareas');
    const cerrarAsignacionBtn = document.getElementById('closeModalAsignacionTareas');
    const cancelarAsignacionBtn = document.getElementById('cancelarModalAsignacion');

    if (btnAbrirAsignacion && modalAsignacion) {
        btnAbrirAsignacion.addEventListener('click', () => {
            modalAsignacion.style.display = 'block';
            try {
                if (typeof cargarProyectosParaTareas === 'function') {
                    cargarProyectosParaTareas();
                }
            } catch (err) {
                console.warn('No se pudo cargar proyectos en el modal:', err);
            }
        });
    }

    const cerrarModalAsignacion = () => {
        if (modalAsignacion) modalAsignacion.style.display = 'none';
    };

    if (cerrarAsignacionBtn) {
        cerrarAsignacionBtn.addEventListener('click', cerrarModalAsignacion);
    }
    if (cancelarAsignacionBtn) {
        cancelarAsignacionBtn.addEventListener('click', cerrarModalAsignacion);
    }
    window.addEventListener('click', (event) => {
        if (event.target === modalAsignacion) cerrarModalAsignacion();
    });
});

// Configuración de cierre de sesión con confirmación
function setupLogout(){
    const btn = document.getElementById('logoutBtn');
    if(!btn) return;
    btn.addEventListener('click', function(e){
        e.preventDefault();
        // Suprimir cualquier loader disparado por otros listeners al abrir el modal
        window.__suppressLoader = true;
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Deseas cerrar sesión ahora?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4D5180',
            cancelButtonColor: '#6c757d'
        }).then(async (result) => {
            if(result.isConfirmed){
                try {
                    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true });
                } catch (_) {}
                window.__suppressLoader = true;
                window.location.href = '/login';
            } else {
                // Reactivar loader para la navegación normal tras cancelar
                window.__suppressLoader = false;
                // Al cancelar, navegar a la sección Usuarios dentro del panel
                const usuariosLink = document.querySelector('.sidebar-menu a[href="#usuarios"]');
                if (usuariosLink) {
                    usuariosLink.click();
                } else {
                    window.location.href = '/dashboard/admin#usuarios';
                }
            }
        });
    });
}

    // ----- Asignación de Miembros a Proyecto -----
// Cargar opciones de proyectos y miembros para el formulario de asignación
window.cargarOpcionesAsignacion = function() {
    const selProyecto = document.getElementById('proyectoAsignacion');
    const selMiembro = document.getElementById('miembroAsignacion');
    if (!selProyecto || !selMiembro) return;

    // Poblar proyectos
    fetch('/api/proyectos')
        .then(r => r.json())
        .then(data => {
            const proyectos = data && data.success ? (data.proyectos || []) : [];
            // Limpiar excepto placeholder
            selProyecto.innerHTML = '<option value="">Seleccione un proyecto...</option>';
            proyectos.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.nombre || `Proyecto ${p.id}`;
                selProyecto.appendChild(opt);
            });
            // Actualizar contador de proyectos
            const totalProyectosEl = document.getElementById('totalProyectos');
            if (totalProyectosEl) totalProyectosEl.textContent = proyectos.length;
        })
        .catch(err => console.error('Error cargando proyectos para asignación:', err));

    // Poblar miembros (rol miembro o trabajador, activos)
    fetch('/api/usuarios')
        .then(r => r.json())
        .then(data => {
            const usuarios = data && data.success ? (data.usuarios || []) : [];
            const candidatos = usuarios.filter(u => (u.rol === 'miembro' || u.rol === 'trabajador') && u.activo);
            selMiembro.innerHTML = '<option value="">Seleccione un miembro...</option>';
            candidatos.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = `${u.nombre} (${u.email})`;
                selMiembro.appendChild(opt);
            });
            // Actualizar contador de miembros
            const totalMiembrosEl = document.getElementById('totalMiembros');
            if (totalMiembrosEl) totalMiembrosEl.textContent = candidatos.length;
        })
        .catch(err => console.error('Error cargando miembros para asignación:', err));
};

// Renderizar tabla de asignaciones (opcionalmente por proyecto)
window.cargarAsignacionesTabla = function(proyectoId = null) {
    const list = document.getElementById('asignacionesLista');
    const tbody = document.querySelector('#tablaTrabajadoresAsignados tbody');
    // Preferir la lista de tarjetas si existe; si no, usar tabla legacy
    if (list) {
        list.innerHTML = '<div class="muted">Cargando asignaciones...</div>';
    } else if (tbody) {
        tbody.innerHTML = '<tr><td colspan="4">Cargando asignaciones...</td></tr>';
    }

    const url = proyectoId ? `/api/asignaciones?proyecto_id=${proyectoId}` : '/api/asignaciones';
    fetch(url)
        .then(r => r.json())
        .then(data => {
            const asignaciones = data && data.success ? (data.asignaciones || []) : [];
            if (list) {
                list.innerHTML = '';
                if (asignaciones.length > 0) {
                    asignaciones.forEach(a => {
                        const fecha = a.created_at ? new Date(a.created_at) : null;
                        const fechaTxt = fecha ? fecha.toLocaleString() : '';
                        const card = document.createElement('div');
                        card.className = 'assign-card';
                        card.innerHTML = `
                            <div class="assign-header">
                                <span class="assign-project"><i class="fas fa-diagram-project"></i> ${a.proyecto_nombre || a.proyecto_id}</span>
                            </div>
                            <div class="assign-body">
                                <div><i class="fas fa-user"></i> ${a.usuario_nombre || a.usuario_id}</div>
                                <div><i class="far fa-clock"></i> ${fechaTxt}</div>
                            </div>`;
                        list.appendChild(card);
                    });
                    // Se ha retirado la acción de eliminación visual en Gestión de Miembros.
                }
            } else if (tbody) {
                tbody.innerHTML = '';
                if (asignaciones.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay asignaciones registradas</td></tr>';
                } else {
                    asignaciones.forEach(a => {
                        const tr = document.createElement('tr');
                        const fecha = a.created_at ? new Date(a.created_at) : null;
                        const fechaTxt = fecha ? fecha.toLocaleString() : '';
                        tr.innerHTML = `
                            <td>${a.proyecto_nombre || a.proyecto_id}</td>
                            <td>${a.usuario_nombre || a.usuario_id}</td>
                            <td>${fechaTxt}</td>
                            <td>
                                <button class="btn btn-sm btn-danger" data-asignacion-id="${a.id}"><i class="fas fa-trash-alt"></i></button>
                            </td>`;
                        tbody.appendChild(tr);
                    });
                    tbody.querySelectorAll('button[data-asignacion-id]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-asignacion-id');
                            fetch(`/api/asignaciones/${id}`, { method: 'DELETE' })
                                .then(r => r.json())
                                .then(resp => {
                                    if (!resp.success) throw new Error(resp.error || 'No se pudo eliminar');
                                    Swal.fire({ icon: 'success', title: 'Eliminada', text: 'Asignación eliminada', confirmButtonColor: '#4e73df' });
                                    window.cargarAsignacionesTabla(proyectoId);
                                    const totalAsignacionesEl = document.getElementById('totalAsignaciones');
                                    if (totalAsignacionesEl) totalAsignacionesEl.textContent = Math.max(0, (parseInt(totalAsignacionesEl.textContent) || 0) - 1);
                                })
                                .catch(err => {
                                    console.error('Error eliminando asignación:', err);
                                    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#4e73df' });
                                });
                        });
                    });
                }
            }

            // Actualizar contador de asignaciones siempre, aunque no se renderice lista/tabla
            const totalAsignacionesEl = document.getElementById('totalAsignaciones');
            if (totalAsignacionesEl) totalAsignacionesEl.textContent = asignaciones.length;
        })
        .catch(err => {
            console.error('Error cargando asignaciones:', err);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar asignaciones</td></tr>';
            }
        });
};

// Manejar envío del formulario de asignación
(function setupAsignacionForm() {
    const form = document.getElementById('formAsignarMiembro');
    const selProyecto = document.getElementById('proyectoAsignacion');
    if (!form || !selProyecto) return;

    // Poblar selects y tabla al iniciar
    window.cargarOpcionesAsignacion();
    window.cargarAsignacionesTabla();

    // Al cambiar proyecto, refrescar tabla filtrada
    selProyecto.addEventListener('change', function() {
        const pid = this.value ? parseInt(this.value) : null;
        window.cargarAsignacionesTabla(pid);
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const proyecto_id = parseInt(document.getElementById('proyectoAsignacion').value);
        const usuario_id = parseInt(document.getElementById('miembroAsignacion').value);
        if (!proyecto_id || !usuario_id) {
            Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Seleccione proyecto y miembro', confirmButtonColor: '#4e73df' });
            return;
        }

        fetch('/api/asignaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proyecto_id, usuario_id })
        })
        .then(r => r.json())
        .then(resp => {
            if (!resp.success) throw new Error(resp.error || 'No se pudo asignar');
            Swal.fire({ icon: 'success', title: 'Asignado', text: 'Miembro asignado al proyecto', confirmButtonColor: '#4e73df' });
            // Refrescar tabla del proyecto seleccionado
            window.cargarAsignacionesTabla(proyecto_id);
            // Resetear miembro
            const selMiembro = document.getElementById('miembroAsignacion');
            if (selMiembro) selMiembro.value = '';
            // Actualizar contador de asignaciones (sumar 1)
            const totalAsignacionesEl = document.getElementById('totalAsignaciones');
            if (totalAsignacionesEl) totalAsignacionesEl.textContent = (parseInt(totalAsignacionesEl.textContent) || 0) + 1;
        })
        .catch(err => {
            console.error('Error creando asignación:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#4e73df' });
        });
    });
})();

// Funciones para manejar tareas
function editarTarea(tareaId, titulo, descripcion, proyectoId) {
    const modal = document.getElementById('modalEditarTarea');
    const form = document.getElementById('formEditarTarea');
    
    // Llenar el formulario con los datos actuales
    document.getElementById('editarTareaId').value = tareaId;
    document.getElementById('editarTareaProyectoId').value = proyectoId;
    document.getElementById('editarTareaTitulo').value = titulo;
    document.getElementById('editarTareaDescripcion').value = descripcion;
    
    // Mostrar el modal
    modal.style.display = 'block';
}

function eliminarTarea(tareaId, proyectoId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará la tarea permanentemente',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/tareas/${tareaId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al eliminar la tarea');
                }
                return response.json();
            })
            .then(data => {
                Swal.fire({
                    icon: 'success',
                    title: 'Tarea eliminada',
                    text: 'La tarea ha sido eliminada exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
                
                // Recargar las tareas del proyecto
                const proyectoSeleccionado = proyectosTareas.find(p => String(p.id) === String(proyectoId));
                if (proyectoSeleccionado) {
                    abrirProyectoDetalle(proyectoId, proyectoSeleccionado.nombre);
                }
                
                // Recargar tarjetas para actualizar porcentajes
                if (typeof window.cargarProyectosTarjetas === 'function') {
                    window.cargarProyectosTarjetas();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar la tarea'
                });
            });
        }
    });
}

// Event listeners para el modal de editar tarea
document.addEventListener('DOMContentLoaded', function() {
    const modalEditarTarea = document.getElementById('modalEditarTarea');
    const closeEditarTarea = document.getElementById('closeEditarTarea');
    const formEditarTarea = document.getElementById('formEditarTarea');
    
    // Cerrar modal
    if (closeEditarTarea && modalEditarTarea) {
        closeEditarTarea.addEventListener('click', function() {
            modalEditarTarea.style.display = 'none';
        });
    }
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        if (event.target === modalEditarTarea) {
            modalEditarTarea.style.display = 'none';
        }
    });
    
    // Manejar envío del formulario de editar tarea
    if (formEditarTarea) {
        formEditarTarea.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const tareaId = document.getElementById('editarTareaId').value;
            const proyectoId = document.getElementById('editarTareaProyectoId').value;
            const titulo = document.getElementById('editarTareaTitulo').value.trim();
            const descripcion = document.getElementById('editarTareaDescripcion').value.trim();
            
            if (!titulo) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'El título es obligatorio'
                });
                return;
            }
            
            try {
                const response = await fetch(`/api/tareas/${tareaId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        titulo: titulo,
                        descripcion: descripcion
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al actualizar la tarea');
                }
                
                const data = await response.json();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Tarea actualizada',
                    text: 'La tarea ha sido actualizada exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
                
                // Cerrar modal
                modalEditarTarea.style.display = 'none';
                
                // Recargar las tareas del proyecto
                const proyectoSeleccionado = proyectosTareas.find(p => String(p.id) === String(proyectoId));
                if (proyectoSeleccionado) {
                    abrirProyectoDetalle(proyectoId, proyectoSeleccionado.nombre);
                }
                
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'No se pudo actualizar la tarea'
                });
            }
        });
    }
});

// ----- Resumen modal al hacer clic en tarjetas de la derecha -----
(function setupResumenModal(){
    const modal = document.getElementById('modalResumen');
    const tituloEl = document.getElementById('modalResumenTitulo');
    const listaEl = document.getElementById('modalResumenLista');
    const cerrarBtn = document.getElementById('modalResumenCerrar');
    const cerrarBtn2 = document.getElementById('modalResumenCerrar2');
    const prevBtn = document.getElementById('modalResumenPrev');
    const nextBtn = document.getElementById('modalResumenNext');
    const pageEl = document.getElementById('modalResumenPage');
    const cards = document.querySelectorAll('#gestion_miembros .members-right .stat-card');
    if (!modal || !tituloEl || !listaEl || cards.length === 0) return;

    const MODAL_PAGE_SIZE = 6;
    let modalItems = [];
    let currentPage = 1;

    function abrir(){ modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); }
    function cerrar(){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }
    cerrarBtn && cerrarBtn.addEventListener('click', cerrar);
    cerrarBtn2 && cerrarBtn2.addEventListener('click', cerrar);
    modal.addEventListener('click', (e)=>{ if(e.target === modal) cerrar(); });

    function renderPage(){
        if (!Array.isArray(modalItems)) modalItems = [];
        const totalPages = Math.max(1, Math.ceil(modalItems.length / MODAL_PAGE_SIZE));
        currentPage = Math.min(Math.max(1, currentPage), totalPages);
        const start = (currentPage - 1) * MODAL_PAGE_SIZE;
        const slice = modalItems.slice(start, start + MODAL_PAGE_SIZE);
        listaEl.innerHTML = '';
        slice.forEach(html => {
            const li = document.createElement('li');
            li.innerHTML = html;
            listaEl.appendChild(li);
        });
        if (pageEl) pageEl.textContent = `Página ${currentPage} de ${totalPages}`;
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

    prevBtn && prevBtn.addEventListener('click', () => {
        if (currentPage > 1){ currentPage--; renderPage(); }
    });
    nextBtn && nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(modalItems.length / MODAL_PAGE_SIZE);
        if (currentPage < totalPages){ currentPage++; renderPage(); }
    });

    async function cargarProyectosResumen(){
        tituloEl.innerHTML = '<i class="fas fa-project-diagram"></i> Proyectos';
        listaEl.innerHTML = '<li class="muted">Cargando proyectos...</li>';
        try{
            const r = await fetch('/api/proyectos');
            const data = await r.json();
            const proyectos = data && data.success ? (data.proyectos || []) : [];
            if (proyectos.length === 0){ listaEl.innerHTML = '<li class="muted">No hay proyectos</li>'; abrir(); return; }
            modalItems = proyectos.map(p => {
                let fi = '—'; let ff = '—';
                try{ if (p.fecha_inicio) fi = new Date(p.fecha_inicio).toLocaleDateString(); if (p.fecha_fin) ff = new Date(p.fecha_fin).toLocaleDateString(); }catch{}
                const estado = p.estado || 'pendiente';
                return `<strong>${p.nombre || 'Proyecto'}</strong><br><small>Estado: ${estado} · ${fi} — ${ff}</small>`;
            });
            currentPage = 1; renderPage(); abrir();
        }catch(err){ console.error('Resumen proyectos:', err); listaEl.innerHTML = '<li class="muted">Error al cargar proyectos</li>'; abrir(); }
    }

    async function cargarMiembrosResumen(){
        tituloEl.innerHTML = '<i class="fas fa-users"></i> Miembros';
        listaEl.innerHTML = '<li class="muted">Cargando miembros...</li>';
        try{
            const r = await fetch('/api/usuarios');
            const data = await r.json();
            const usuarios = data && data.success ? (data.usuarios || []) : [];
            const miembros = usuarios.filter(u => (u.rol === 'miembro' || u.rol === 'trabajador') && u.activo);
            if (miembros.length === 0){ listaEl.innerHTML = '<li class="muted">No hay miembros</li>'; abrir(); return; }
            modalItems = miembros.map(u => `<strong>${u.nombre}</strong><br><small>${u.email} · Estado: activo</small>`);
            currentPage = 1; renderPage(); abrir();
        }catch(err){ console.error('Resumen miembros:', err); listaEl.innerHTML = '<li class="muted">Error al cargar miembros</li>'; abrir(); }
    }

    async function cargarAsignacionesResumen(){
        tituloEl.innerHTML = '<i class="fas fa-tasks"></i> Asignaciones';
        listaEl.innerHTML = '<li class="muted">Cargando asignaciones...</li>';
        try{
            const r = await fetch('/api/asignaciones');
            const data = await r.json();
            const asignaciones = data && data.success ? (data.asignaciones || []) : [];
            if (asignaciones.length === 0){ listaEl.innerHTML = '<li class="muted">No hay asignaciones</li>'; abrir(); return; }
            modalItems = asignaciones.map(a => {
                let f = '';
                try{ if (a.created_at) f = new Date(a.created_at).toLocaleString(); }catch{}
                return `<strong>${a.proyecto_nombre || a.proyecto_id}</strong><br><small>${a.usuario_nombre || a.usuario_id} · ${f}</small>`;
            });
            currentPage = 1; renderPage(); abrir();
        }catch(err){ console.error('Resumen asignaciones:', err); listaEl.innerHTML = '<li class="muted">Error al cargar asignaciones</li>'; abrir(); }
    }

    cards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const title = card.querySelector('h3')?.textContent?.trim().toLowerCase() || '';
            if (title.includes('proyectos')) { cargarProyectosResumen(); }
            else if (title.includes('miembros')) { cargarMiembrosResumen(); }
            else if (title.includes('asignaciones')) { cargarAsignacionesResumen(); }
            else { tituloEl.textContent = 'Resumen'; listaEl.innerHTML = '<li class="muted">Sin contenido</li>'; abrir(); }
        });
    });
})();
// Bandera para controlar si se debe mostrar el loader
window.__suppressLoader = window.__suppressLoader || false;
function showPageLoader(){
  if (window.__suppressLoader) return;
  const el = document.getElementById('pageLoader');
  if (el) el.classList.add('visible');
}

function hidePageLoader(){
  const el = document.getElementById('pageLoader');
  if (el) el.classList.remove('visible');
}

function animateMainEnter(){
  const main = document.querySelector('.main-content');
  if (main){ main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter'); }
}

function animateSectionById(id){
  const section = document.getElementById(id);
  if (section){ section.classList.add('enter'); setTimeout(() => { section.classList.remove('enter'); void section.offsetWidth; section.classList.add('enter'); }, 0); }
}

function setupNavLoader(){
  const LOADER_MS = 1000;
  const anchors = Array.from(document.querySelectorAll('a[href]:not([target])'));
  anchors.forEach(a => {
    a.addEventListener('click', (e) => {
      // Evitar loader para elementos marcados o el botón de logout
      if (a.id === 'logoutBtn' || a.dataset.noLoader === 'true') {
        return; // El flujo específico manejará navegación/confirmación
      }
      const href = a.getAttribute('href');
      if (!href) return;
      // Hash navigation (in-page sections)
      if (href.startsWith('#')){
        e.preventDefault();
        const targetId = href.slice(1);
        if (!window.__suppressLoader) showPageLoader();
        setTimeout(() => {
          hidePageLoader();
          if (typeof window.activateDashboardSection === 'function') {
            window.activateDashboardSection(targetId);
          } else {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          animateSectionById(targetId);
        }, LOADER_MS);
        return;
      }
      // Internal page navigation
      const isInternal = href.startsWith('/') || href.startsWith(window.location.origin);
      if (isInternal){
        e.preventDefault();
        if (!window.__suppressLoader) showPageLoader();
        setTimeout(() => { window.location.href = href; }, LOADER_MS);
      }
    });
  });
  window.addEventListener('beforeunload', () => { if (!window.__suppressLoader) showPageLoader(); });
}

// ===== Perfil de Usuario (avatar y modal) =====
(function setupPerfil(){
    let currentUser = null;
    const profileBtn = document.getElementById('profileBtn');
    const profileAvatar = document.getElementById('profileAvatar');
    const modal = document.getElementById('perfilModal');
    const closeBtn = document.getElementById('closePerfilModal');
    const cancelarBtn = document.getElementById('cancelarPerfil');
    const form = document.getElementById('perfilForm');
    const nombreInput = document.getElementById('perfilNombre');
    const emailInput = document.getElementById('perfilEmail');
    const rolInput = document.getElementById('perfilRol');
    const fotoInput = document.getElementById('perfilFoto');
    const avatarPreview = document.getElementById('perfilAvatarPreview');
    const pwdActualInput = document.getElementById('perfilPwdActual');
    const pwdNuevaInput = document.getElementById('perfilPwdNueva');
    const pwdConfirmInput = document.getElementById('perfilPwdConfirm');
    const btnVerificarPwd = document.getElementById('btnVerificarPwd');
    const msgVerificacionPwd = document.getElementById('msgVerificacionPwd');
    let pwdVerificada = false;
    function formatDateTime(v){
        if(!v) return '';
        try{
            const s = String(v).replace(' ', 'T');
            let d = new Date(s);
            if(isNaN(d)){
                const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(String(v));
                if (m){ d = new Date(Number(m[1]), Number(m[2])-1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])); }
            }
            if (isNaN(d)) return String(v);
            const pad = (n)=>String(n).padStart(2,'0');
            return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }catch(_){ return String(v); }
    }
    function setLastLoginUI(v){
        const lastLoginEl = document.getElementById('perfilLastLogin');
        const dbg = document.getElementById('perfilLastLoginDebug');
        const formatted = formatDateTime(v) || '—';
        if (lastLoginEl) lastLoginEl.value = formatted;
        if (dbg) dbg.textContent = `raw: ${v ?? ''} | fmt: ${formatted}`;
    }

    function getInitials(name){
        if (!name) return 'U';
        return name.split(' ').map(p => p[0]?.toUpperCase()).filter(Boolean).slice(0,2).join('') || 'U';
    }

    async function loadCurrentUser(){
        try{
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            const data = await res.json().catch(()=>({}));
            if (!res.ok || !data || !data.user){
                throw new Error(data?.message || 'No se pudo obtener el usuario actual');
            }
            currentUser = data.user;
            console.debug('Perfil: usuario cargado', currentUser);
            console.debug('Perfil: last_login recibido (raw)', currentUser.last_login);
            if (nombreInput) nombreInput.value = currentUser.nombre || '';
            if (emailInput) emailInput.value = currentUser.email || '';
            if (rolInput) rolInput.value = currentUser.rol || '';
            setLastLoginUI(currentUser.last_login);
            const initials = getInitials(currentUser.nombre);
            const defaultAvatar = '/assets/default-avatar.svg';
            // Topbar avatar
            if (profileAvatar){
                const url = currentUser.avatar_url || '';
                if (url){
                    profileAvatar.style.backgroundImage = `url('${url}')`;
                    profileAvatar.style.backgroundSize = 'cover';
                    profileAvatar.style.backgroundPosition = 'center';
                    profileAvatar.textContent = '';
                } else {
                    profileAvatar.style.backgroundImage = `url('${defaultAvatar}')`;
                    profileAvatar.style.backgroundSize = 'cover';
                    profileAvatar.style.backgroundPosition = 'center';
                    profileAvatar.textContent = '';
                }
            }
            // Preview en modal
            if (avatarPreview){
                const url = currentUser.avatar_url || defaultAvatar;
                avatarPreview.style.backgroundImage = `url('${url}')`;
                avatarPreview.style.backgroundSize = 'cover';
                avatarPreview.style.backgroundPosition = 'center';
                avatarPreview.textContent = '';
            }
        }catch(err){
            console.warn('Perfil: no se pudo cargar el usuario actual:', err);
        }
    }

    async function openModal(){
        if (modal){
            modal.classList.add('show');
            modal.style.display = 'block';
            // Reset estado de contraseña
            pwdVerificada = false;
            if (pwdActualInput){ pwdActualInput.value = ''; }
            if (pwdNuevaInput){ pwdNuevaInput.value = ''; pwdNuevaInput.disabled = true; }
            if (pwdConfirmInput){ pwdConfirmInput.value = ''; pwdConfirmInput.disabled = true; }
            if (msgVerificacionPwd){ msgVerificacionPwd.textContent = ''; }
            try{
                const r = await fetch('/api/auth/me', { credentials: 'include' });
                const d = await r.json().catch(()=>({}));
                if (r.ok && d && d.user){
                    currentUser = d.user;
                }
                setLastLoginUI(currentUser?.last_login);
                if (nombreInput) nombreInput.value = currentUser?.nombre || '';
                if (emailInput) emailInput.value = currentUser?.email || '';
                if (rolInput) rolInput.value = currentUser?.rol || '';
            }catch(_){}
        }
    }
    function closeModal(){ if (modal){ modal.classList.remove('show'); modal.style.display = 'none'; } }

    if (profileBtn) profileBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelarBtn) cancelarBtn.addEventListener('click', closeModal);

    if (fotoInput){
        fotoInput.addEventListener('change', async () => {
            const file = fotoInput.files && fotoInput.files[0];
            if (!file) return;
            // Previsualización inmediata
            const reader = new FileReader();
            reader.onload = (e) => {
                if (avatarPreview){
                    avatarPreview.style.backgroundImage = `url('${e.target.result}')`;
                    avatarPreview.style.backgroundSize = 'cover';
                    avatarPreview.style.backgroundPosition = 'center';
                    avatarPreview.textContent = '';
                }
            };
            reader.readAsDataURL(file);

            // Subir avatar inmediatamente y no depender del botón Guardar
            try{
                if (!currentUser || !currentUser.id){
                    Swal.fire({ icon:'error', title:'Error', text:'No se pudo identificar el usuario actual.' });
                    return;
                }
                const fd = new FormData();
                fd.append('avatar', file);
                const avRes = await fetch(`/api/usuarios/${currentUser.id}/avatar`, { method: 'POST', body: fd });
                const avData = await avRes.json().catch(()=>({}));
                if (avRes.ok && avData?.avatar_url){
                    const url = avData.avatar_url;
                    // Actualizar avatar del topbar y preview con la URL final
                    if (avatarPreview){
                        avatarPreview.style.backgroundImage = `url('${url}')`;
                        avatarPreview.style.backgroundSize = 'cover';
                        avatarPreview.style.backgroundPosition = 'center';
                        avatarPreview.textContent = '';
                    }
                    if (profileAvatar){
                        profileAvatar.style.backgroundImage = `url('${url}')`;
                        profileAvatar.style.backgroundSize = 'cover';
                        profileAvatar.style.backgroundPosition = 'center';
                        profileAvatar.textContent = '';
                    }
                    currentUser.avatar_url = url;
                    Swal.fire({ icon:'success', title:'Foto actualizada', timer:1200, showConfirmButton:false });
                } else {
                    const msg = avData?.message || 'No se pudo guardar la foto.';
                    Swal.fire({ icon:'error', title:'Error al subir foto', text: msg });
                }
            }catch(err){
                Swal.fire({ icon:'error', title:'Error al subir foto', text: String(err.message || err) });
            }
        });
    }

    // Verificación de contraseña actual
    if (btnVerificarPwd){
        btnVerificarPwd.addEventListener('click', async () => {
            if (!currentUser || !currentUser.id){
                Swal.fire({ icon:'error', title:'Error', text:'No se pudo identificar el usuario actual.' });
                return;
            }
            const actual = (pwdActualInput?.value || '').trim();
            if (!actual){
                Swal.fire({ icon:'warning', title:'Falta la contraseña', text:'Ingresa tu contraseña actual para verificar.' });
                return;
            }
            btnVerificarPwd.disabled = true;
            if (msgVerificacionPwd) msgVerificacionPwd.textContent = '';
            try{
                const res = await fetch('/api/auth/verify_password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ password: actual })
                });
                const data = await res.json().catch(()=>({}));
                if (res.ok && (data.valid === true || data.ok === true)){
                    pwdVerificada = true;
                    if (pwdNuevaInput) pwdNuevaInput.disabled = false;
                    if (pwdConfirmInput) pwdConfirmInput.disabled = false;
                    if (msgVerificacionPwd){
                        msgVerificacionPwd.textContent = 'Contraseña verificada correctamente.';
                        msgVerificacionPwd.classList.remove('text-muted');
                        msgVerificacionPwd.classList.add('text-success');
                        msgVerificacionPwd.style.color = '#28a745';
                    }
                } else {
                    pwdVerificada = false;
                    if (pwdNuevaInput) pwdNuevaInput.disabled = true;
                    if (pwdConfirmInput) pwdConfirmInput.disabled = true;
                    const message = data?.message || 'No se pudo verificar la contraseña.';
                    Swal.fire({ icon:'error', title:'Verificación fallida', text: message });
                }
            }catch(err){
                pwdVerificada = false;
                if (pwdNuevaInput) pwdNuevaInput.disabled = true;
                if (pwdConfirmInput) pwdConfirmInput.disabled = true;
                Swal.fire({ icon:'error', title:'Error', text:String(err.message || err) });
            }finally{
                btnVerificarPwd.disabled = false;
            }
        });
        // Si cambia la contraseña actual tras verificar, volver a bloquear
        if (pwdActualInput){
            pwdActualInput.addEventListener('input', () => {
                pwdVerificada = false;
                if (pwdNuevaInput) pwdNuevaInput.disabled = true;
                if (pwdConfirmInput) pwdConfirmInput.disabled = true;
                if (msgVerificacionPwd){
                    msgVerificacionPwd.textContent = '';
                    msgVerificacionPwd.classList.remove('text-success');
                    msgVerificacionPwd.classList.add('text-muted');
                    msgVerificacionPwd.style.color = '';
                }
            });
        }
    }

    if (form){
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser || !currentUser.id){
                Swal.fire({ icon:'error', title:'Error', text:'No se pudo identificar el usuario actual.' });
                return;
            }
            const submitBtn = document.getElementById('guardarPerfil');
            if (submitBtn) submitBtn.disabled = true;
            try{
                const nuevoNombre = (nombreInput?.value || '').trim();
                const nuevoEmail = (emailInput?.value || '').trim();
                const payload = {
                    nombre: nuevoNombre || currentUser.nombre,
                    email: nuevoEmail || currentUser.email,
                    rol: currentUser.rol,
                    activo: currentUser.activo
                };
                const nuevaPwd = (pwdNuevaInput?.value || '').trim();
                const confirmPwd = (pwdConfirmInput?.value || '').trim();
                if (nuevaPwd || confirmPwd){
                    if (!pwdVerificada){
                        throw new Error('Primero verifica tu contraseña actual.');
                    }
                    if (nuevaPwd.length < 6){
                        throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
                    }
                    if (nuevaPwd !== confirmPwd){
                        throw new Error('La confirmación no coincide con la nueva contraseña.');
                    }
                    // Incluir campos esperados por el backend
                    payload.password = nuevaPwd;
                    payload.current_password = (pwdActualInput?.value || '').trim();
                }
                // Subir avatar primero si hay archivo, sin bloquear por errores de perfil
                const file = fotoInput?.files && fotoInput.files[0];
                let avatarOk = false;
                let avatarMsg = '';
                if (file){
                    try{
                        const fd = new FormData();
                        fd.append('avatar', file);
                        const avRes = await fetch(`/api/usuarios/${currentUser.id}/avatar`, { method: 'POST', body: fd });
                        const avData = await avRes.json().catch(()=>({}));
                        if (avRes.ok && avData?.avatar_url){
                            avatarOk = true;
                            currentUser.avatar_url = avData.avatar_url;
                            if (profileAvatar){
                                profileAvatar.style.backgroundImage = `url('${avData.avatar_url}')`;
                                profileAvatar.style.backgroundSize = 'cover';
                                profileAvatar.style.backgroundPosition = 'center';
                                profileAvatar.textContent = '';
                            }
                            if (avatarPreview){
                                avatarPreview.style.backgroundImage = `url('${avData.avatar_url}')`;
                                avatarPreview.style.backgroundSize = 'cover';
                                avatarPreview.style.backgroundPosition = 'center';
                                avatarPreview.textContent = '';
                            }
                        } else {
                            avatarMsg = avData?.message || 'No se pudo guardar la foto.';
                        }
                    } catch (errAv){
                        avatarMsg = String(errAv.message || errAv);
                    }
                }

                // Determinar si hay cambios en nombre/email o contraseña
                const hayCambiosBasicos = (
                    (nuevoNombre && nuevoNombre !== currentUser.nombre) ||
                    (nuevoEmail && nuevoEmail !== currentUser.email) ||
                    !!payload.password
                );

                let perfilOk = true;
                let perfilMsg = '';
                if (hayCambiosBasicos){
                    const updRes = await fetch(`/api/usuarios/${currentUser.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const updData = await updRes.json().catch(()=>({}));
                    if (!updRes.ok){
                        perfilOk = false;
                        perfilMsg = updData?.message || 'No se pudo actualizar el perfil';
                    } else {
                        // Refrescar nombre mostrado
                        currentUser.nombre = payload.nombre;
                    }
                }

                // Mensajería combinada según resultados
                if (perfilOk && (avatarOk || !file)){
                    Swal.fire({ icon:'success', title:'Cambios guardados', timer:1500, showConfirmButton:false });
                    closeModal();
                } else if (!perfilOk && avatarOk){
                    Swal.fire({ icon:'warning', title:'Foto guardada', text: `Perfil no actualizado: ${perfilMsg}` });
                } else if (perfilOk && !avatarOk && file){
                    Swal.fire({ icon:'warning', title:'Perfil actualizado', text: `Foto no guardada: ${avatarMsg}` });
                } else {
                    Swal.fire({ icon:'error', title:'No se guardaron los cambios', text: perfilMsg || avatarMsg || 'Inténtalo nuevamente.' });
                }
                closeModal();
                currentUser.nombre = payload.nombre;
                const initials = getInitials(currentUser.nombre);
                const defaultAvatar = '/assets/default-avatar.svg';
                if (profileAvatar && !profileAvatar.style.backgroundImage){
                    profileAvatar.style.backgroundImage = `url('${defaultAvatar}')`;
                    profileAvatar.style.backgroundSize = 'cover';
                    profileAvatar.style.backgroundPosition = 'center';
                    profileAvatar.textContent = '';
                }
            }catch(err){
                console.error('Error actualizando perfil:', err);
                Swal.fire({ icon:'error', title:'Error', text: String(err.message || err) });
            }finally{
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Cargar usuario al iniciar
    if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', loadCurrentUser);
    } else {
        loadCurrentUser();
    }
})();
document.addEventListener('DOMContentLoaded', () => {
  // Mostrar loader inicial 1s y animar entrada
  showPageLoader();
  setTimeout(() => { hidePageLoader(); animateMainEnter(); }, 1000);
  setupNavLoader();
});
