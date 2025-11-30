(function(){
  const estadoUiToDb = {
    'Pendiente': 'pendiente',
    'Haciendo': 'en_progreso',
    'Revisando': 'revisando',
    'Hecho': 'completada'
  };

  const estadoDbToUi = {
    'pendiente': 'Pendiente',
    'en_progreso': 'Haciendo',
    'revisando': 'Revisando',
    'completada': 'Hecho'
  };

  // Estados de proyecto (UI <-> DB)
  const proyectoEstadoUiToDb = {
    'En ejecución': 'en_ejecucion',
    'En pausa': 'en_pausa',
    'Finalizado': 'finalizado'
  };
  const proyectoEstadoDbToUi = {
    'en_ejecucion': 'En ejecución',
    'en_pausa': 'En pausa',
    'finalizado': 'Finalizado'
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
    if (pageTitleEl) pageTitleEl.textContent = `Detalle del Proyecto`;
    if (liderEl) liderEl.textContent = data.jefe_nombre || '—';
  }

  function renderEstadoProyecto(estadoDb){
    const sel = document.getElementById('selectEstadoProyecto');
    if (!sel) return;
    const uiValue = proyectoEstadoDbToUi[estadoDb] || 'En ejecución';
    sel.value = uiValue;
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
    // Animar sección al completar render
    const section = document.getElementById('proyectoTeam');
    if (section){ section.classList.remove('enter'); void section.offsetWidth; section.classList.add('enter'); }
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
          <button class="btn btn-sm btn-primary" title="Editar" data-edit-id="${t.id}"><i class="fas fa-pen"></i></button>
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

    // Edit buttons
    tbody.querySelectorAll('button[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tareaId = btn.getAttribute('data-edit-id');
        abrirEditorTarea(tareaId);
      });
    });

    tbody.querySelectorAll('button[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tareaId = btn.getAttribute('data-delete-id');
        eliminarTarea(tareaId);
      });
    });

    // Animar sección al completar render
    const section = document.getElementById('proyectoTasks');
    if (section){ section.classList.remove('enter'); void section.offsetWidth; section.classList.add('enter'); }
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

  // ==== Documentos ====
  function getDueBadgeHtml(dateObj){
    const today = new Date();
    const diffMs = dateObj.setHours(0,0,0,0) - today.setHours(0,0,0,0);
    const diffDays = Math.ceil(diffMs / (1000*60*60*24));
    let cls = 'due-ok';
    if (diffDays < 0) cls = 'due-overdue';
    else if (diffDays <= 7) cls = 'due-soon';
    const label = dateObj.toLocaleDateString('es-ES');
    return `<span class="due-badge ${cls}">${label}</span>`;
  }

  function renderDocumentosTabla(docs){
    const tbody = document.querySelector('#tablaDocumentos tbody');
    if (!tbody) return;
    if (!docs || docs.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin documentos</td></tr>';
      return;
    }
    const rows = docs.map(doc => {
      const fechaSub = doc.fecha_subida ? new Date(doc.fecha_subida).toLocaleString('es-ES') : '—';
      const vencHtml = doc.fecha_vencimiento ? getDueBadgeHtml(new Date(doc.fecha_vencimiento)) : '<span class="badge badge-secondary">—</span>';
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
          <td class="action-buttons">
            <a class="btn btn-success btn-sm" href="/api/documentos/${doc.id}/download" title="Descargar"><i class="fas fa-download"></i></a>
            <button class="btn btn-danger btn-sm" data-doc-id="${doc.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');
    tbody.innerHTML = rows;
    tbody.querySelectorAll('button[data-doc-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-doc-id');
        eliminarDocumento(id);
      });
    });

    // Bind select-all
    const chkSelectAll = document.getElementById('chkDocsSelectAll');
    if (chkSelectAll){
      chkSelectAll.checked = false;
      chkSelectAll.onchange = () => {
        const checks = Array.from(tbody.querySelectorAll('input[type="checkbox"][data-id]'));
        checks.forEach(ch => { ch.checked = !!chkSelectAll.checked; });
      };
    }

    // Animar sección al completar render
    const section = document.getElementById('proyectoDocumentos');
    if (section){ section.classList.remove('enter'); void section.offsetWidth; section.classList.add('enter'); }
  }

  function cargarDocumentos(){
    const tbody = document.querySelector('#tablaDocumentos tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
    if (!currentProjectId) return;
    return fetch(`/api/proyectos/${currentProjectId}/documentos`)
      .then(r => r.json())
      .then(data => {
        if (data && data.success){
          renderDocumentosTabla(data.documentos || []);
        } else {
          const msg = (data && (data.error || data.message)) || 'No se pudieron cargar';
          Swal.fire('Error', msg, 'error');
          if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error</td></tr>';
        }
      })
      .catch(err => {
        console.error('Error cargando documentos:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error</td></tr>';
      });
  }

  // Descargas múltiples
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

  document.addEventListener('DOMContentLoaded', () => {
    const tablaDocumentos = document.getElementById('tablaDocumentos');
    const btnDescTodos = document.getElementById('btnDescargarTodosDocs');
    const btnDescSel = document.getElementById('btnDescargarSeleccionadosDocs');

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
  });

  function eliminarDocumento(id){
    Swal.fire({
      title: 'Eliminar documento',
      text: 'Esta acción eliminará el archivo definitivamente. ¿Continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e74a3b',
      cancelButtonColor: '#6c757d'
    }).then(res => {
      if (!res.isConfirmed) return;
      fetch(`/api/documentos/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(data => {
          if (data && data.success){
            Swal.fire('Eliminado', 'Documento eliminado', 'success');
            cargarDocumentos();
          } else {
            const msg = (data && (data.error || data.message)) || 'No se pudo eliminar';
            Swal.fire('Error', msg, 'error');
          }
        })
        .catch(err => {
          console.error('Error eliminando documento:', err);
          Swal.fire('Error', 'Ocurrió un problema al eliminar', 'error');
        });
    });
  }

  // Editor de tarea (título y descripción) con SweetAlert
  function abrirEditorTarea(tareaId){
    fetch(`/api/tareas/${tareaId}`)
      .then(r => r.json())
      .then(data => {
        if (!data || !data.success || !data.tarea){
          const msg = (data && (data.error || data.message)) || 'No se pudo cargar la tarea';
          Swal.fire('Error', msg, 'error');
          return;
        }
        const tarea = data.tarea;
        Swal.fire({
          title: 'Editar tarea',
          html: `
            <div class="form-group" style="text-align:left">
              <label for="swalTitulo">Título</label>
              <input id="swalTitulo" class="swal2-input" style="width:100%" value="${(tarea.titulo||'').replace(/"/g, '&quot;')}">
            </div>
            <div class="form-group" style="text-align:left">
              <label for="swalDescripcion">Descripción</label>
              <textarea id="swalDescripcion" class="swal2-textarea" style="width:100%">${(tarea.descripcion||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Guardar',
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            const titulo = document.getElementById('swalTitulo').value.trim();
            const descripcion = document.getElementById('swalDescripcion').value.trim();
            if (!titulo){
              Swal.showValidationMessage('El título es obligatorio');
              return false;
            }
            return { titulo, descripcion };
          }
        }).then(res => {
          if (!res.isConfirmed || !res.value) return;
          const { titulo, descripcion } = res.value;
          fetch(`/api/tareas/${tareaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, descripcion })
          })
          .then(r => r.json())
          .then(upd => {
            if (upd && (upd.success || upd.message)){
              Swal.fire('Actualizada', 'La tarea fue actualizada', 'success');
              cargarTareas();
            } else {
              const msg = (upd && (upd.error || upd.message)) || 'No se pudo actualizar';
              Swal.fire('Error', msg, 'error');
            }
          })
          .catch(err => {
            console.error('Error al actualizar tarea:', err);
            Swal.fire('Error', 'Ocurrió un problema al actualizar', 'error');
          });
        });
      })
      .catch(err => {
        console.error('Error al obtener tarea:', err);
        Swal.fire('Error', 'Ocurrió un problema al cargar la tarea', 'error');
      });
  }

  let currentProjectId = null;

  function cargarProyecto(){
    if (!currentProjectId) return;
    return fetch(`/api/proyectos/${currentProjectId}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.success && data.proyecto){
          renderProyectoInfo(data.proyecto);
          renderEstadoProyecto(data.proyecto.estado);
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
    return fetch(`/api/tareas/proyecto/${currentProjectId}`)
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

  function setupEstadoProyecto(){
    const btn = document.getElementById('btnGuardarEstadoProyecto');
    const sel = document.getElementById('selectEstadoProyecto');
    if (!btn || !sel) return;
    btn.addEventListener('click', () => {
      if (!currentProjectId) return;
      const uiValue = sel.value;
      const dbValue = proyectoEstadoUiToDb[uiValue] || 'en_ejecucion';
      fetch(`/api/proyectos/${currentProjectId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: dbValue })
      })
      .then(r => r.json())
      .then(data => {
        if (data && data.success){
          Swal.fire('Actualizado', 'Estado del proyecto actualizado', 'success');
          cargarProyecto();
        } else {
          const msg = (data && (data.error || data.message)) || 'No se pudo actualizar';
          Swal.fire('Error', msg, 'error');
        }
      })
      .catch(err => {
        console.error('Error actualizando estado del proyecto:', err);
        Swal.fire('Error', 'Ocurrió un problema al actualizar', 'error');
      });
    });
  }

  function showPageLoader(){
    const el = document.getElementById('pageLoader');
    if (el) el.classList.add('visible');
  }

  function hidePageLoader(){
    const el = document.getElementById('pageLoader');
    if (el) el.classList.remove('visible');
  }

  function setupNavLoader(){
    // Mostrar overlay antes de cambiar de página para que se perciba la acción
    const anchors = Array.from(document.querySelectorAll('a[href]:not([target])'));
    anchors.forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href) return;
        // Solo interceptamos navegación interna del sitio
        const isInternal = href.startsWith('/') || href.startsWith(window.location.origin);
        if (!isInternal) return;
        e.preventDefault();
        showPageLoader();
        // Mantener el loader visible ~1s antes de navegar
        setTimeout(() => {
          window.location.href = href;
        }, 1000);
      });
    });

    // fallback en caso de navegación programática
    window.addEventListener('beforeunload', () => {
      showPageLoader();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('.main-content');
    showPageLoader();
    currentProjectId = getProjectIdFromPath();
    setupLogout();
    setupEstadoProyecto();
    setupNavLoader();
    if (!currentProjectId){
      Swal.fire('Sin proyecto', 'No se ha especificado un proyecto válido', 'warning');
      hidePageLoader();
      return;
    }
    const minWait = new Promise(res => setTimeout(res, 1000));
    Promise.all([cargarProyecto(), cargarTareas(), cargarDocumentos(), minWait])
      .catch(() => {})
      .finally(() => {
        hidePageLoader();
        if (main){
          main.classList.remove('enter');
          void main.offsetWidth;
          main.classList.add('enter');
        }
      });
  });
})();
