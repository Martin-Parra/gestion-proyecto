(function(){
  (function(){
    try{ history.pushState(null,'',location.href); }catch(_){}
    window.addEventListener('popstate', function(e){ if (e && e.preventDefault) e.preventDefault(); history.go(1); });
    window.addEventListener('keydown', function(e){
      if ((e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) || e.key === 'BrowserBack' || e.key === 'BrowserForward') {
        e.preventDefault();
      }
    });
  })();
  // Navegación sin overlay (se elimina la animación de carga)
  function showOverlayThenNavigate(href){
    window.location.href = href;
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
        confirmButtonColor: '#4D5180',
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

  function setupTogglePassword(){
    const toggle = document.getElementById('togglePassword');
    const input = document.getElementById('password');
    if (!toggle || !input) return;
    toggle.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupLogout();
    setupTogglePassword();
    const nombreInput = document.getElementById('nombre');
    if (nombreInput){
      const handler = function(){
        const v = this.value || '';
        const filtered = v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
        if (filtered !== v) this.value = filtered;
      };
      nombreInput.addEventListener('input', handler);
      nombreInput.addEventListener('blur', handler);
    }

    // Interceptar navegación interna para mostrar overlay sólo al cambiar de sección/página
    const LOADER_MS = 800;
    const anchors = Array.from(document.querySelectorAll('a[href]:not([target])'));
    anchors.forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href) return;
        const isInternal = href.startsWith('/') || href.startsWith(window.location.origin);
        const isHash = href.startsWith('#');
        if (isInternal || isHash){
          e.preventDefault();
          showOverlayThenNavigate(href, LOADER_MS);
        }
      });
    });

    // Sin overlay en salida de la página

    const form = document.getElementById('formCrearUsuario');
    if (!form) return;

    form.addEventListener('submit', function(e){
      e.preventDefault();

      const formData = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        rol: document.getElementById('rol').value
      };
      const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
      if (!nameRegex.test(String(formData.nombre || '').trim())){
        Swal.fire({ icon: 'warning', title: 'Nombre inválido', text: 'El nombre solo debe contener letras y espacios.' });
        return;
      }

      fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      .then(r => r.json())
      .then(data => {
        if (data && data.success){
          Swal.fire({ 
            icon: 'success', 
            title: 'Usuario creado correctamente', 
            timer: 2200, 
            showConfirmButton: false 
          }).then(() => {
            showOverlayThenNavigate('/dashboard/admin#usuarios');
          });
        } else {
          const msg = (data && data.message) || 'Error al crear usuario';
          Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
      })
      .catch(err => {
        console.error('Error creando usuario:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión' });
      });
    });
  });
})();
