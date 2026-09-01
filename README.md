# Streaming Chat

Projeto de referência demonstrando **streaming real de respostas de uma LLM** do Hugging Face para um frontend Next.js através de um backend NestJS utilizando Server-Sent Events (SSE).

O efeito de "IA digitando" que você vê é gerado pelos **tokens reais chegando do modelo** — sem `setTimeout`, sem simulação.

```
Usuário:
Explique o que é RAG

IA:
R
RA
RAG
RAG é
RAG é uma
RAG é uma técnica
RAG é uma técnica utilizada...
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | NestJS 10, TypeScript, RxJS |
| LLM | Hugging Face Inference API |
| Protocolo de streaming | Server-Sent Events (SSE) |
| Validação | Zod |
| Testes | Vitest, Testing Library |
| Infraestrutura | Docker, Docker Compose |

## Arquitetura

```
┌─────────────────────┐
│      Next.js        │  :3000
│   Chat Interface    │
└──────────┬──────────┘
           │ POST /chat
           ▼
┌─────────────────────┐
│       NestJS        │  :3001
│  ChatController     │
│       ↓             │
│  ChatService        │
│       ↓             │
│  HuggingFaceClient  │
└──────────┬──────────┘
           │ textGenerationStream()
           ▼
┌─────────────────────┐
│   Hugging Face      │
│       LLM           │
└──────────┬──────────┘
           │ tokens
           ▼
┌─────────────────────┐
│    NestJS SSE       │  data: {"type":"chunk","content":"..."}
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Next.js            │
│  ReadableStream     │
│  → React state      │
└─────────────────────┘
```

## Início rápido

### Pré-requisitos

- Docker e Docker Compose instalados
- Token do Hugging Face ([criar aqui](https://huggingface.co/settings/tokens))

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/streaming-chat.git
cd streaming-chat
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`:

```env
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HF_MODEL=HuggingFaceH4/zephyr-7b-beta
```

### 3. Execute com Docker

```bash
docker compose up --build
```

Acesse: **http://localhost:3000**

## Configuração do Hugging Face

### Criar o token

1. Acesse [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Clique em **New token**
3. Selecione o tipo **Read**
4. Copie o token gerado (começa com `hf_`)

### Escolher o modelo

Defina `HF_MODEL` no `.env`. O modelo precisa suportar **text generation** (ou chat/instruct).

Modelos recomendados (gratuitos e com boa capacidade de streaming):

| Modelo | Características |
|--------|----------------|
| `HuggingFaceH4/zephyr-7b-beta` | Padrão. Bom em português. |
| `mistralai/Mistral-7B-Instruct-v0.2` | Rápido e preciso. |
| `microsoft/DialoGPT-medium` | Leve, bom para testar. |

> **Atenção:** Modelos como `meta-llama/Llama-2-7b-chat-hf` exigem aceitar os termos de uso no site do Hugging Face antes de usar via API.

## Execução local (sem Docker)

### Backend

```bash
cd api
cp ../.env.example .env  # configure HF_TOKEN e HF_MODEL
npm install
npm run dev
```

API disponível em `http://localhost:3001`

### Frontend

```bash
cd web
npm install
npm run dev
```

Frontend disponível em `http://localhost:3000`

## Testes

```bash
# Todos os testes (backend + frontend)
npm run test

# Apenas backend
cd api && npm run test

# Apenas frontend
cd web && npm run test

# Com cobertura
npm run test:coverage
```

## Lint e build

```bash
npm run lint
npm run build
```

## Estrutura do projeto

```
/
├── web/                        # Frontend Next.js
│   ├── src/
│   │   ├── app/               # App Router (layout, page)
│   │   ├── components/        # Componentes React
│   │   ├── hooks/             # useChat (lógica de streaming)
│   │   ├── lib/               # sse-parser (parsing de eventos SSE)
│   │   └── types/             # Tipos compartilhados
│   ├── Dockerfile
│   └── package.json
│
├── api/                        # Backend NestJS
│   ├── src/
│   │   ├── modules/chat/
│   │   │   ├── application/   # ChatService
│   │   │   ├── infrastructure/# HuggingFaceClient
│   │   │   ├── presentation/  # ChatController
│   │   │   └── schemas/       # Validação Zod
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
│
├── docs/                       # Documentação técnica
├── docker-compose.yml
├── .env.example
└── README.md
```

## Documentação técnica

- [Arquitetura](docs/architecture.md)
- [Como o streaming funciona](docs/streaming.md)
- [Referência da API](docs/api.md)
- [Guia de desenvolvimento](docs/development.md)

## Decisões técnicas

**Por que SSE e não WebSocket?**
SSE é suficiente para comunicação unidirecional (servidor → cliente). É mais simples de implementar, usa HTTP padrão e funciona bem com proxies e load balancers.

**Por que POST /chat com SSE manual e não `@Sse()` do NestJS?**
O decorator `@Sse()` do NestJS não aceita body em requisições POST. Como precisamos receber a mensagem do usuário, gerenciamos o SSE manualmente via Response do Express, mantendo total controle sobre o protocolo.

**Por que Vitest e não Jest?**
Vitest é nativamente compatível com ESM, tem melhor integração com o ecossistema Vite/Next.js e é significativamente mais rápido.

## Limitações

- O histórico de mensagens é mantido apenas em memória (sem persistência)
- Cada mensagem inicia uma nova geração independente (sem contexto de conversa enviado ao modelo)
- O cancelamento interrompe o processamento no NestJS, mas o Hugging Face pode continuar gerando por alguns tokens adicionais

## Próximos passos

- [ ] Passar histórico de mensagens para o modelo (contexto de conversa)
- [ ] Persistir histórico em banco de dados
- [ ] Suporte a múltiplas conversas
- [ ] Rate limiting
- [ ] Autenticação de usuários
