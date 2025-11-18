import BlinkingLogo from '../icons/BlinkingLogo';

export function LoadingMessage() {
  return (
    <article className="flex gap-3 mb-4" aria-label="AI is processing your request">
      <BlinkingLogo floating={false} size={36} />
      <span className="text-md font-montserrat leading-medium text-default-500">
        AI is thinking...
      </span>
    </article>
  );
}
