# Evolujo

Aplicacao web simples para registro de pacientes e evolucoes clinicas, com autenticacao por sessao e exportacao de evolucoes em PDF.

## Funcionalidades

- Login com usuario e senha
- Cadastro e listagem de pacientes
- Remocao de paciente (com remocao das evolucoes associadas)
- Cadastro e edicao de evolucoes por paciente
- Exportacao de evolucoes em PDF

## Stack

- Backend: Node.js + Express
- Banco de dados: SQLite (`better-sqlite3`)
- Autenticacao: `express-session` + `bcrypt`
- Frontend: HTML, CSS e JavaScript vanilla

## Requisitos

- Node.js 18+ (recomendado)
- npm

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Inicie a aplicacao:

```bash
npm start
```

3. Acesse no navegador:

```text
http://localhost:3000/login.html
```

Para desenvolvimento com recarga automatica:

```bash
npm run dev
```

## Usuarios iniciais

Na primeira execucao, se a tabela `usuarios` estiver vazia, o sistema cria:

- `Joice`
- `Yan`

Senha inicial para ambos (conforme codigo atual):

- `Jobretas@98`

## Estrutura principal

```text
.
|- server.js               # API, sessao e regras de negocio
|- db.js                   # Inicializacao do SQLite e criacao de tabelas
|- evolujo.db              # Banco SQLite
|- public/
|  |- login.html           # Tela de login
|  |- login.js             # Logica de autenticacao
|  |- index.html           # Tela de pacientes
|  |- app.js               # CRUD de pacientes
|  |- evolucoes.html       # Tela de evolucoes
|  |- evolucoes.js         # CRUD de evolucoes + exportacao PDF
|  |- style.css            # Estilos da aplicacao
```

## Endpoints principais

### Autenticacao

- `POST /login`
- `POST /logout`
- `GET /me`

### Pacientes

- `GET /pacientes`
- `POST /pacientes`
- `DELETE /pacientes/:id`

### Evolucoes

- `GET /pacientes/:id/evolucoes`
- `POST /pacientes/:id/evolucoes`
- `PUT /evolucoes/:evolucaoId`

## Observacoes importantes

- O projeto utiliza uma `session secret` fixa em `server.js`. Para ambientes reais, use variavel de ambiente.
- As credenciais iniciais estao no codigo e devem ser alteradas para producao.
- O banco (`evolujo.db`) e criado automaticamente na primeira execucao.
