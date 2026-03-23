# 🩺 Evolujo

Aplicação web simples para registro de pacientes e evoluções clínicas.

> ⚠️ **Projeto experimental** desenvolvido para uso controlado em ambiente local.
> Não foi projetado para produção ou uso clínico em larga escala.

---

## 🎯 Objetivo

O Evolujo foi criado como uma solução leve para registro de atendimentos e evoluções clínicas, com foco em simplicidade e uso local.

---

## 🚀 Funcionalidades

* Login com usuário e senha
* Cadastro e listagem de pacientes
* Remoção de pacientes (com exclusão das evoluções associadas)
* Cadastro e edição de evoluções clínicas por paciente
* Exportação de evoluções em PDF

---

## 🧰 Stack

* **Backend:** Node.js + Express
* **Banco de dados:** SQLite (`better-sqlite3`)
* **Autenticação:** `express-session` + `bcrypt`
* **Frontend:** HTML, CSS e JavaScript (vanilla)

---

## 💻 Requisitos

* Node.js 18+ (recomendado)
* npm

---

## ▶️ Como rodar localmente

```bash
npm install
npm start
```

Acesse no navegador:

```
http://localhost:3000/login.html
```

Modo desenvolvimento:

```bash
npm run dev
```

---

## 👤 Usuários iniciais

Na primeira execução, se a tabela `usuarios` estiver vazia, o sistema cria automaticamente:

* `Joice`
* `Yan`

Senha inicial:

```
Jobretas@98
```

> ⚠️ Recomenda-se alterar essas credenciais imediatamente.

---

## 🗄️ Banco de dados

* O banco SQLite (`evolujo.db`) é criado automaticamente na primeira execução
* Os dados ficam armazenados localmente no diretório do projeto

> ⚠️ Não há mecanismo automático de backup

---

## 📁 Estrutura do projeto

```
.
|- server.js
|- db.js
|- evolujo.db
|- public/
   |- login.html
   |- login.js
   |- index.html
   |- app.js
   |- evolucoes.html
   |- evolucoes.js
   |- style.css
```

---

## 🔌 Endpoints principais

### Autenticação

* `POST /login`
* `POST /logout`
* `GET /me`

### Pacientes

* `GET /pacientes`
* `POST /pacientes`
* `DELETE /pacientes/:id`

### Evoluções

* `GET /pacientes/:id/evolucoes`
* `POST /pacientes/:id/evolucoes`
* `PUT /evolucoes/:evolucaoId`

---

## ⚠️ Limitações e considerações

Este projeto possui limitações importantes:

* Utiliza `session secret` fixa (não segura para produção)
* Credenciais iniciais estão no código
* Não possui controle de permissões por usuário
* Não possui criptografia de dados em repouso
* Não possui auditoria ou histórico de alterações
* Não possui mecanismos de backup automático
* Não foi testado para múltiplos usuários simultâneos

---

## 🔐 Segurança

* A autenticação é baseada em sessão (`express-session`)
* Senhas são armazenadas com hash (`bcrypt`)
* Não há proteção avançada contra ataques (CSRF, rate limit, etc.)

---

## ⚖️ Aviso importante

Este sistema:

* **Não é um prontuário eletrônico certificado**
* **Não atende requisitos formais de LGPD/HIPAA**
* **Não deve ser utilizado em ambientes clínicos críticos ou em produção**

Uso recomendado apenas para:

* testes
* uso pessoal/local
* prototipagem

---

## 📄 Licença

Defina a licença desejada (ex: MIT)

---

# 🧠 Avaliação final

Depois dessa revisão, seu projeto passa a parecer:

* ❌ Não um produto pronto
* ✅ Um projeto experimental bem documentado e consciente
