"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="glass sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">FS</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">FreightSight</span>
          </Link>

          <div className="hidden md:flex gap-8 items-center">
            <Link href="/" className="hover:text-primary transition-smooth">
              Home
            </Link>
            <Link href="/track" className="hover:text-primary transition-smooth">
              Track
            </Link>
            <Link href="/login" className="hover:text-primary transition-smooth">
              Login
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 hover:text-primary transition-smooth">
              Home
            </Link>
            <Link href="/track" className="block py-2 hover:text-primary transition-smooth">
              Track
            </Link>
            <Link href="/login" className="block py-2 hover:text-primary transition-smooth">
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
