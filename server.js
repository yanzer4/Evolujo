const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const db = require('./db');

const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: 'bd72a5e2f4926c6d625312076abc1e4004c3beb09ca6607cef3f6895d421decc',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax'
  }
}));

function authRequired(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ erro: 'Não autenticado.' });
}

// --------- SEED (criar usuários se não existirem) ---------
function seedUsuariosSeNaoExistirem() {
  const row = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get();
  const count = row?.total ?? 0;
  if (count > 0) return;

  const stmt = db.prepare('INSERT INTO usuarios (username, password_hash) VALUES (?, ?)');

  const hash1 = bcrypt.hashSync('Jobretas@98', 10);
  stmt.run('Joice', hash1);

  const hash2 = bcrypt.hashSync('Jobretas@98', 10);
  stmt.run('Yan', hash2);

  console.log('Usuários criados: admin/senha123 e user/senha123 (troque depois).');
}
seedUsuariosSeNaoExistirem();

// --------- LOGIN / LOGOUT / ME ---------
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ erro: 'Informe username e password.' });
  }

  const user = db
    .prepare('SELECT id, username, password_hash FROM usuarios WHERE username = ?')
    .get(username);

  if (!user) return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });

  req.session.userId = user.id;
  req.session.username = user.username;

  return res.json({ ok: true, username: user.username });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/me', (req, res) => {
  if (!req.session?.userId) return res.json({ logado: false });
  res.json({ logado: true, username: req.session.username });
});

// --------- PACIENTES ---------
app.get('/pacientes', authRequired, (req, res) => {
  const pacientes = db.prepare(
    'SELECT id, nome, criado_em FROM pacientes ORDER BY id DESC'
  ).all();

  res.json(pacientes);
});

app.post('/pacientes', authRequired, (req, res) => {
  const { nome } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
    return res.status(400).json({ erro: 'Nome inválido.' });
  }

  const stmt = db.prepare('INSERT INTO pacientes (nome) VALUES (?)');
  const info = stmt.run(nome.trim());

  res.status(201).json({ id: info.lastInsertRowid, nome: nome.trim() });
});

app.delete('/pacientes/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  try {
    // 1) Apaga evoluções primeiro
    db.prepare('DELETE FROM evolucoes WHERE paciente_id = ?').run(id);

    // 2) Apaga paciente depois
    const info = db.prepare('DELETE FROM pacientes WHERE id = ?').run(id);

    if (info.changes === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao remover paciente' });
  }
});

// --------- EVOLUÇÕES ---------
app.get('/pacientes/:id/evolucoes', authRequired, (req, res) => {
  const pacienteId = Number(req.params.id);

  if (!Number.isInteger(pacienteId) || pacienteId <= 0) {
    return res.status(400).json({ erro: 'Paciente inválido.' });
  }

  const evolucoes = db.prepare(`
    SELECT id, paciente_id, data_atendimento, texto, criado_em, atualizado_em
    FROM evolucoes
    WHERE paciente_id = ?
    ORDER BY data_atendimento DESC, id DESC
  `).all(pacienteId);

  res.json(evolucoes);
});

app.post('/pacientes/:id/evolucoes', authRequired, (req, res) => {
  const pacienteId = Number(req.params.id);
  const { data_atendimento, texto } = req.body;

  if (!Number.isInteger(pacienteId) || pacienteId <= 0) {
    return res.status(400).json({ erro: 'Paciente inválido.' });
  }

  if (!data_atendimento || typeof data_atendimento !== 'string') {
    return res.status(400).json({ erro: 'Data do atendimento inválida.' });
  }

  if (!texto || typeof texto !== 'string' || texto.trim().length < 2) {
    return res.status(400).json({ erro: 'Texto inválido.' });
  }

  const stmt = db.prepare(`
    INSERT INTO evolucoes (paciente_id, data_atendimento, texto)
    VALUES (?, ?, ?)
  `);

  const info = stmt.run(pacienteId, data_atendimento, texto.trim());

  res.status(201).json({ id: info.lastInsertRowid });
});

app.put('/evolucoes/:evolucaoId', authRequired, (req, res) => {
  const evolucaoId = Number(req.params.evolucaoId);
  const { data_atendimento, texto } = req.body;

  if (!Number.isInteger(evolucaoId) || evolucaoId <= 0) {
    return res.status(400).json({ erro: 'Evolução inválida.' });
  }

  if (!data_atendimento || typeof data_atendimento !== 'string') {
    return res.status(400).json({ erro: 'Data do atendimento inválida.' });
  }

  if (!texto || typeof texto !== 'string' || texto.trim().length < 2) {
    return res.status(400).json({ erro: 'Texto inválido.' });
  }

  const info = db.prepare(`
    UPDATE evolucoes
    SET data_atendimento = ?, texto = ?, atualizado_em = datetime('now')
    WHERE id = ?
  `).run(data_atendimento, texto.trim(), evolucaoId);

  if (info.changes === 0) {
    return res.status(404).json({ erro: 'Evolução não encontrada.' });
  }

  res.json({ ok: true });
});

// --------- START SERVER ---------
// 0.0.0.0 = aceita conexões do celular na mesma rede
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em:`);
  console.log(`- http://localhost:${PORT}`);
});
