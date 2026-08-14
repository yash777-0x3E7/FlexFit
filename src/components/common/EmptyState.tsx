export function EmptyState({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={`muted text-sm ${className}`.trim()}>{message}</p>
  );
}