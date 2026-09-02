interface Props {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props): JSX.Element {
  return (
    <div
      role="alert"
      className="mx-4 my-2 flex items-start gap-3 rounded-xl bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300"
    >
      <span className="shrink-0 text-red-400" aria-hidden="true">⚠</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        type="button"
        aria-label="Fechar erro"
        className="shrink-0 text-red-400 hover:text-red-200 transition-colors focus:outline-none"
      >
        ✕
      </button>
    </div>
  );
}
