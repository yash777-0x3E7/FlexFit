export function Badge({
  children,
  tone = "warning",
}: {
  children: React.ReactNode;
  tone?: "warning" | "danger" | "success" | "neutral";
}) {
  const styles: Record<string, React.CSSProperties> = {
    warning: { background: "#3a2a1a", color: "#fbbf24" },
    danger: { background: "#7f1d1d", color: "#fca5a5" },
    success: { background: "#064e3b", color: "#bbf7d0" },
    neutral: { background: "#212633", color: "var(--muted)" },
  };

  return (
    <span
      className="rounded px-2 py-1 text-xs font-medium"
      style={styles[tone]}
    >
      {children}
    </span>
  );
}