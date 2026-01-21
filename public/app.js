const form = document.getElementById('formPaciente');
const inputNome = document.getElementById('nomePaciente');
const lista = document.getElementById('listaPacientes');
const statusEl = document.getElementById('status');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? 'crimson' : 'green';
}

const btnLogout = document.getElementById('btnLogout');

btnLogout.addEventListener('click', async () => {
  await fetch('/logout', {
    method: 'POST',
    credentials: 'same-origin'
  }); // envia cookie de sessão [web:411]

  window.location.href = '/login.html';
});

function renderPacientes(pacientes) {
  lista.innerHTML = '';

  if (!pacientes || pacientes.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Nenhum paciente cadastrado ainda.';
    lista.appendChild(li);
    return;
  }

  for (const p of pacientes) {
    const li = document.createElement('li');
    li.className = 'list-item clickable';

    const row = document.createElement('div');
    row.className = 'row';

    const nome = document.createElement('span');
    nome.textContent = p.nome; // ou `${p.id} - ${p.nome}`
    nome.style.fontSize = '18px';
    nome.style.fontWeight = '700';

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'btn danger';
    btnRemover.textContent = 'Remover';

    btnRemover.addEventListener('click', (e) => {
      e.stopPropagation();
      removerPaciente(p.id, p.nome);
    });

    li.addEventListener('click', () => {
      window.location.href =
        `evolucoes.html?pacienteId=${p.id}&nome=${encodeURIComponent(p.nome)}`;
    });

    row.appendChild(nome);
    row.appendChild(btnRemover);
    li.appendChild(row);
    lista.appendChild(li);
  }
}


async function checarLogin() {
  const resp = await fetch('/me', { credentials: 'same-origin' });
  const data = await resp.json();

  if (!data.logado) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

async function carregarPacientes() {
  try {
    setStatus('Carregando pacientes...');
    const resp = await fetch('/pacientes');
    if (resp.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    if (!resp.ok) throw new Error(`Erro ao listar: HTTP ${resp.status}`);
    const pacientes = await resp.json();
    renderPacientes(pacientes);
    setStatus(`Total: ${pacientes.length} paciente(s).`);
  } catch (err) {
    setStatus(err.message, true);
  }
  
}


async function criarPaciente(nome) {
  const resp = await fetch('/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome }) // envia JSON [web:222]
  });

  if (!resp.ok) {
    // tenta extrair { erro: "..." } da API
    let detalhe = '';
    try {
      const err = await resp.json();
      if (err?.erro) detalhe = ` (${err.erro})`;
    } catch {}
    throw new Error(`Erro ao cadastrar: HTTP ${resp.status}${detalhe}`);
  }

  return await resp.json();
}

async function removerPaciente(id, nome) {
  const ok = confirm(`Remover o paciente "${nome}"?`);
  if (!ok) return;

  const resp = await fetch(`/pacientes/${id}`, { method: 'DELETE' });

  if (!resp.ok && resp.status !== 204) {
    const erro = await resp.json().catch(() => ({}));
    alert(erro.erro || 'Erro ao remover paciente');
    return;
  }
  carregarPacientes(); // sua função que recarrega a lista
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = inputNome.value.trim();
  if (nome.length < 2) {
    setStatus('Digite um nome válido (mínimo 2 letras).', true);
    return;
  }

  try {
    setStatus('Salvando...');
    await criarPaciente(nome);
    inputNome.value = '';
    inputNome.focus();
    await carregarPacientes();
  } catch (err) {
    setStatus(err.message, true);
  }
});

// Ao abrir a página, carrega a lista
(async () => {
  const ok = await checarLogin();
  if (ok) await carregarPacientes();
})();