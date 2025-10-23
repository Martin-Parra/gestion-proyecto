(function(){
  const state = { box:'inbox', user:null, cache:{inbox:[], sent:[]} };

  function fetchUser(){
    return fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        if (data && data.success && data.user){
          state.user = data.user;
          const name = data.user.nombre || data.user.email || 'Usuario';
          const el = document.getElementById('userName');
          if (el) el.textContent = name;
          // Ajustar botón Volver según rol
          const back = document.getElementById('backLink');
          if (back){
            const role = (data.user.rol || '').toLowerCase();
            back.href = (role === 'administrador' || role === 'admin') ? '/dashboard/admin' : '/dashboard/trabajador';
          }
          return data.user;
        }
        throw new Error('no-auth');
      })
      .catch(() => { window.location.href = '/login'; });
  }

  function renderList(list){
    const tbody = document.querySelector('#listaCorreos');
    const term = (document.getElementById('buscarInput').value||'').toLowerCase();
    tbody.innerHTML = list.filter(m=>{
      const s = `${m.remitente||''} ${m.destinatarios||''} ${m.asunto||''}`.toLowerCase();
      return s.includes(term);
    }).map(m=>{
      const fecha = m.fecha_envio ? new Date(m.fecha_envio).toLocaleString() : '';
      const estado = (state.box==='inbox') ? (m.leido? 'Leído' : 'No leído') : (m.leido? 'Leído' : 'No leído');
      const fromTo = (state.box==='inbox') ? (m.remitente||'') : (m.destinatarios||'');
      return `
        <tr data-id="${m.id}" class="${!m.leido && state.box==='inbox' ? 'unread':''}">
          <td>${fromTo}</td>
          <td>${m.asunto||'(Sin asunto)'}</td>
          <td>${fecha}</td>
          <td>${estado}</td>
        </tr>`;
    }).join('');
  }

  function load(box){
    state.box = box;
    document.querySelectorAll('.folders .folder').forEach(el=>{
      el.classList.toggle('active', el.dataset.box===box);
    });
    const url = box==='inbox'? '/api/correos/inbox' : '/api/correos/enviados';
    fetch(url).then(r=>r.json()).then(list=>{
      state.cache[box] = list;
      renderList(list);
      const visor = document.getElementById('visor');
      visor.innerHTML = '<div class="placeholder">Selecciona un correo para visualizarlo</div>';
    });
  }

  function openMessage(id){
    fetch(`/api/correos/${id}`).then(r=>r.json()).then(m=>{
      const cont = document.getElementById('visor');
      const fecha = m.fecha_envio ? new Date(m.fecha_envio).toLocaleString() : '';
      const adjuntos = Array.isArray(m.adjuntos)? m.adjuntos: [];
      const adjHtml = adjuntos.length ? `
        <div class=\"attachments\">\n          <strong>Adjuntos (${adjuntos.length}):</strong>\n          <ul>\n            ${adjuntos.map(a=>`<li><a href="${a.url}" download="${(a.nombre||a.nombre_original||'archivo')}">${a.nombre||a.nombre_original||'archivo'}</a> <span class=\"muted\">(${a.tamano ? (Math.round(a.tamano/1024))+' KB' : a.mime||''})</span></li>`).join('')}\n          </ul>\n        </div>` : '';
      cont.innerHTML = `
        <h3>${m.asunto||'(Sin asunto)'}</h3>
        <div class=\"meta\"><strong>De:</strong> ${m.remitente_nombre||m.remitente} &nbsp; <strong>Para:</strong> ${m.para} ${m.cc? `&nbsp; <strong>CC:</strong> ${m.cc}`:''}</div>
        <hr/>
        <div class=\"body\">${(m.cuerpo||'').replace(/\n/g,'<br/>')}</div>
        ${adjHtml}
        <div class=\"muted\" style=\"margin-top:10px;color:#6b7280\">${fecha}</div>
      `;
      // marcar leído si aplica (inbox)
      if(state.box==='inbox' && !m.leido){ fetch(`/api/correos/${id}/leido`, {method:'PATCH'}).then(()=>load('inbox')); }
    });
  }

  function setup(){
    document.querySelectorAll('.folders .folder').forEach(el=>{
      el.addEventListener('click', ()=>load(el.dataset.box));
    });
    document.getElementById('buscarInput').addEventListener('input', ()=>{
      const list = state.cache[state.box] || [];
      renderList(list);
    });
    document.querySelector('#listaCorreos').addEventListener('click', (e)=>{
      const tr = e.target.closest('tr[data-id]');
      if (tr){ openMessage(tr.dataset.id); }
    });

    // Modal redactar
    const modal = document.getElementById('modalRedactar');
    document.getElementById('btnRedactar').addEventListener('click', ()=>{ modal.classList.add('open'); });
    document.getElementById('cancelarRedactar').addEventListener('click', ()=>{ modal.classList.remove('open'); });
    document.getElementById('closeRedactar').addEventListener('click', ()=>{ modal.classList.remove('open'); });

    const form = document.getElementById('formRedactar');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      fetch('/api/correos', { method:'POST', body: fd }).then(r=>r.json()).then(resp=>{
        if (resp && resp.ok){
          modal.classList.remove('open');
          form.reset();
          load('sent');
        } else {
          alert('No se pudo enviar el correo');
        }
      }).catch(()=>alert('Error al enviar'));
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn){
      logoutBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        if (window.Swal){
          Swal.fire({title:'Cerrar sesión', text:'¿Deseas salir?', icon:'question', showCancelButton:true, confirmButtonText:'Sí', cancelButtonText:'Cancelar'})
            .then((result)=>{
              if (result.isConfirmed){
                fetch('/api/auth/logout', {method:'POST'})
                  .finally(()=>{ window.location.href = '/login'; });
              }
            });
        } else {
          if (confirm('¿Deseas cerrar sesión?')){
            fetch('/api/auth/logout', {method:'POST'})
              .finally(()=>{ window.location.href = '/login'; });
          }
        }
      });
    }

    // precarga opciones de usuarios (para autocompletar por correo)
    fetch('/api/usuarios?fields=email,nombre').then(r=>r.ok?r.json():[]).then(list=>{
      const dl = document.getElementById('usuariosData');
      const arr = Array.isArray(list) ? list : (Array.isArray(list?.usuarios) ? list.usuarios : []);
      (arr||[]).forEach(u=>{
        const opt = document.createElement('option');
        opt.value = u.email; opt.label = u.nombre||u.email; dl.appendChild(opt);
      });
    }).catch(()=>{});

    fetchUser().then(()=>load('inbox'));
  }

  document.addEventListener('DOMContentLoaded', setup);
})();