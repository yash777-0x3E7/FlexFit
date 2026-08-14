export function Loading({ label = "Loading..." }: { label?: string }) {
  return <p className="muted">{label}</p>;
}

export function ErrorBanner({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={`panel p-3 text-sm ${className}`.trim()} style={{ color: "#f87171" }}>
      {message}
    </p>
  );
}

export function SuccessBanner({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={`panel p-3 text-sm ${className}`.trim()} style={{ color: "#4ade80" }}>
      {message}
    </p>
  );
}