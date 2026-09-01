# Como o Streaming Funciona

## O que é streaming de LLM

Modelos de linguagem (LLMs) geram texto **token por token**. Um "token" é aproximadamente uma palavra ou parte de uma palavra.

Em uma resposta tradicional (sem streaming), o modelo gera todos os tokens, e só então o servidor retorna a resposta completa ao cliente. O usuário fica esperando sem feedback.

Com streaming, cada token gerado é imediatamente enviado ao cliente. O usuário vê a resposta sendo construída em tempo real — exatamente como você observa em interfaces como ChatGPT.

```
Sem streaming:          Com streaming:
                        "R"
[aguarda...]            "RA"
[aguarda...]            "RAG"
[aguarda...]     vs     "RAG é"
[aguarda...]            "RAG é uma"
"RAG é uma técnica"     "RAG é uma técnica"
```

## O que é SSE (Server-Sent Events)

SSE é um protocolo HTTP simples onde o **servidor mantém a conexão aberta** e envia dados ao cliente em formato de texto, quando quiser.

Formato do protocolo:
```
data: conteúdo do evento\n\n
```

Cada evento termina com `\n\n` (linha dupla). O campo `data:` contém o payload.

No nosso projeto, cada evento carrega um JSON:
```
data: {"type":"chunk","content":"RAG"}\n\n
data: {"type":"chunk","content":" é"}\n\n
data: {"type":"done"}\n\n
```

### Por que SSE e não WebSocket?

SSE é unidirecional (servidor → cliente), o que é exatamente o que precisamos. Vantagens sobre WebSocket neste contexto:

- Mais simples de implementar
- Usa HTTP padrão — funciona com proxies, CDNs e load balancers sem configuração extra
- Reconexão automática nativa no browser
- Não requer handshake especial

## Como o NestJS produz os eventos

### 1. HuggingFaceClient — produz tokens

```typescript
async *streamText(message, signal): AsyncGenerator<string> {
  const stream = this.client.textGenerationStream({ model, inputs: message }, { signal });
  
  for await (const response of stream) {
    if (response.token.special) continue; // ignora tokens como </s>
    yield response.token.text;            // produz um token por vez
  }
}
```

O `AsyncGenerator` é lazy — cada `yield` só executa quando o chamador pede o próximo valor.

### 2. ChatService — converte tokens em eventos SSE

```typescript
streamMessage(message, signal): Observable<SseEvent> {
  const subject = new Subject<SseEvent>();
  this.runStream(message, signal, subject);
  return subject.asObservable();
}

private async runStream(message, signal, subject) {
  for await (const token of this.huggingFaceClient.streamText(message, signal)) {
    subject.next({ type: 'chunk', content: token });  // emite chunk
  }
  subject.next({ type: 'done' });  // emite done
  subject.complete();
}
```

O `Subject` funciona como uma "ponte" entre o mundo assíncrono do `AsyncGenerator` e o mundo reativo do `Observable`.

### 3. ChatController — escreve no Response HTTP

```typescript
stream.subscribe({
  next: (event) => res.write(`data: ${JSON.stringify(event)}\n\n`),
  complete: () => res.end(),
});
```

Cada evento SSE é formatado e escrito diretamente no socket HTTP. O `res.write()` não espera — envia imediatamente.

## Como o Next.js consome os eventos

### Fluxo completo no frontend

```
fetch(POST /chat)
  → response.body (ReadableStream<Uint8Array>)
  → reader.read() em loop
  → TextDecoder → string
  → buffer acumulado
  → split("\n\n") → linhas de eventos
  → parseSseChunk() → SseEvent
  → setMessages() → re-render React
```

### Código simplificado

```typescript
const response = await fetch('/chat', { method: 'POST', body, signal });
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  
  // Eventos SSE são separados por \n\n
  const lines = buffer.split('\n\n');
  buffer = lines.pop() ?? ''; // último pode ser incompleto
  
  for (const line of lines) {
    const event = parseSseChunk(line);
    if (event?.type === 'chunk') {
      setMessages(prev => /* acumula conteúdo */);
    }
  }
}
```

### Por que não usar o `EventSource` nativo do browser?

O `EventSource` nativo só suporta GET e não permite enviar um body. Como precisamos transmitir a mensagem do usuário, usamos a `Fetch API` com `ReadableStream` diretamente.

### Buffer de linha incompleta

Uma "leitura" do stream pode chegar com conteúdo parcial. Por exemplo:

```
Leitura 1: 'data: {"type":"chunk","cont'
Leitura 2: 'ent":"RAG"}\n\ndata: {"type'
Leitura 3: '":"done"}\n\n'
```

Por isso mantemos um `buffer` e só processamos quando encontramos `\n\n` completo.

## Como o cancelamento funciona

### Frontend

```typescript
const controller = new AbortController();
const response = await fetch('/chat', { signal: controller.signal, ... });

// Quando usuário clica em "Parar":
controller.abort(); // fecha a conexão HTTP
```

### Backend

```typescript
// ChatController detecta desconexão do cliente
res.on('close', () => {
  controller.abort(); // cancela o AbortController do NestJS
});

// HuggingFaceClient recebe o signal
const stream = this.client.textGenerationStream(..., { signal });
// signal.aborted = true → HF lança AbortError

// ChatService trata como cancelamento normal (sem erro para o cliente)
if (this.isAbortError(error)) {
  subject.complete(); // completa sem emitir evento de erro
  return;
}
```

### Limitação do cancelamento

O Hugging Face pode continuar gerando tokens por um breve período após o cancelamento, pois o buffer de rede pode já ter sido preenchido. O que garantimos é que esses tokens extras não chegam ao cliente (a conexão já foi encerrada).
