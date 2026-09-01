# Guia de Desenvolvimento

## Requisitos

### Com Docker (recomendado)
- Docker 24+
- Docker Compose v2+

### Sem Docker
- Node.js 20+
- npm 10+

## Variáveis de ambiente

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `HF_TOKEN` | sim | Token da API do Hugging Face |
| `HF_MODEL` | sim | Modelo a usar (ex: `HuggingFaceH4/zephyr-7b-beta`) |
| `NEXT_PUBLIC_API_URL` | não | URL do backend (padrão: `http://localhost:3001`) |

> O `.env` nunca deve ser versionado. Está no `.gitignore`.

## Execução com Docker

```bash
# Subir todos os serviços (recomendado para demonstração)
docker compose up --build

# Apenas o backend
docker compose up api --build

# Em background
docker compose up --build -d

# Ver logs
docker compose logs -f

# Encerrar
docker compose down
```

Serviços disponíveis:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health

## Execução local (sem Docker)

### Backend

```bash
cd api
npm install
npm run dev    # http://localhost:3001
```

### Frontend

```bash
cd web
npm install
npm run dev    # http://localhost:3000
```

Ambos suportam hot reload.

## Testes

### Backend

```bash
cd api

# Executar testes
npm run test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Frontend

```bash
cd web

# Executar testes
npm run test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Da raiz (todos os projetos)

```bash
npm run test
npm run test:coverage
```

## Lint e formatação

```bash
# Verificar e corrigir lint
npm run lint

# Formatar código
npm run format
```

## Build

```bash
# Build completo
npm run build

# Apenas backend
cd api && npm run build

# Apenas frontend
cd web && npm run build
```

## Estrutura de testes

Cada arquivo de teste fica no mesmo diretório do arquivo que testa (co-location):

```
chat.service.ts
chat.service.spec.ts

ChatMessage.tsx
ChatMessage.spec.tsx
```

Arquivos de teste usam a extensão `.spec.ts` ou `.spec.tsx`.

## Troubleshooting

### `HF_TOKEN não está definido nas variáveis de ambiente`

Certifique-se de que o arquivo `.env` existe na raiz do projeto com `HF_TOKEN` preenchido.

### `Erro de autenticação com o serviço de IA`

O token do Hugging Face é inválido ou expirou. Gere um novo em [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).

### `Modelo não encontrado ou indisponível`

Verifique se `HF_MODEL` está correto. Alguns modelos exigem aceitar termos de uso no site do HF.

### Resposta muito lenta ou sem streaming

Modelos maiores (7B+) no Hugging Face Inference API têm latência variável. Tente um modelo menor como `microsoft/DialoGPT-medium` para testar.

### Erro de CORS no browser

Verifique se `FRONTEND_URL` no `docker-compose.yml` corresponde à origem do frontend. Em desenvolvimento local, deve ser `http://localhost:3000`.

### Docker: porta já em uso

```bash
# Verificar o que está usando a porta
lsof -i :3000
lsof -i :3001

# Parar e remover containers anteriores
docker compose down
```

### Build falha com erro de TypeScript

```bash
# Verificar erros de tipo
cd api && npx tsc --noEmit
cd web && npx tsc --noEmit
```
