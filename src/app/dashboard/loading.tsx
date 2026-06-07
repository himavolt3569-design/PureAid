export default function DashboardLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <div className="h-4 w-32 rounded bg-surface-container-high" />
          <div className="h-10 w-64 rounded bg-surface-container-high" />
          <div className="h-4 w-96 rounded bg-surface-container" />
        </div>
        <div className="h-14 w-40 rounded bg-surface-container-high" />
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded bg-surface-container-high p-6" />
        ))}
      </div>
      
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 h-96 rounded bg-surface-container-high p-6" />
        <div className="lg:col-span-5 h-96 rounded bg-surface-container-high p-6" />
      </div>
    </div>
  );
}
