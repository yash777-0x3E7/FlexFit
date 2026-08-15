export function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="space-y-4 w-full">
      <div className="skeleton h-8 w-1/3"></div>
      <div className="skeleton h-32 w-full"></div>
      <div className="skeleton h-32 w-full"></div>
      <p className="muted text-sm text-center">{label}</p>
    </div>
  );
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