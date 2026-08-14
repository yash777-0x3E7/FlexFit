export function StatTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="panel panel-hover p-5 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors blur-xl" />
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
        {value}
      </div>
    </div>
  );
}

export function StatGrid({
  items,
  cols = "sm:grid-cols-3",
}: {
  items: { label: string; value: React.ReactNode }[];
  cols?: string;
}) {
  return (
    <section className={`grid gap-4 ${cols}`}>
      {items.map(({ label, value }) => (
        <StatTile key={label} label={label} value={value} />
      ))}
    </section>
  );
}