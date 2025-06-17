# ☁️ CloudGatekeeper

**Automatize a concessão de permissões em ambientes Cloud com IA + Aprovação humana.**  
Um assistente inteligente que interpreta solicitações de acesso, gera scripts de permissão com segurança e exige validação antes da execução.

---

## 🚀 Visão Geral

CloudGatekeeper é um bot integrado ao Slack que permite que desenvolvedores solicitem acesso a projetos e recursos em nuvem de forma segura. A IA interpreta o pedido e gera um script de permissão (como `gcloud`, `aws cli`, etc.), que é enviado para revisão de um engenheiro Cloud antes de ser executado.

---

## 📦 Funcionalidades

- 🤖 Interpretação de linguagem natural com IA (OpenAI GPT-4o)
- 🧠 Geração automática de scripts de permissão (IAM)
- ✅ Fluxo de aprovação via bot do Slack
- 🔐 Execução segura e rastreável de comandos
- 🗃️ Registro completo de logs e auditoria

---

## 🧱 Arquitetura

```text
Usuário (Slack)
   ↓
Mensagem de solicitação de acesso
   ↓
Bot Node.js (Express + Bolt SDK)
   ↓
OpenAI → Geração do script
   ↓
Aprovação do engenheiro Cloud (Slack)
   ↓
Execução segura via shell (opcional)
   ↓
Registro no banco (MongoDB/PostgreSQL)
````

---

## ⚙️ Tecnologias

* Node.js + Express
* Slack SDK (Bolt)
* OpenAI GPT-4o
* ShellJS
* MongoDB ou PostgreSQL (opcional para persistência)

---

## 📥 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/cloud-gatekeeper.git
cd cloud-gatekeeper
```

### 2. Instale as dependências

```bash
pnpm install
```

> Você pode usar `npm` ou `yarn` se preferir.

### 3. Crie o arquivo `.env`

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
OPENAI_API_KEY=sk-...
```

---

## ▶️ Execução

```bash
pnpm start
```

O bot escutará por mensagens no Slack com palavras-chave como `acesso`, `role`, `permissão`, etc.

---

## 🧪 Exemplo de uso

**Usuário:**

> "Preciso de acesso ao projeto `my-data-platform` com a role de `editor`"

**Bot responde:**

```bash
gcloud projects add-iam-policy-binding my-data-platform \
  --member="user:email@example.com" \
  --role="roles/editor"
```

*Aprovar ou Rejeitar?*

---

## 🔐 Segurança

* Nenhum script é executado automaticamente.
* O engenheiro Cloud **deve aprovar** cada solicitação manualmente.
* Permissões, logs e aprovações podem ser salvos para auditoria.

---

## 📚 Roadmap futuro

* [ ] Adicionar suporte a AWS, Azure
* [ ] Criação de PR automático com scripts (integração GitHub)
* [ ] Sistema de expiração de permissões
* [ ] Dashboard de permissões ativas
* [ ] Regras personalizadas de roles e projetos

---

## 👨‍💻 Autor

Desenvolvido por [Matthew Araújo](https://github.com/MatthewAraujo)
Idealizado como solução prática para times DevOps que lidam com múltiplos pedidos de acesso por dia.

---
