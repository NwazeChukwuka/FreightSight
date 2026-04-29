import type { LucideIcon } from "lucide-react"

interface AdminCardProps {
  icon: LucideIcon
  title: string
  value: string | number
  color: string
}

export function AdminCard({ icon: Icon, title, value, color }: AdminCardProps) {
  return (
    <div className="glass p-6 hover:bg-white/15 transition-smooth">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-foreground/60 mb-2">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  )
}
