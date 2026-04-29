import Link from "next/link"
import { Linkedin, Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="glass border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-4">FreightSight</h3>
            <p className="text-sm text-foreground/70">Global parcel tracking with advanced logistics technology.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-primary transition-smooth">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-smooth">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-primary transition-smooth">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-smooth">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-primary transition-smooth">
                <Linkedin size={20} />
              </Link>
              <Link href="#" className="hover:text-primary transition-smooth">
                <Facebook size={20} />
              </Link>
              <Link href="#" className="hover:text-primary transition-smooth">
                <Instagram size={20} />
              </Link>
              <Link href="#" className="hover:text-primary transition-smooth">
                <Twitter size={20} />
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-foreground/60">
          <p>&copy; 2025 FreightSight Global. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
