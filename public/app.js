const inputNome = document.getElementById('nomePaciente');
const lista = document.getElementById('listaPacientes');
const statusEl = document.getElementById('status');
const totalPacientesEl = document.getElementById('totalPacientes');

function setStatus(msg, isError = false) {
  if (!msg) {
    statusEl.textContent = '';
    statusEl.className = 'hidden';
    statusEl.style.color = '';
    return;
  }
  
  statusEl.textContent = msg;
  statusEl.className = '';
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
    lista.innerHTML = '<p class="empty-msg">Nenhum paciente cadastrado ainda.</p>';
    totalPacientesEl.textContent = 'Total: 0 paciente(s).';
    return;
  }

  pacientes.forEach(p => {
    const div = document.createElement('div');
    div.className = 'paciente-item';
    div.innerHTML = `
      <span>${p.nome}</span>
      <div style="display: flex; gap: 10px;">
        <button class="btn-detalhes" onclick="window.location.href='evolucoes.html?pacienteId=${p.id}&nome=${encodeURIComponent(p.nome)}'">Ver Evoluções</button>
        <button class="btn danger" onclick="removerPaciente(${p.id}, '${p.nome}')">Remover</button>
      </div>
    `;
    lista.appendChild(div);
  });
  
  totalPacientesEl.textContent = `Total: ${pacientes.length} paciente(s).`;
}

// Nova função conforme solicitado
function atualizarLista(pacientes) {
  renderPacientes(pacientes);
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
    setStatus(''); // Limpa status pois total agora aparece no header
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

  try {
    const resp = await fetch(`/pacientes/${id}`, { method: 'DELETE' });

    if (!resp.ok && resp.status !== 204) {
      const erro = await resp.json().catch(() => ({}));
      alert(erro.erro || 'Erro ao remover paciente');
      return;
    }
    await carregarPacientes();
  } catch (err) {
    setStatus('Erro ao remover paciente: ' + err.message, true);
  }
}

// Nova função para o botão cadastrar
async function cadastrarPaciente() {
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
}

// Ao abrir a página, carrega a lista
(async () => {
  const ok = await checarLogin();
  if (ok) await carregarPacientes();
})();