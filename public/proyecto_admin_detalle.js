(function(){
  const estadoUiToDb = {
    'Pendiente': 'pendiente',
    'Haciendo': 'en_progreso',
    'Revisando': 'revision',
    'Hecho': 'completada'
  };

  const estadoDbToUi = {
    'pendiente': 'Pendiente',
    'en_progreso': 'Haciendo',
    'revision': 'Revisando',
    'completada': 'Hecho'
  };

  function getProjectIdFromPath(){
    const m = window.location.pathname.match(/\/admin\/proyecto\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  function setLoading(selector){
    const el = document.querySelector(selector + ' tbody');
    if (el){
      el.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';
    }
  }

  function renderProyectoInfo(data){
    const tituloEl = document.getElementById('proyectoDetalleTitulo');
    const liderEl = document.getElementById('proyectoInfoLider');
    const pageTitleEl = document.getElementById('pageTitle');
    if (tituloEl) tituloEl.innerHTML = `<i class="fas fa-tasks"></i> Tareas del Proyecto: ${data.nombre}`;
    if (pageTitleEl) pageTitleEl.innerHTML = `<i class="fas fa-diagram-project"></i> Detalle del Proyecto: ${data.nombre}`;
    if (liderEl) liderEl.textContent = data.jefe_nombre || '—';
  }

  function renderMiembrosTabla(miembros){
    const tbody = document.querySelector('#tablaMiembrosProyecto tbody');
    if (!tbody) return;
    if (!miembros || miembros.length === 0){
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Sin miembros</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    miembros.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.nombre || '-'}</td>
        <td>${m.email || '-'}</td>
        <td>${m.rol || '-'}</td>
        <td><button class="btn btn-link text-danger" data-asignacion-id="${m.asignacion_id}">Quitar</button></td>
      `;
      tbody.appendChild(tr);
    });
    // Bind remove actions
    tbody.querySelectorAll('button[data-asignacion-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const asignacionId = btn.getAttribute('data-asignacion-id');
        confirmarQuitarMiembro(asignacionId);
      });
    });
  }

  function confirmarQuitarMiembro(asignacionId){
    Swal.fire({
      title: 'Quitar miembro',
      text: '¿Estás seguro de eliminar esta asignación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed){
        fetch(`/api/asignaciones/${asignacionId}`, { method: 'DELETE' })
          .then(r => r.json())
          .then(data => {
            if (data && data.success){
              Swal.fire('Eliminado', 'El miembro fue quitado del proyecto', 'success');
              // Refrescar miembros
              cargarProyecto();
            } else {
              const msg = (data && (data.error || data.message)) || 'No se pudo eliminar';
              Swal.fire('Error', msg, 'error');
            }
          })
          .catch(err => {
            console.error('Error al eliminar asignación:', err);
            Swal.fire('Error', 'Ocurrió un problema al eliminar', 'error');
          });
      }
    });
  }

  function renderTareasTabla(tareas){
    const tbody = document.querySelector('#tablaTareasProyecto tbody');
    if (!tbody) return;
    if (!tareas || tareas.length === 0){
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Sin tareas</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    tareas.forEach(t => {
      const estadoUi = estadoDbToUi[t.estado] || 'Pendiente';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.titulo || '-'}</td>
        <td>${t.descripcion || '-'}</td>
        <td>
          <select class="form-control tarea-estado" data-tarea-id="${t.id}">
            ${['Pendiente','Haciendo','Revisando','Hecho'].map(op => `<option value="${op}" ${op===estadoUi?'selected':''}>${op}</option>`).join('')}
          </select>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" title="Editar" disabled><i class="fas fa-pen"></i></button>
          <button class="btn btn-sm btn-danger" title="Eliminar" data-delete-id="${t.id}"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Bind events
    tbody.querySelectorAll('select.tarea-estado').forEach(sel => {
      sel.addEventListener('change', () => {
        const tareaId = sel.getAttribute('data-tarea-id');
        const uiValue = sel.value;
        const dbValue = estadoUiToDb[uiValue] || 'pendiente';
        actualizarEstadoTarea(tareaId, dbValue);
      });
    });

    tbody.querySelectorAll('button[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tareaId = btn.getAttribute('data-delete-id');
        eliminarTarea(tareaId);
      });
    });
  }

  function actualizarEstadoTarea(tareaId, estadoDb){
    fetch(`/api/tareas/${tareaId}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: estadoDb })
    })
    .then(r => r.json())
    .then(data => {
      if (data && data.success){
        Swal.fire('Actualizado', 'Estado de la tarea actualizado', 'success');
        // No recargar toda la lista; podría actualizar métricas si existieran
      } else {
        const msg = (data && (data.error || data.message)) || 'No se pudo actualizar';
        Swal.fire('Error', msg, 'error');
      }
    })
    .catch(err => {
      console.error('Error al actualizar estado:', err);
      Swal.fire('Error', 'Ocurrió un problema al actualizar', 'error');
    });
  }

  function eliminarTarea(tareaId){
    Swal.fire({
      title: 'Eliminar tarea',
      text: '¿Desea eliminar esta tarea?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;
      fetch(`/api/tareas/${tareaId}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(data => {
          if (data && data.success){
            Swal.fire('Eliminada', 'La tarea fue eliminada', 'success');
            cargarTareas();
          } else {
            const msg = (data && (data.error || data.message)) || 'No se pudo eliminar';
            Swal.fire('Error', msg, 'error');
          }
        })
        .catch(err => {
          console.error('Error eliminando tarea:', err);
          Swal.fire('Error', 'Ocurrió un problema al eliminar', 'error');
        });
    });
  }

  let currentProjectId = null;

  function cargarProyecto(){
    if (!currentProjectId) return;
    fetch(`/api/proyectos/${currentProjectId}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.success && data.proyecto){
          renderProyectoInfo(data.proyecto);
          renderMiembrosTabla(data.proyecto.miembros || []);
        } else {
          const msg = (data && (data.error || data.message)) || 'Proyecto no encontrado';
          Swal.fire('Error', msg, 'error');
        }
      })
      .catch(err => {
        console.error('Error cargando proyecto:', err);
        Swal.fire('Error', 'No se pudo cargar el proyecto', 'error');
      });
  }

  function cargarTareas(){
    if (!currentProjectId) return;
    setLoading('#tablaTareasProyecto');
    fetch(`/api/tareas/proyecto/${currentProjectId}`)
      .then(r => r.json())
      .then(data => {
        const tareas = data && data.success ? (data.tareas || []) : [];
        renderTareasTabla(tareas);
      })
      .catch(err => {
        console.error('Error cargando tareas:', err);
        const tbody = document.querySelector('#tablaTareasProyecto tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar</td></tr>';
      });
  }

  function setupLogout(){
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Deseas cerrar sesión ahora?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#4e73df',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          fetch('/api/auth/logout', { method: 'POST' })
            .then(() => window.location.href = '/login')
            .catch(() => window.location.href = '/login');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    currentProjectId = getProjectIdFromPath();
    setupLogout();
    if (!currentProjectId){
      Swal.fire('Sin proyecto', 'No se ha especificado un proyecto válido', 'warning');
      return;
    }
    cargarProyecto();
    cargarTareas();
  });
})();