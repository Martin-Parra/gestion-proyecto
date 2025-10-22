(function(){
  let jefes = [];

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

  function cargarJefes(){
    return fetch('/api/proyectos/jefes')
      .then(r => r.json())
      .then(data => {
        if (data && data.success) {
          jefes = data.jefes || [];
        } else {
          jefes = [];
        }
      })
      .catch(() => { jefes = []; });
  }

  function mostrarResultadosJefes(lista){
    const cont = document.getElementById('resultadosJefe');
    if (!cont) return;
    if (!lista || lista.length === 0){
      cont.style.display = 'none';
      cont.innerHTML = '';
      return;
    }
    cont.innerHTML = '';
    lista.forEach(j => {
      const item = document.createElement('div');
      item.className = 'resultado-item';
      item.innerHTML = `<i class="fas fa-user-tie"></i> ${j.nombre} <small style="color:#666;">(${j.email})</small>`;
      item.addEventListener('click', () => seleccionarJefe(j.id, j.nombre));
      cont.appendChild(item);
    });
    cont.style.display = 'block';
  }

  function seleccionarJefe(id, nombre){
    const inputId = document.getElementById('jefeProyectoId');
    const buscador = document.getElementById('buscadorJefe');
    const limpiarBtn = document.getElementById('limpiarJefeBtn');
    if (!inputId || !buscador || !limpiarBtn) return;
    inputId.value = id;
    buscador.value = nombre;
    buscador.setAttribute('readonly','readonly');
    limpiarBtn.style.display = 'flex';

    const nuevoBtn = limpiarBtn.cloneNode(true);
    limpiarBtn.parentNode.replaceChild(nuevoBtn, limpiarBtn);
    const limpiar = document.getElementById('limpiarJefeBtn');
    limpiar.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      inputId.value = '';
      buscador.value = '';
      buscador.removeAttribute('readonly');
      const cont = document.getElementById('resultadosJefe');
      if (cont){ cont.style.display = 'none'; cont.innerHTML=''; }
      limpiar.style.display = 'none';
    });
  }

  function setupBuscador(){
    const buscador = document.getElementById('buscadorJefe');
    const cont = document.getElementById('resultadosJefe');
    if (!buscador || !cont) return;

    const nuevoInput = buscador.cloneNode(true);
    buscador.parentNode.replaceChild(nuevoInput, buscador);
    const input = document.getElementById('buscadorJefe');

    input.addEventListener('input', function(){
      const q = (this.value || '').toLowerCase().trim();
      if (!q){ cont.style.display='none'; cont.innerHTML=''; return; }
      const filtrados = jefes.filter(j => (j.nombre || '').toLowerCase().includes(q) || (j.email || '').toLowerCase().includes(q));
      mostrarResultadosJefes(filtrados);
    });

    input.addEventListener('focus', function(){
      if (jefes && jefes.length > 0){ mostrarResultadosJefes(jefes.slice(0,5)); }
    });

    document.addEventListener('click', (e)=>{
      if (!cont.contains(e.target) && e.target.id !== 'buscadorJefe'){
        cont.style.display = 'none';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    setupLogout();
    await cargarJefes();
    setupBuscador();

    const form = document.getElementById('formCrearProyecto');
    if (!form) return;

    form.addEventListener('submit', function(e){
      e.preventDefault();
      const payload = {
        nombre_proyecto: document.getElementById('nombreProyecto').value,
        descripcion_proyecto: "",
        fecha_inicio: document.getElementById('fechaInicio').value,
        fecha_fin: document.getElementById('fechaTermino').value,
        responsable_id: document.getElementById('jefeProyectoId').value || null
      };

      fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(r => {
        if (!r.ok) return r.json().then(err => { throw new Error(err.error || 'Error al crear proyecto'); });
        return r.json();
      })
      .then(data => {
        Swal.fire({ icon: 'success', title: 'Proyecto creado', timer: 1500, showConfirmButton: false });
        window.location.href = '/dashboard/admin#proyectos';
      })
      .catch(err => {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Falló la creación' });
      });
    });
  });
})();