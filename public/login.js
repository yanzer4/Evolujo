const form = document.getElementById('formLogin');
const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const statusEl = document.getElementById('status');

// Inicializar status como oculto ao carregar a página
statusEl.classList.add('hidden');

function setStatus(msg, isError = false) {
  if (!msg) {
    statusEl.textContent = '';
    statusEl.classList.add('hidden');
    statusEl.style.color = '';
    return;
  }
  
  statusEl.textContent = msg;
  statusEl.classList.remove('hidden');
  statusEl.style.color = isError ? 'crimson' : 'green';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  try {
    setStatus('Entrando...');

    const resp = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', // envia/recebe cookie de sessão na mesma origem [web:411]
      body: JSON.stringify({ username, password })
    });

    if (!resp.ok) {
      let detalhe = '';
      try {
        const err = await resp.json();
        if (err?.erro) detalhe = ` (${err.erro})`;
      } catch {}
      throw new Error(`Falha no login: HTTP ${resp.status}${detalhe}`);
    }

// se ok, volta para a tela principal
    setStatus('');  // Limpar status antes de redirecionar
    window.location.href = '/';
  } catch (err) {
    setStatus(err.message, true);
  }
});
