export function TrackingDetails({ parcel }: any) {
  return (
    <div className="glass p-8">
      <h2 className="text-2xl font-bold mb-6">Parcel Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-foreground/60 mb-1">Tracking ID</p>
          <p className="text-lg font-semibold">{parcel.trackingId}</p>
        </div>

        <div>
          <p className="text-sm text-foreground/60 mb-1">Courier</p>
          <p className="text-lg font-semibold">{parcel.courier}</p>
        </div>

        <div>
          <p className="text-sm text-foreground/60 mb-1">Current Status</p>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                parcel.status === "Delivered"
                  ? "bg-green-500"
                  : parcel.status === "Delayed"
                    ? "bg-destructive"
                    : "bg-primary"
              }`}
            />
            <p className="text-lg font-semibold">{parcel.status}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-foreground/60 mb-1">Estimated Delivery</p>
          <p className="text-lg font-semibold">
            {parcel.estimatedDelivery ? new Date(parcel.estimatedDelivery).toLocaleDateString() : "N/A"}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-foreground/60 mb-1">Origin</p>
          <p className="text-lg font-semibold">
            {parcel.sender?.city}, {parcel.sender?.country}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-foreground/60 mb-1">Destination</p>
          <p className="text-lg font-semibold">
            {parcel.receiver?.city}, {parcel.receiver?.country}
          </p>
        </div>
      </div>
    </div>
  )
}
