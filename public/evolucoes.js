const params = new URLSearchParams(window.location.search);
const pacienteId = Number(params.get('pacienteId'));
const nomePaciente = params.get('nome') || '';

const titulo = document.getElementById('titulo');
const form = document.getElementById('formEvolucao');
const inputData = document.getElementById('dataAtendimento');
const inputTexto = document.getElementById('textoEvolucao');
const statusEl = document.getElementById('status');
const lista = document.getElementById('listaEvolucoes');

const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelarEdicao');
const btnExportarPDF = document.getElementById('btnExportarPDF');
const chkDataImpressao = document.getElementById('chkDataImpressao');


let evolucaoEditandoId = null;
let evolucoesCache = [];

/* =========================
   Utils
   ========================= */
function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? 'crimson' : 'green';
}

function formatarDataBr(iso) {
  if (!iso) return '';
  const [yyyy, mm, dd] = String(iso).split('-');
  if (!yyyy || !mm || !dd) return iso;
  return `${dd}/${mm}/${yyyy}`;
}

function limparNomeArquivo(s) {
  return String(s || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_');
}

function garantirJsPdf() {
  const ok = window.jspdf && window.jspdf.jsPDF;
  if (!ok) {
    setStatus('jsPDF não carregou. Confira o <script> no HTML.', true);
    return false;
  }
  return true;
}

/* =========================
   PDF (somente jsPDF)
   ========================= */
function criarDocPdf(tituloPdf) {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 12;
  const topY = 14;
  const bottomMargin = 12;
  const contentWidth = pageWidth - marginX * 2;

  // Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(String(tituloPdf), pageWidth / 2, topY, { align: 'center' });

  // Data de impressão (opcional)
  let y = topY + 10;

  const imprimirData = !!(chkDataImpressao && chkDataImpressao.checked);
  if (imprimirData) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      `Data de impressão: ${new Date().toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      topY + 6,
      { align: 'center' }
    );
    y = topY + 14;
  }

  return { doc, pageWidth, pageHeight, marginX, bottomMargin, contentWidth, y, topY };
}


function novaPagina(ctx, repetirCabecalho = false, tituloPdf = '') {
  ctx.doc.addPage();
  ctx.y = ctx.topY;

  if (repetirCabecalho) {
    const pageWidth = ctx.pageWidth;

    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(12);
    ctx.doc.text(String(tituloPdf), pageWidth / 2, ctx.y, { align: 'center' });

    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(9);
    ctx.doc.text(`(continuação)`, pageWidth / 2, ctx.y + 5, { align: 'center' });

    ctx.y += 12;
  } else {
    ctx.y += 6;
  }
}

function garantirEspaco(ctx, alturaMm, tituloPdf) {
  if (ctx.y + alturaMm <= (ctx.pageHeight - ctx.bottomMargin)) return;
  novaPagina(ctx, true, tituloPdf);
}

function escreverParagrafoQuebrado(ctx, texto, fontSize, lineHeightMm, tituloPdf) {
  const doc = ctx.doc;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);

  // splitTextToSize quebra o texto no tamanho do conteúdo (mm). [web:1173]
  const linhas = doc.splitTextToSize(String(texto || ''), ctx.contentWidth);

  for (const linha of linhas) {
    garantirEspaco(ctx, lineHeightMm, tituloPdf);
    doc.text(linha, ctx.marginX, ctx.y);
    ctx.y += lineHeightMm;
  }
}

function desenharLinhaSeparadora(ctx, tituloPdf) {
  garantirEspaco(ctx, 6, tituloPdf);
  ctx.doc.setDrawColor(220);
  ctx.doc.line(ctx.marginX, ctx.y, ctx.pageWidth - ctx.marginX, ctx.y);
  ctx.y += 6;
}

function escreverEvolucaoNoPdf(ctx, evo, tituloPdf) {
  // Data
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(12);

  const data = formatarDataBr(evo.data_atendimento || '');
  garantirEspaco(ctx, 8, tituloPdf);
  ctx.doc.text(data || '(sem data)', ctx.marginX, ctx.y);
  ctx.y += 6;

  // Texto
  escreverParagrafoQuebrado(ctx, (evo.texto || '').trim() || '(sem texto)', 11, 5, tituloPdf);

  // Separador
  desenharLinhaSeparadora(ctx, tituloPdf);
}

function exportarPdfEvolucoes(evolucoes, nomeArquivo, tituloPdf) {
  if (!garantirJsPdf()) return;

  const ctx = criarDocPdf(tituloPdf);

  // ordena por data (opcional)
  const ordenadas = [...evolucoes].sort((a, b) =>
    String(a.data_atendimento || '').localeCompare(String(b.data_atendimento || ''))
  );

  for (const evo of ordenadas) {
    escreverEvolucaoNoPdf(ctx, evo, tituloPdf);
  }

  ctx.doc.save(nomeArquivo);
}

/* =========================
   Botões PDF
   ========================= */
btnExportarPDF.addEventListener('click', () => {
  if (!evolucoesCache || evolucoesCache.length === 0) {
    setStatus('Nenhuma evolução para exportar.', true);
    return;
  }

  const tituloPdf = titulo.textContent || `Evoluções — Paciente ${pacienteId}`;
  const nomeArq = `${limparNomeArquivo(tituloPdf)}.pdf`;

  try {
    setStatus('Gerando PDF com todas as evoluções...');
    exportarPdfEvolucoes(evolucoesCache, nomeArq, tituloPdf);
    setStatus(`PDF exportado: ${nomeArq}`);
  } catch (e) {
    console.error(e);
    setStatus('Erro ao gerar PDF. Veja o Console (F12).', true);
  }
});

function exportarPdfEvolucaoIndividual(e) {
  const tituloPdf = titulo.textContent || `Evoluções — Paciente ${pacienteId}`;

  const basePaciente = limparNomeArquivo(nomePaciente || `paciente_${pacienteId}`);
  const baseData = limparNomeArquivo(e.data_atendimento || 'sem-data');
  const baseId = limparNomeArquivo(e.id || 'sem-id');
  const nomeArq = `Evolucao_${basePaciente}_${baseData}_${baseId}.pdf`;

  try {
    setStatus('Gerando PDF individual...');
    exportarPdfEvolucoes([e], nomeArq, tituloPdf);
    setStatus(`PDF exportado: ${nomeArq}`);
  } catch (err) {
    console.error(err);
    setStatus('Erro ao gerar PDF individual. Veja o Console (F12).', true);
  }
}

/* =========================
   Validações e modo edição
   ========================= */
function validarPacienteId() {
  if (!Number.isInteger(pacienteId) || pacienteId <= 0) {
    setStatus('Paciente inválido. Volte e selecione um paciente.', true);
    form.querySelectorAll('input, textarea, button').forEach(el => (el.disabled = true));
    return false;
  }
  return true;
}

function limparFormulario() {
  evolucaoEditandoId = null;
  btnSalvar.textContent = 'Salvar evolução';
  btnCancelar.style.display = 'none';
  inputTexto.value = '';
  inputData.value = new Date().toISOString().slice(0, 10);
}

function entrarModoEdicao(e) {
  evolucaoEditandoId = e.id;
  inputData.value = e.data_atendimento;
  inputTexto.value = e.texto;

  btnSalvar.textContent = 'Salvar edição';
  btnCancelar.style.display = 'inline-block';
  inputTexto.focus();
}

/* =========================
   API
   ========================= */
async function checarLogin() {
  const resp = await fetch('/me', { credentials: 'same-origin' });
  const data = await resp.json();

  if (!data.logado) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

async function listarEvolucoes() {
  const resp = await fetch(`/pacientes/${pacienteId}/evolucoes`);
  if (resp.status === 401) {
    window.location.href = '/login.html';
    return;
  }
  if (!resp.ok) throw new Error(`Erro ao listar evoluções: HTTP ${resp.status}`);
  return await resp.json();
}

async function criarEvolucao(data_atendimento, texto) {
  const resp = await fetch(`/pacientes/${pacienteId}/evolucoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data_atendimento, texto })
  });

  if (!resp.ok) {
    let detalhe = '';
    try {
      const err = await resp.json();
      if (err?.erro) detalhe = ` (${err.erro})`;
    } catch {}
    throw new Error(`Erro ao criar evolução: HTTP ${resp.status}${detalhe}`);
  }

  return await resp.json();
}

async function editarEvolucao(evolucaoId, data_atendimento, texto) {
  const resp = await fetch(`/evolucoes/${evolucaoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data_atendimento, texto })
  });

  if (!resp.ok) {
    let detalhe = '';
    try {
      const err = await resp.json();
      if (err?.erro) detalhe = ` (${err.erro})`;
    } catch {}
    throw new Error(`Erro ao editar evolução: HTTP ${resp.status}${detalhe}`);
  }

  return await resp.json();
}

/* =========================
   Render
   ========================= */
function renderEvolucoes(evolucoes) {
  lista.innerHTML = '';

  if (!Array.isArray(evolucoes) || evolucoes.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Nenhuma evolução cadastrada ainda.';
    lista.appendChild(li);
    return;
  }

  for (const e of evolucoes) {
    const li = document.createElement('li');
    li.className = 'list-item';

    const header = document.createElement('div');
    header.className = 'evo-data';
    header.textContent = formatarDataBr(e.data_atendimento);

    const texto = document.createElement('div');
    texto.className = 'evo-texto';
    texto.textContent = e.texto || '';

    const actions = document.createElement('div');
    actions.className = 'evo-actions';

    const btnEditarItem = document.createElement('button');
    btnEditarItem.type = 'button';
    btnEditarItem.className = 'btn secondary';
    btnEditarItem.textContent = 'Editar';
    btnEditarItem.addEventListener('click', () => entrarModoEdicao(e));

    const btnPdfItem = document.createElement('button');
    btnPdfItem.type = 'button';
    btnPdfItem.className = 'btn info';
    btnPdfItem.textContent = '📄 PDF';
    btnPdfItem.addEventListener('click', () => exportarPdfEvolucaoIndividual(e));

    actions.appendChild(btnEditarItem);
    actions.appendChild(btnPdfItem);

    li.appendChild(header);
    li.appendChild(texto);
    li.appendChild(actions);

    lista.appendChild(li);
  }
}

/* =========================
   Carregar / eventos
   ========================= */
async function carregarTela() {
  if (!validarPacienteId()) return;

  titulo.textContent = nomePaciente
    ? `Evoluções — ${nomePaciente}`
    : `Evoluções — Paciente ${pacienteId}`;

  try {
    setStatus('Carregando histórico...');
    const evolucoes = await listarEvolucoes();
    evolucoesCache = Array.isArray(evolucoes) ? evolucoes : [];
    renderEvolucoes(evolucoesCache);
    setStatus(`Total: ${evolucoesCache.length} evolução(ões).`);
  } catch (err) {
    setStatus(err.message, true);
  }
}

btnCancelar.addEventListener('click', () => {
  limparFormulario();
  setStatus('Edição cancelada.');
});

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (!validarPacienteId()) return;

  const data_atendimento = inputData.value;
  const texto = inputTexto.value.trim();

  if (!data_atendimento) {
    setStatus('Selecione uma data válida.', true);
    return;
  }
  if (texto.length < 2) {
    setStatus('Digite um texto válido (mínimo 2 letras).', true);
    return;
  }

  try {
    if (evolucaoEditandoId) {
      setStatus('Salvando edição...');
      await editarEvolucao(evolucaoEditandoId, data_atendimento, texto);
      setStatus('Edição salva.');
    } else {
      setStatus('Salvando evolução...');
      await criarEvolucao(data_atendimento, texto);
      setStatus('Evolução criada.');
    }

    limparFormulario();
    await carregarTela();
  } catch (err) {
    setStatus(err.message, true);
  }
});

(async () => {
  const ok = await checarLogin();
  if (!ok) return;

  limparFormulario();
  await carregarTela();
})();