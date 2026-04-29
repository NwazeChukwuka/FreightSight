"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, History, Settings, MessageCircle, LogOut } from "lucide-react"

export function UserSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { href: "/user", label: "Dashboard", icon: LayoutDashboard },
    { href: "/user/tracking-history", label: "History", icon: History },
    { href: "/user/preferences", label: "Preferences", icon: Settings },
    { href: "/user/support", label: "Support", icon: MessageCircle },
  ]

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userRole")
    router.push("/login")
  }

  return (
    <aside className="w-64 glass border-r p-6 flex flex-col">
      <Link href="/user" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">FS</span>
        </div>
        <span className="font-bold text-lg">FreightSight</span>
      </Link>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                isActive ? "bg-primary text-white" : "hover:bg-white/10"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-smooth w-full text-left"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  )
}
