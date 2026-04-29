export function TrackingTimeline({ parcel }: any) {
  return (
    <div className="glass p-8">
      <h2 className="text-2xl font-bold mb-6">Activity Timeline</h2>

      <div className="space-y-6">
        {parcel.timeline && parcel.timeline.length > 0 ? (
          parcel.timeline.map((event: any, idx: number) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-primary" />
                {idx < parcel.timeline.length - 1 && <div className="w-1 h-12 bg-primary/30 mt-2" />}
              </div>
              <div className="pb-6">
                <p className="font-semibold">{event.status}</p>
                <p className="text-sm text-foreground/60">{event.location}</p>
                <p className="text-xs text-foreground/40 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-foreground/60">No timeline events yet</p>
        )}
      </div>
    </div>
  )
}
