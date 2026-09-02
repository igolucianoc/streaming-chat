import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '@/types/chat';

interface Props {
  message: ChatMessageType;
}

/**
 * Alguns modelos geram listas com o número/marcador numa linha e o conteúdo
 * na próxima (ex: "1.\n**Título**"). Isso une as duas linhas para produzir
 * Markdown válido ("1. **Título**") antes de passar para o ReactMarkdown.
 */
function normalizeMarkdown(text: string): string {
  return text.replace(/^(\s*\d+\.|-|\*)\s*\n+(\s*\S)/gm, '$1 $2');
}

/**
 * Renderiza uma única mensagem do chat.
 * Mensagens da IA são processadas como Markdown.
 * O cursor piscante indica que o conteúdo ainda está sendo gerado.
 */
export function ChatMessage({ message }: Props): JSX.Element {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <span className="text-xs font-medium text-gray-400 px-1">
        {isUser ? 'Você' : 'IA'}
      </span>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
              li: ({ children }) => <li className="ml-2">{children}</li>,
              code: ({ children }) => <code className="bg-gray-700 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
              pre: ({ children }) => <pre className="bg-gray-700 rounded p-3 my-2 overflow-x-auto text-xs font-mono">{children}</pre>,
            }}
          >
            {normalizeMarkdown(message.content)}
          </ReactMarkdown>
        )}
        {message.streaming && (
          <span
            aria-hidden="true"
            className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 align-middle animate-pulse"
          />
        )}
        {!message.content && message.streaming && (
          <span className="text-gray-400 italic">Pensando...</span>
        )}
      </div>
    </div>
  );
}
