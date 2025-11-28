(() => {
  let proyectos = [];
  let charts = { estados: null, tareas: null, avance: null };
  let pluginRegistered = false;
  let currentUser = null;

  function setAvatar(name) {
    const avatar = document.getElementById('profileAvatar');
    if (!avatar) return;
    const initial = (name || 'U').trim().charAt(0).toUpperCase();
    avatar.textContent = initial;
  }

  async function cargarUsuario() {
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' });
      if (!r.ok) return;
      const d = await r.json();
      if (d && d.success && d.user) {
        currentUser = d.user;
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) {
          const url = currentUser.avatar_url || '';
          if (url) {
            avatarEl.style.backgroundImage = `url('${url}')`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
            avatarEl.textContent = '';
          } else {
            setAvatar(currentUser.nombre);
          }
        }
      }
    } catch (_) {}
  }

  function configurarLogout() {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Deseas cerrar sesión ahora?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#4e73df',
        cancelButtonColor: '#6c757d'
      });
      if (!result.isConfirmed) return;
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true });
      } catch (_) {}
      window.location.href = '/login';
    });
  }

  function updateTopCorreoBadge(){
    const el = document.getElementById('topCorreoBadge');
    if (!el) return;
    fetch('/api/correos/unread_count').then(r=>r.json()).then(d=>{
      const cnt = Number((d && d.count) || 0);
      if (cnt > 0){ el.textContent = String(cnt); el.style.display = 'inline-block'; }
      else { el.style.display = 'none'; }
    }).catch(()=>{});
  }

  function configurarPerfil() {
    const profileBtn = document.getElementById('profileBtn');
    const modal = document.getElementById('perfilModal');
    const closeBtn = document.getElementById('closePerfilModal');
    const cancelarBtn = document.getElementById('cancelarPerfil');
    const nombreInput = document.getElementById('perfilNombre');
    const emailInput = document.getElementById('perfilEmail');
    const fotoInput = document.getElementById('perfilFoto');
    const avatarPreview = document.getElementById('perfilAvatarPreview');

    function openModal(){ if (modal) { modal.classList.add('show'); modal.style.display = 'block'; populateForm(); } }
    function closeModal(){ if (modal) { modal.classList.remove('show'); modal.style.display = 'none'; } }
    function populateForm(){ if (!currentUser) return; if (nombreInput) nombreInput.value = currentUser.nombre || ''; if (emailInput) emailInput.value = currentUser.email || ''; const url = currentUser.avatar_url || ''; if (avatarPreview){ if (url){ avatarPreview.style.backgroundImage = `url('${url}')`; avatarPreview.style.backgroundSize='cover'; avatarPreview.style.backgroundPosition='center'; avatarPreview.textContent=''; } else { avatarPreview.style.backgroundImage=''; avatarPreview.textContent = (currentUser.nombre||'U').trim().charAt(0).toUpperCase(); } } }

    profileBtn && profileBtn.addEventListener('click', openModal);
    closeBtn && closeBtn.addEventListener('click', closeModal);
    cancelarBtn && cancelarBtn.addEventListener('click', closeModal);

    if (fotoInput){
      fotoInput.addEventListener('change', async () => {
        const file = fotoInput.files && fotoInput.files[0];
        if (!file || !currentUser) return;
        try {
          const fd = new FormData(); fd.append('avatar', file);
          const avRes = await fetch(`/api/usuarios/${currentUser.id}/avatar`, { method: 'POST', body: fd });
          const avData = await avRes.json().catch(()=>({}));
          if (avRes.ok && avData.avatar_url){
            currentUser.avatar_url = avData.avatar_url;
            if (avatarPreview){ avatarPreview.style.backgroundImage = `url('${avData.avatar_url}')`; avatarPreview.style.backgroundSize='cover'; avatarPreview.style.backgroundPosition='center'; avatarPreview.textContent=''; }
            const avatarEl = document.getElementById('profileAvatar');
            if (avatarEl){ avatarEl.style.backgroundImage = `url('${avData.avatar_url}')`; avatarEl.style.backgroundSize='cover'; avatarEl.style.backgroundPosition='center'; avatarEl.textContent=''; }
            Swal.fire({ icon:'success', title:'Foto actualizada', timer:1200, showConfirmButton:false });
          } else {
            Swal.fire({ icon:'error', title:'Error', text: avData.message || 'No se pudo guardar la foto' });
          }
        } catch (err){ Swal.fire({ icon:'error', title:'Error', text: String(err.message || err) }); }
      });
    }

    const form = document.getElementById('perfilForm');
    if (form){
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        try {
          const nombre = (nombreInput?.value || '').trim();
          const email = (emailInput?.value || '').trim();
          const payload = { nombre: nombre || currentUser.nombre, email: email || currentUser.email, rol: currentUser.rol, activo: currentUser.activo };
          const updRes = await fetch(`/api/usuarios/${currentUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const updData = await updRes.json().catch(()=>({}));
          if (!updRes.ok){ throw new Error(updData.message || 'No se pudo actualizar el perfil'); }
          currentUser.nombre = payload.nombre; currentUser.email = payload.email;
          closeModal();
          Swal.fire({ icon:'success', title:'Perfil actualizado', timer:1200, showConfirmButton:false });
        } catch (err){ Swal.fire({ icon:'error', title:'Error', text: String(err.message || err) }); }
      });
    }
  }

  function promedioAvance(list) {
    if (!Array.isArray(list) || list.length === 0) return 0;
    const sum = list.reduce((acc, p) => acc + Number(p.porcentaje_avance || 0), 0);
    return Math.round(sum / list.length);
  }

  function contarEstadosProyectos(list) {
    const map = { en_ejecucion: 0, en_pausa: 0, finalizado: 0 };
    list.forEach(p => {
      const e = String(p.estado || '').toLowerCase();
      if (e in map) map[e]++;
    });
    return map;
  }

  function contarEstadosTareas(list) {
    const map = { pendiente: 0, en_progreso: 0, revisando: 0, completada: 0 };
    list.forEach(t => {
      const e = String(t.estado || '').toLowerCase();
      if (e in map) map[e]++;
    });
    return map;
  }

  function actualizarStatCards(totalProy, totalTareas, completadas, avanceProm) {
    const a = document.getElementById('statTotalProyectos');
    const b = document.getElementById('statTotalTareas');
    const c = document.getElementById('statTareasCompletadas');
    const d = document.getElementById('statAvancePromedio');
    if (a) a.textContent = String(totalProy || 0);
    if (b) b.textContent = String(totalTareas || 0);
    if (c) c.textContent = String(completadas || 0);
    if (d) d.textContent = `${String(avanceProm || 0)}%`;
  }

  function ensureChart(ctxId, type, data, options) {
    try {
      const ctx = document.getElementById(ctxId);
      if (!ctx || typeof Chart === 'undefined') return null;
      const key = ctxId.replace('chart', '').toLowerCase();
      if (charts[key]) charts[key].destroy();
      const baseOpts = { responsive: true, maintainAspectRatio: false };
      const ch = new Chart(ctx, { type, data, options: Object.assign(baseOpts, options||{}) });
      charts[key] = ch;
      return ch;
    } catch (_) { return null; }
  }

  function renderEstadosProyectos(estados) {
    const labels = ['En ejecución', 'En pausa', 'Finalizado'];
    const data = [estados.en_ejecucion || 0, estados.en_pausa || 0, estados.finalizado || 0];
    ensureChart('chartEstadosProyectos', 'pie', {
      labels,
      datasets: [{ data, backgroundColor: ['#4e73df','#f6c23e','#1cc88a'] }]
    }, { plugins: { legend: { position: 'bottom' } } });
  }

  function renderTareasProyecto(estados) {
    const labels = ['Pendiente', 'En Progreso', 'Revisando', 'Completada'];
    const data = [estados.pendiente, estados.en_progreso, estados.revisando, estados.completada];
    ensureChart('chartTareasProyecto', 'bar', {
      labels,
      datasets: [{ label: 'Tareas', data, backgroundColor: '#4e73df' }]
    }, { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } });
  }

  function renderAvanceProyecto(porcentaje) {
    const val = Math.max(0, Math.min(100, Number(porcentaje || 0)));
    if (typeof Chart !== 'undefined' && !pluginRegistered) {
      Chart.register({
        id: 'centerText',
        afterDatasetsDraw(chart, args, opts) {
          const text = opts && opts.text ? String(opts.text) : '';
          if (!text) return;
          const { ctx, chartArea } = chart;
          const x = (chartArea.left + chartArea.right) / 2;
          const y = (chartArea.top + chartArea.bottom) / 2;
          ctx.save();
          ctx.fillStyle = '#4e73df';
          ctx.font = '600 18px Segoe UI, Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
          ctx.restore();
        }
      });
      pluginRegistered = true;
    }
    ensureChart('chartAvanceProyecto', 'doughnut', {
      labels: ['Avance', 'Restante'],
      datasets: [{ data: [val, 100 - val], backgroundColor: ['#1cc88a','#e3e6f0'] }]
    }, { plugins: { legend: { position: 'bottom' }, centerText: { text: `${val}%` } }, cutout: '70%' });
  }

  async function cargarProyectos() {
    const sel = document.getElementById('filtroProyecto');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccione un proyecto...</option>';
    const r = await fetch('/api/proyectos');
    const d = await r.json();
    if (!d.success) return;
    proyectos = Array.isArray(d.proyectos) ? d.proyectos : [];
    proyectos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nombre || `Proyecto ${p.id}`;
      sel.appendChild(opt);
    });
    const estados = contarEstadosProyectos(proyectos);
    renderEstadosProyectos(estados);
    actualizarStatCards(proyectos.length, 0, 0, promedioAvance(proyectos));
    if (proyectos.length > 0) {
      sel.value = proyectos[0].id;
      await cargarProyectoCompleto(sel.value);
    } else {
      // Inicializar gráficos vacíos
      renderTareasProyecto({ pendiente: 0, en_progreso: 0, revisando: 0, completada: 0 });
      renderAvanceProyecto(0);
      renderEquipoProyecto({});
    }
  }

  async function cargarTareasProyecto(id) {
    if (!id) {
      renderTareasProyecto({ pendiente: 0, en_progreso: 0, revisando: 0, completada: 0 });
      renderAvanceProyecto(0);
      return;
    }
    const r = await fetch(`/api/tareas/proyecto/${id}`);
    const d = await r.json();
    const tareas = d && d.success ? (d.tareas || []) : [];
    const estados = contarEstadosTareas(tareas);
    renderTareasProyecto(estados);
    const completadas = tareas.filter(t => String(t.estado).toLowerCase() === 'completada').length;
    const totalTareas = tareas.length;
    const proy = proyectos.find(p => String(p.id) === String(id));
    const avance = proy ? Number(proy.porcentaje_avance || 0) : 0;
    renderAvanceProyecto(avance);
    actualizarStatCards(proyectos.length, totalTareas, completadas, promedioAvance(proyectos));
  }

  async function cargarEquipoProyecto(id) {
    if (!id) { renderEquipoProyecto({}); return; }
    try {
      const r = await fetch(`/api/proyectos/${id}`);
      const d = await r.json();
      const miembros = d && d.success && d.proyecto ? (d.proyecto.miembros || []) : [];
      const counts = miembros.reduce((acc, m) => { const k = String(m.rol||'').toLowerCase(); acc[k] = (acc[k]||0)+1; return acc; }, {});
      renderEquipoProyecto(counts);
    } catch (_) {
      renderEquipoProyecto({});
    }
  }

  function renderEquipoProyecto(counts) {
    const labels = Object.keys(counts);
    const data = labels.map(l => counts[l]);
    ensureChart('chartEquipoProyecto', 'bar', {
      labels: labels.length ? labels : ['Sin miembros'],
      datasets: [{ label: 'Miembros', data: data.length ? data : [0], backgroundColor: '#36b9cc' }]
    }, { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } });
  }

  async function cargarProyectoCompleto(id) {
    await cargarTareasProyecto(id);
    await cargarEquipoProyecto(id);
  }

  function configurarFiltro() {
    const sel = document.getElementById('filtroProyecto');
    if (!sel) return;
    sel.addEventListener('change', () => cargarProyectoCompleto(sel.value));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    configurarLogout();
    await cargarUsuario();
    await cargarProyectos();
    configurarFiltro();
    configurarPerfil();
    updateTopCorreoBadge();
    setInterval(updateTopCorreoBadge, 30000);
  });
})();
