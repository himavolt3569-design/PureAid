export default function CampaignLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-10 py-10">
      <div className="h-[400px] w-full rounded bg-surface-container-high" />
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="h-10 w-3/4 rounded bg-surface-container-high" />
          <div className="h-6 w-1/4 rounded bg-surface-container" />
          <div className="space-y-3 pt-6">
            <div className="h-4 w-full rounded bg-surface-container" />
            <div className="h-4 w-full rounded bg-surface-container" />
            <div className="h-4 w-5/6 rounded bg-surface-container" />
          </div>
        </div>
        <div className="h-[500px] rounded bg-surface-container-high" />
      </div>
    </div>
  );
}
