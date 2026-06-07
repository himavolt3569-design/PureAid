export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-10 animate-pulse">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="h-4 w-48 rounded bg-surface-container-high" />
          <div className="h-10 w-64 rounded bg-surface-container-high" />
          <div className="h-6 w-96 rounded bg-surface-container" />
        </div>
        <div className="h-12 w-64 rounded bg-surface-container-high" />
      </div>

      <div className="flex gap-2 border-b border-surface-container">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 w-32 rounded-t bg-surface-container-high" />
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded bg-surface-container-high p-6" />
        ))}
      </div>
      
      <div className="h-[400px] rounded bg-surface-container-high" />
    </div>
  );
}
