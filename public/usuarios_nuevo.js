(function(){
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

      fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      .then(r => r.json())
      .then(data => {
        if (data && data.success){
          Swal.fire({ icon: 'success', title: 'Usuario creado', timer: 1500, showConfirmButton: false });
          // Volver al dashboard de usuarios
          window.location.href = '/dashboard/admin#usuarios';
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