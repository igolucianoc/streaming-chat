# Referência da API

Base URL: `http://localhost:3001`

---

## GET /health

Verifica se o serviço está disponível.

**Response `200 OK`**

```json
{
  "status": "ok"
}
```

---

## POST /chat

Inicia a geração de texto em streaming. Retorna uma resposta SSE (Server-Sent Events).

**Request**

```http
POST /chat
Content-Type: application/json
```

```json
{
  "message": "Explique o que é RAG"
}
```

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `message` | string | sim | Mínimo 1 caractere, máximo 4000 caracteres. Espaços no início/fim são removidos (trim). |

**Response headers**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**Protocolo SSE**

A resposta é uma sequência de eventos no formato:

```
data: <json>\n\n
```

---

### Evento: chunk

Enviado para cada token gerado pelo modelo.

```
data: {"type":"chunk","content":"RAG"}

data: {"type":"chunk","content":" é"}

data: {"type":"chunk","content":" uma"}

data: {"type":"chunk","content":" técnica"}
```

**Schema**

```typescript
{
  type: "chunk";
  content: string; // token gerado pelo modelo
}
```

---

### Evento: done

Enviado quando a geração é concluída com sucesso.

```
data: {"type":"done"}
```

**Schema**

```typescript
{
  type: "done";
}
```

Após este evento, a conexão SSE é encerrada.

---

### Evento: error

Enviado quando ocorre um erro durante a geração.

```
data: {"type":"error","message":"O serviço de IA está temporariamente indisponível."}
```

**Schema**

```typescript
{
  type: "error";
  message: string; // mensagem segura para o usuário
}
```

Após este evento, a conexão SSE é encerrada.

---

## Erros HTTP

Erros na validação da requisição retornam uma resposta HTTP antes de iniciar o SSE.

**`400 Bad Request` — Mensagem inválida**

```json
{
  "statusCode": 400,
  "message": "A mensagem não pode ser vazia.",
  "error": "Bad Request"
}
```

Possíveis mensagens de validação:
- `"A mensagem não pode ser vazia."` — campo vazio ou só espaços
- `"A mensagem não pode ultrapassar 4000 caracteres."` — limite excedido

---

## Erros SSE (via evento error)

Estes erros ocorrem durante o streaming e são enviados como eventos SSE:

| Situação | Mensagem enviada ao cliente |
|----------|---------------------------|
| Token inválido / sem autorização | `"Erro de autenticação com o serviço de IA."` |
| Modelo não encontrado | `"Modelo não encontrado ou indisponível."` |
| Timeout | `"Tempo de resposta esgotado. Tente novamente."` |
| Serviço indisponível (503) | `"O serviço de IA está temporariamente indisponível."` |
| Erro desconhecido | `"Não foi possível processar a solicitação."` |

> Os erros internos (stack trace, token HF, detalhes do modelo) **nunca** são expostos ao cliente.

---

## Exemplo completo de sessão SSE

Pergunta: `"Explique RAG em uma frase"`

```
POST /chat HTTP/1.1
Content-Type: application/json

{"message":"Explique RAG em uma frase"}

---

HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"chunk","content":"RAG"}

data: {"type":"chunk","content":" (Retrieval"}

data: {"type":"chunk","content":"-Augmented"}

data: {"type":"chunk","content":" Generation"}

data: {"type":"chunk","content":" )"}

data: {"type":"chunk","content":" é"}

data: {"type":"chunk","content":" uma"}

data: {"type":"chunk","content":" técnica"}

data: {"type":"done"}
```

---

## Cancelamento

O cliente pode cancelar o stream a qualquer momento fechando a conexão HTTP (via `AbortController.abort()` no browser). O backend detecta a desconexão via o evento `close` do Express e interrompe o processamento.
