// Dashboard Líder de Proyecto
(function(){
  const topbar = document.querySelector('.topbar');
  const menuBtn = document.querySelector('.menu-toggle');
  const icon = menuBtn?.querySelector('i');
  let currentUser = null;
  (function(){
    try{ history.pushState(null,'',location.href); }catch(_){}
    window.addEventListener('popstate', function(e){ if (e && e.preventDefault) e.preventDefault(); history.go(1); });
    window.addEventListener('keydown', function(e){
      if ((e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) || e.key === 'BrowserBack' || e.key === 'BrowserForward') {
        e.preventDefault();
      }
    });
  })();
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

  function animateOpen(){
    if (window.anime) {
      anime({ targets: '.sidebar-menu', opacity: [0,1], translateY: [-12,0], duration: 250, easing: 'easeOutQuad' });
    }
  }
  function animateClose(){
    if (window.anime) {
      anime({ targets: '.sidebar-menu', opacity: [1,0], translateY: [0,-12], duration: 200, easing: 'easeInQuad' });
    }
  }

  menuBtn?.addEventListener('click', () => {
    const opening = !topbar.classList.contains('open');
    topbar.classList.toggle('open');
    if (icon){ icon.classList.remove(opening ? 'fa-chevron-down' : 'fa-chevron-up'); icon.classList.add(opening ? 'fa-chevron-up' : 'fa-chevron-down'); }
    opening ? animateOpen() : animateClose();
  });

  document.addEventListener('click', (e)=>{
    const isInside = topbar.contains(e.target);
    if (!isInside && topbar.classList.contains('open')){
      topbar.classList.remove('open');
      if (icon){ icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
      animateClose();
    }
  });

  // Utilidades
  function setLoading(selector){
    const tbody = document.querySelector(`${selector} tbody`);
    if (tbody) tbody.innerHTML = '<tr><td colspan="100" class="text-center">Cargando...</td></tr>';
  }

  function fetchJSON(url, options){
    return fetch(url, options).then(r => r.json());
  }

  // Usuario y sesiones
  function loadUser(){
    fetchJSON('/api/auth/me').then(res => {
      if (res.success && res.user){
        const { user } = res;
        currentUser = user;
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        if (nameEl) nameEl.textContent = user.nombre;
        if (roleEl) roleEl.textContent = roleLabel(user.rol);
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl){
          const url = user.avatar_url || '';
          if (url){
            avatarEl.style.backgroundImage = `url('${url}')`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
            avatarEl.textContent = '';
          } else {
            avatarEl.style.backgroundImage = '';
            avatarEl.textContent = (user.nombre || 'U').trim().charAt(0).toUpperCase();
          }
        }
      }
    }).catch(()=>{});
  }
  function roleLabel(rol){
    switch(rol){
      case 'admin': return 'Administrador';
      case 'trabajador': return 'Trabajador';
      case 'jefe_proyecto': return 'Jefe de Proyecto';
      default: return rol || '-';
    }
  }
  document.getElementById('logoutBtn')?.addEventListener('click', async (e)=>{
    e.preventDefault();
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Deseas cerrar sesión ahora?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4D5180',
      cancelButtonColor: '#6c757d'
    });
    if (!result.isConfirmed) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true });
    } catch (_) {}
    window.location.href = '/login';
  });

  function updateTopCorreoBadge(){
    const el = document.getElementById('topCorreoBadge');
    if (!el) return;
    fetch('/api/correos/unread_count').then(r=>r.json()).then(d=>{
      const cnt = Number((d && d.count) || 0);
      if (cnt > 0){ el.textContent = String(cnt); el.style.display = 'inline-block'; }
      else { el.style.display = 'none'; }
    }).catch(()=>{});
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

  // Proyectos del líder
  const proyectosGrid = document.getElementById('proyectosGrid');
  const selProyectoAsignacion = document.getElementById('selProyectoAsignacion');
  const selProyectoDocs = document.getElementById('selProyectoDocs');
  // Tareas en sección Asignar Tarea
  const selProyectoTareas = document.getElementById('selProyectoTareas');
  const btnCrearTarea = document.getElementById('btnCrearTarea');
  const btnRefrescarTareas = document.getElementById('btnRefrescarTareas');
  const tablaTareas = document.getElementById('tablaTareas');

  let proyectosLider = [];
  function cargarMisProyectos(){
    fetchJSON('/api/proyectos/mios').then(data => {
      proyectosLider = data.success ? (data.proyectos || []) : [];
      renderProyectos(proyectosLider);
      cargarSelectProyectos();
    }).catch(err => { console.error('Error cargando proyectos del líder', err); });
  }

  function formatDate(value){
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' });
  }
  function statusLabel(estado){
    switch(estado){
      case 'en_ejecucion': return 'En ejecución';
      case 'en_pausa': return 'En pausa';
      case 'finalizado': return 'Finalizado';
      default: return estado || 'Activo';
    }
  }
  function statusClass(estado){
    switch(estado){
      case 'en_ejecucion': return 'status-en_ejecucion';
      case 'en_pausa': return 'status-en_pausa';
      case 'finalizado': return 'status-finalizado';
      default: return 'status-default';
    }
  }

  function renderProyectos(lista){
    if (!proyectosGrid) return;
    proyectosGrid.innerHTML = '';
    lista.forEach(p => {
      const card = document.createElement('div');
      card.className = 'project-card';
      const porcentaje = p.porcentaje_avance || 0;
      card.innerHTML = `
        <div class="title-row">
          <div class="title"><i class="fas fa-diagram-project"></i> ${p.nombre}</div>
          <span class="status-pill ${statusClass(p.estado)}">${statusLabel(p.estado)}</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${porcentaje}%"></div></div>
          <div class="progress-info"><i class="fas fa-gauge-high"></i> ${porcentaje}%</div>
        </div>
        <div class="dates">
          <div><i class="far fa-calendar-plus"></i> Inicio: ${formatDate(p.fecha_inicio)}</div>
          <div><i class="far fa-calendar-check"></i> Fin: ${formatDate(p.fecha_fin)}</div>
        </div>
        <div class="action-row compact">
          <button class="btn btn-light btn-compact" data-action="inicio" data-id="${p.id}"><i class="far fa-calendar-plus"></i> Inicio</button>
          <button class="btn btn-light btn-compact" data-action="fin" data-id="${p.id}"><i class="far fa-calendar-check"></i> Fin</button>
          <button class="btn btn-light btn-compact" data-action="usuarios" data-id="${p.id}"><i class="fas fa-users"></i> Usuarios</button>
          <button class="btn btn-light btn-compact" data-action="tareas" data-id="${p.id}"><i class="fas fa-list-check"></i> Tareas</button>
        </div>
      `;
      proyectosGrid.appendChild(card);

      // Acciones de modal
      card.querySelectorAll('button[data-action]')?.forEach(btn => {
        btn.addEventListener('click', () => handleInfoClick(btn.getAttribute('data-action'), btn.getAttribute('data-id')));
      });
    });
  }

  // Modal elegante
  function ensureModal(){
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay){
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3 id="modalTitle"></h3><button class="modal-close" aria-label="Cerrar"><i class="fas fa-times"></i></button></div><div class="modal-body" id="modalBody"></div></div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e)=>{ if (e.target === overlay) closeModal(); });
      overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    }
    return overlay;
  }
  function openModal(title, html){
    const overlay = ensureModal();
    overlay.querySelector('#modalTitle').textContent = title;
    overlay.querySelector('#modalBody').innerHTML = html;
    overlay.classList.add('show');
  }
  function closeModal(){
    const overlay = document.querySelector('.modal-overlay');
    overlay?.classList.remove('show');
  }

  function handleInfoClick(action, proyectoId){
    fetchJSON(`/api/proyectos/${proyectoId}`).then(d => {
      if (!(d && d.success && d.proyecto)) return;
      const pr = d.proyecto;
      if (action === 'inicio'){
        openModal('Fecha de inicio', `
          <div class="info-grid">
            <div><span class="info-label">Proyecto:</span> ${pr.nombre}</div>
            <div><span class="info-label">Inicio:</span> ${formatDate(pr.fecha_inicio)}</div>
            <div><span class="info-label">Jefe:</span> ${pr.jefe_nombre || '-'}</div>
            <div><span class="info-label">Estado:</span> ${statusLabel(pr.estado)}</div>
          </div>
        `);
      } else if (action === 'fin'){
        openModal('Fecha final', `
          <div class="info-grid">
            <div><span class="info-label">Proyecto:</span> ${pr.nombre}</div>
            <div><span class="info-label">Fin:</span> ${formatDate(pr.fecha_fin)}</div>
            <div><span class="info-label">Duración estimada:</span> ${calcDuration(pr.fecha_inicio, pr.fecha_fin)}</div>
            <div><span class="info-label">Estado:</span> ${statusLabel(pr.estado)}</div>
          </div>
        `);
      } else if (action === 'usuarios'){
        const miembros = pr.miembros || [];
        const list = miembros.length ? miembros.map(m => `<li><i class="fas fa-user"></i> ${m.nombre} <span class="muted">(${m.email})</span> · ${m.rol}</li>`).join('') : '<li class="muted">Sin miembros asignados</li>';
        openModal('Usuarios asignados', `
          <div class="info-block">
            <div class="info-row"><span class="info-label">Proyecto:</span> ${pr.nombre}</div>
            <ul class="modal-list">${list}</ul>
          </div>
        `);
      } else if (action === 'tareas'){
        // Cargar tareas asignadas del proyecto
        fetchJSON(`/api/tareas/proyecto/${proyectoId}`).then(r => {
          const tareas = r && r.success ? (r.tareas || []) : [];
          const list = tareas.length ? tareas.map(t => `
            <li>
              <i class="fas fa-check-circle"></i>
              <span class="task-title">${escapeHtml(t.titulo)}</span>
              <span class="muted">• ${estadoTareaLabel(t.estado)}</span>
            </li>`).join('') : '<li class="muted">Sin tareas asignadas</li>';
          openModal('Tareas asignadas', `
            <div class="info-block">
              <div class="info-row"><span class="info-label">Proyecto:</span> ${pr.nombre}</div>
              <ul class="modal-list">${list}</ul>
            </div>
          `);
        }).catch(() => {
          openModal('Tareas asignadas', '<p>No se pudieron cargar las tareas del proyecto.</p>');
        });
      }
    }).catch(()=> openModal('Información', '<p>No se pudo cargar la información del proyecto.</p>'));
  }

  function calcDuration(inicio, fin){
    const di = new Date(inicio), df = new Date(fin);
    if (isNaN(di) || isNaN(df)) return '-';
    const ms = df - di; const days = Math.round(ms/ (1000*60*60*24));
    return days >= 0 ? `${days} días` : '-';
  }

  function cargarSelectProyectos(){
    const selects = [selProyectoAsignacion, selProyectoDocs, selProyectoTareas];
    selects.forEach(sel => { if (sel) sel.innerHTML = '<option value="">Seleccione un proyecto...</option>'; });
    proyectosLider.forEach(p => {
      selects.forEach(sel => {
        if (!sel) return;
        const opt = document.createElement('option');
        opt.value = p.id; opt.textContent = p.nombre || `Proyecto ${p.id}`;
        sel.appendChild(opt);
      });
    });
  }

  // Asignaciones de miembros
  const selMiembroAsignacion = document.getElementById('selMiembroAsignacion');
  const btnAsignarMiembro = document.getElementById('btnAsignarMiembro');
  const tablaMiembros = document.getElementById('tablaMiembros');

  function cargarMiembrosCatalogo(){
    fetchJSON('/api/usuarios').then(d => {
      const usuarios = d.success ? (d.usuarios || d.users || []) : [];
      if (selMiembroAsignacion){
        selMiembroAsignacion.innerHTML = '<option value="">Seleccione un miembro...</option>';
        usuarios.filter(u => ['trabajador','miembro'].includes(u.rol)).forEach(u => {
          const opt = document.createElement('option');
          opt.value = u.id; opt.textContent = `${u.nombre} (${u.email})`;
          selMiembroAsignacion.appendChild(opt);
        });
      }
    }).catch(err => console.error('Error cargando usuarios', err));
  }

  btnAsignarMiembro?.addEventListener('click', async () => {
    const proyecto_id = selProyectoAsignacion?.value;
    const usuario_id = selMiembroAsignacion?.value;
    if (!proyecto_id || !usuario_id){
      await Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Seleccione proyecto y miembro', confirmButtonColor: '#4e73df' });
      return;
    }
    try {
      const lista = await fetchJSON(`/api/asignaciones?proyecto_id=${proyecto_id}`);
      const yaAsignado = Array.isArray(lista.asignaciones) && lista.asignaciones.some(a => String(a.usuario_id) === String(usuario_id));
      if (yaAsignado){
        await Swal.fire({ icon: 'info', title: 'Ya asignado', text: 'El usuario ya está asignado a este proyecto', confirmButtonColor: '#4e73df' });
        return;
      }
      const res = await fetch('/api/asignaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proyecto_id, usuario_id }) }).then(r=>r.json());
      if (res.success){
        await Swal.fire({ icon: 'success', title: 'Asignado', text: 'Miembro asignado al proyecto', confirmButtonColor: '#4e73df' });
        cargarMiembrosDelProyecto(proyecto_id);
      } else {
        await Swal.fire({ icon: 'error', title: 'No se pudo asignar', text: res.error || 'Intente nuevamente', confirmButtonColor: '#4e73df' });
      }
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo procesar la asignación', confirmButtonColor: '#4e73df' });
    }
  });

  function cargarMiembrosDelProyecto(proyectoId){
    if (!proyectoId){
      const tbody = tablaMiembros?.querySelector('tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center">Seleccione un proyecto</td></tr>';
      return;
    }
    setLoading('#tablaMiembros');
    fetchJSON(`/api/proyectos/${proyectoId}`).then(d => {
      const miembros = d.success && d.proyecto ? (d.proyecto.miembros || []) : [];
      const tbody = tablaMiembros?.querySelector('tbody');
      if (!tbody) return;
      if (miembros.length === 0){ tbody.innerHTML = '<tr><td colspan="4" class="text-center">Sin miembros aún</td></tr>'; return; }
      tbody.innerHTML = '';
      miembros.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${m.nombre}</td>
          <td>${m.email}</td>
          <td>${m.rol}</td>
          <td><button class="btn btn-outline" data-remove="${m.usuario_id}"><i class="fas fa-user-minus"></i> Quitar</button></td>
        `;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('button[data-remove]')?.forEach(btn => {
        btn.addEventListener('click', () => {
          const usuarioId = btn.getAttribute('data-remove');
          // Buscar asignación id para ese usuario en el proyecto
          fetchJSON(`/api/asignaciones?proyecto_id=${proyectoId}`).then(a => {
            const asign = (a.asignaciones || []).find(x => String(x.usuario_id) === String(usuarioId));
            if (!asign) return alert('No se encontró asignación');
            fetch(`/api/asignaciones/${asign.id}`, { method: 'DELETE' })
              .then(r => r.json()).then(rr => { if (rr.success){ cargarMiembrosDelProyecto(proyectoId); } });
          });
        });
      });
    });
  }
  selProyectoAsignacion?.addEventListener('change', ()=> cargarMiembrosDelProyecto(selProyectoAsignacion.value));

  // Se elimina la gestión de Áreas; solo se usa tareas de proyecto

  // ===== Tareas (en sección Áreas) =====
  selProyectoTareas?.addEventListener('change', () => cargarTareasDelProyecto(selProyectoTareas.value));

  btnCrearTarea?.addEventListener('click', () => {
    const proyecto_id = (selProyectoTareas?.value);
    const titulo = document.getElementById('txtTituloTarea')?.value?.trim();
    const descripcion = document.getElementById('txtDescTarea')?.value?.trim();
    if (!proyecto_id) return alert('Seleccione un proyecto');
    if (!titulo) return alert('Ingrese un título para la tarea');
    fetch('/api/tareas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyecto_id, titulo, descripcion })
    }).then(r => r.json()).then(res => {
      if (res && res.tarea_id){
        document.getElementById('txtTituloTarea').value = '';
        document.getElementById('txtDescTarea').value = '';
        cargarTareasDelProyecto(proyecto_id);
      } else {
        alert(res.error || 'No se pudo crear la tarea');
      }
    }).catch(() => alert('Error al crear la tarea'));
  });

  btnRefrescarTareas?.addEventListener('click', () => {
    const proyecto_id = (selProyectoTareas?.value);
    cargarTareasDelProyecto(proyecto_id);
  });

  function cargarTareasDelProyecto(proyectoId){
    if (!tablaTareas) return; // si no estamos en la página de áreas
    const tbody = tablaTareas.querySelector('tbody');
    if (!proyectoId){ if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center">Seleccione un proyecto</td></tr>'; return; }
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
    fetchJSON(`/api/tareas/proyecto/${proyectoId}`).then(d => {
      const tareas = d && d.success ? (d.tareas || []) : [];
      if (!tbody) return;
      if (tareas.length === 0){ tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin tareas aún</td></tr>'; return; }
      tbody.innerHTML = '';
      tareas.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(t.titulo)}</td>
          <td class="muted">${escapeHtml(t.descripcion || '')}</td>
          <td>${estadoTareaLabel(t.estado)}</td>
          <td>${formatDate(t.created_at)}</td>
          <td>
            <div class="action-row compact">
              <button class="btn btn-light btn-compact" data-task-status="en_progreso" data-id="${t.id}"><i class="fas fa-play"></i> Progreso</button>
              <button class="btn btn-light btn-compact" data-task-status="revisando" data-id="${t.id}"><i class="fas fa-search"></i> Revisar</button>
              <button class="btn btn-light btn-compact" data-task-status="completada" data-id="${t.id}"><i class="fas fa-check"></i> Done</button>
              <button class="btn btn-light btn-compact" data-task-email="${t.id}" data-proyecto="${proyectoId}" data-task-title="${escapeHtml(t.titulo)}" data-task-estado="${t.estado}" title="Informar estado por correo"><i class="fas fa-envelope"></i></button>
              <button class="btn btn-outline btn-compact" data-task-del="${t.id}"><i class="fas fa-trash"></i></button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('button[data-task-status]')?.forEach(btn => {
        btn.addEventListener('click', () => {
          const tarea_id = btn.getAttribute('data-id');
          const estado = btn.getAttribute('data-task-status');
          fetch(`/api/tareas/${tarea_id}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) })
            .then(r => r.json()).then(() => cargarTareasDelProyecto(proyectoId));
        });
      });
      tbody.querySelectorAll('button[data-task-email]')?.forEach(btn => {
        btn.addEventListener('click', async () => {
          const prId = btn.getAttribute('data-proyecto');
          const tareaTitulo = btn.getAttribute('data-task-title') || 'Tarea';
          const tareaEstado = btn.getAttribute('data-task-estado') || 'pendiente';
          const estados = { pendiente:'Pendiente', en_progreso:'En progreso', revisando:'Revisando', completada:'Completada' };
          try {
            const pRes = await fetchJSON(`/api/proyectos/${prId}`);
            const proyecto = pRes?.proyecto || {};
            const miembros = proyecto.miembros || [];
            const trabajadores = miembros.filter(m => String(m.rol).toLowerCase().includes('trab'));
            if (!trabajadores.length){ Swal.fire({ icon:'info', title:'Sin trabajadores', text:'El proyecto no tiene trabajadores asignados.' }); return; }
            const toList = trabajadores.map(m=>m.email).join(',');
            const fd = new FormData();
            fd.append('to_emails', toList);
            fd.append('asunto', `Estado de tarea: ${tareaTitulo} · ${proyecto.nombre}`);
            fd.append('cuerpo', `El estado actual de la tarea "${tareaTitulo}" es "${estados[tareaEstado]||tareaEstado}".`);
            const r = await fetch('/api/correos', { method:'POST', body: fd });
            const d = await r.json().catch(()=>({}));
            if (!r.ok || !d.ok) throw new Error('No se pudo enviar el correo');
            Swal.fire({ icon:'success', title:'Estado de la tarea enviado correctamente a', text: toList, timer:1600, showConfirmButton:false });
            updateTopCorreoBadge();
          } catch(e){ Swal.fire({ icon:'error', title:'Error', text:String(e.message||e) }); }
        });
      });

      tbody.querySelectorAll('button[data-task-del]')?.forEach(btn => {
        btn.addEventListener('click', async () => {
          const tarea_id = btn.getAttribute('data-task-del');
          try {
            const confirmRes = await Swal.fire({
              icon: 'question',
              title: '¿Eliminar tarea?',
              text: 'Esta acción eliminará la tarea del proyecto.',
              showCancelButton: true,
              confirmButtonText: 'Sí, eliminar',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#e74a3b',
              cancelButtonColor: '#6c757d'
            });
            if (!confirmRes.isConfirmed) return;
            const r = await fetch(`/api/tareas/${tarea_id}`, { method: 'DELETE' });
            const d = await r.json().catch(()=>({}));
            if (!r.ok) throw new Error(d?.error || 'No se pudo eliminar la tarea');
            await Swal.fire({ icon: 'success', title: 'Tarea eliminada', text: 'Se eliminó correctamente', timer: 1400, showConfirmButton: false });
            cargarTareasDelProyecto(proyectoId);
          } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: String(e.message || e) });
          }
        });
      });
    }).catch(() => { if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center">Error al cargar tareas</td></tr>'; });
  }
  // Documentos
  const tablaDocumentos = document.getElementById('tablaDocumentos');
  selProyectoDocs?.addEventListener('change', () => cargarDocumentos(selProyectoDocs.value));
  const btnDescTodos = document.getElementById('btnDescargarTodosDocs');
  const btnDescSel = document.getElementById('btnDescargarSeleccionadosDocs');
  const chkSelectAll = document.getElementById('chkDocsSelectAll');
  const showInfo = (title, text) => { try{ if (typeof Swal !== 'undefined'){ Swal.fire({ icon:'info', title, text }); } else { alert(text || title); } }catch(_){ alert(text || title); } };

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

  chkSelectAll?.addEventListener('change', ()=>{
    const tbody = tablaDocumentos?.querySelector('tbody');
    const checks = Array.from(tbody?.querySelectorAll('input[type="checkbox"][data-id]') || []);
    checks.forEach(ch => { ch.checked = !!chkSelectAll.checked; });
  });
  function cargarDocumentos(proyectoId){
    if (!proyectoId){
      const tbody = tablaDocumentos?.querySelector('tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center">Seleccione un proyecto</td></tr>';
      return;
    }
    setLoading('#tablaDocumentos');
    fetchJSON(`/api/proyectos/${proyectoId}`).then(p => {
      // luego lista
      return fetchJSON(`/api/proyectos/${proyectoId}/documentos`);
    }).then(d => {
      const docs = d.success ? (d.documentos || []) : [];
      const tbody = tablaDocumentos?.querySelector('tbody');
      if (!tbody) return;
      if (docs.length === 0){ tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin documentos</td></tr>'; return; }
      tbody.innerHTML = '';
      docs.forEach(doc => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', doc.id);
        tr.innerHTML = `
          <td style="text-align:center;">
            <input type="checkbox" data-id="${doc.id}" aria-label="Seleccionar documento" />
          </td>
          <td>${escapeHtml(doc.nombre_archivo)}</td>
          <td>${doc.tipo}</td>
          <td>${(doc.tamano/1024).toFixed(1)} KB</td>
          <td>${doc.subido_por || '-'}</td>
          <td>
            <a class="btn btn-outline" href="/api/documentos/${doc.id}/download"><i class="fas fa-download"></i> Descargar</a>
            <button class="btn btn-outline" data-del="${doc.id}"><i class="fas fa-trash"></i> Eliminar</button>
          </td>`;
        tbody.appendChild(tr);
      });
      // Al recibir lista, limpiar el estado del "Seleccionar todo"
      if (chkSelectAll) chkSelectAll.checked = false;
      tbody.querySelectorAll('button[data-del]')?.forEach(btn => {
        btn.addEventListener('click', ()=>{
          const id = btn.getAttribute('data-del');
          fetch(`/api/documentos/${id}`, { method:'DELETE' }).then(r => r.json()).then(rr => { if (rr.success){ cargarDocumentos(selProyectoDocs.value); } });
        });
      });
    }).catch(err => { console.error('Error cargando docs', err); });
  }

  // Inicialización
  loadUser();
  cargarMisProyectos();
  cargarMiembrosCatalogo();
  updateTopCorreoBadge();
  setInterval(updateTopCorreoBadge, 30000);
  setupAutoLogoutIdle();

  // Perfil (SweetAlert)
  const profileBtn = document.getElementById('profileBtn');
  profileBtn?.addEventListener('click', async () => {
    if (!currentUser){ await loadUser(); }
    const last = currentUser?.last_login ? formatDateTime(currentUser.last_login) : '—';
    console.debug('Líder perfil: last_login (raw):', currentUser?.last_login, '| (fmt):', last);
    const html = `
      <div style="display:grid; grid-template-columns: 140px 1fr; gap: 16px; align-items:start;">
        <div style="display:grid; gap:10px; justify-items:center;">
          <div id="swAvatarPreview" style="width:96px;height:96px;border-radius:50%;background:#eef2f7;display:flex;align-items:center;justify-content:center;font-weight:700;color:#374151;overflow:hidden;"></div>
          <input type="file" id="swPerfilFoto" accept="image/*" style="display:none;" />
          <label for="swPerfilFoto" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #6670AA;border-radius:8px;color:#363955;cursor:pointer;"><i class="fas fa-camera"></i> Cambiar foto</label>
        </div>
        <div>
          <div class="form-group" style="margin-bottom:12px;"><label style="font-weight:600;color:#363955;">Nombre</label><input id="swPerfilNombre" class="form-control" value="${currentUser?.nombre||''}" /></div>
          <div class="form-group"><label style="font-weight:600;color:#363955;">Correo</label><input id="swPerfilEmail" class="form-control" value="${currentUser?.email||''}" /></div>
          <div class="form-group"><label style="font-weight:600;color:#363955;">Rol</label><input id="swPerfilRol" class="form-control" value="${roleLabel(currentUser?.rol||'')}" disabled /></div>
          <div class="form-group"><label style="font-weight:600;color:#363955;">Último ingreso</label><input id="swPerfilLastLogin" class="form-control" value="${last}" disabled /></div>
        </div>
      </div>`;
    const result = await Swal.fire({ title: 'Mi Perfil', html, width: 600, showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar', focusConfirm: false, didOpen: async () => {
      const prev = document.getElementById('swAvatarPreview');
      const url = currentUser?.avatar_url || '';
      if (prev){ if (url){ prev.style.backgroundImage = `url('${url}')`; prev.style.backgroundSize='cover'; prev.style.backgroundPosition='center'; prev.textContent=''; } else { prev.textContent = (currentUser?.nombre||'U').trim().charAt(0).toUpperCase(); } }
      const fileInput = document.getElementById('swPerfilFoto');
      fileInput?.addEventListener('change', () => {
        const f = fileInput.files && fileInput.files[0];
        if (!f || !prev) return;
        const reader = new FileReader();
        reader.onload = e => { prev.style.backgroundImage = `url('${e.target.result}')`; prev.style.backgroundSize='cover'; prev.style.backgroundPosition='center'; prev.textContent=''; };
        reader.readAsDataURL(f);
      });
      const nombreEl = document.getElementById('swPerfilNombre');
      if (nombreEl){
        const handler = function(){
          const v = this.value || '';
          const filtered = v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
          if (filtered !== v) this.value = filtered;
        };
        nombreEl.addEventListener('input', handler);
        nombreEl.addEventListener('blur', handler);
      }
    } });
    if (result && result.isConfirmed){
      try {
        const nombre = (document.getElementById('swPerfilNombre')?.value || '').trim();
        const email = (document.getElementById('swPerfilEmail')?.value || '').trim();
        const fileInput = document.getElementById('swPerfilFoto');
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (file){
          const fd = new FormData(); fd.append('avatar', file);
          const avRes = await fetch(`/api/usuarios/${currentUser.id}/avatar`, { method: 'POST', body: fd });
          const avData = await avRes.json().catch(()=>({}));
          if (avRes.ok && avData.avatar_url){ currentUser.avatar_url = avData.avatar_url; const avatarEl = document.getElementById('profileAvatar'); if (avatarEl){ avatarEl.style.backgroundImage = `url('${avData.avatar_url}')`; avatarEl.style.backgroundSize='cover'; avatarEl.style.backgroundPosition='center'; avatarEl.textContent=''; } }
        }
        const payload = { nombre: nombre || currentUser.nombre, email: email || currentUser.email, rol: currentUser.rol, activo: currentUser.activo };
        const updRes = await fetch(`/api/usuarios/${currentUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const updData = await updRes.json().catch(()=>({}));
        if (!updRes.ok){ throw new Error(updData.message || 'No se pudo actualizar el perfil'); }
        currentUser.nombre = payload.nombre; currentUser.email = payload.email;
        Swal.fire({ icon:'success', title:'Perfil actualizado', timer:1200, showConfirmButton:false });
      } catch (err){ Swal.fire({ icon:'error', title:'Error', text: String(err.message || err) }); }
    }
  });
})();

// Helpers de UI adicionales
function escapeHtml(str){
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function estadoTareaLabel(estado){
  switch(estado){
    case 'pendiente': return 'Pendiente';
    case 'en_progreso': return 'En progreso';
    case 'revisando': return 'Revisando';
    case 'completada': return 'Completada';
    default: return estado || '-';
  }
}
