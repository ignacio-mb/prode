export default function Loading() {
  return (
    <div className="space-y-3 pt-4">
      <div className="h-7 w-32 animate-pulse rounded-lg bg-secondary" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border bg-card"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
