"use client"

import { useState } from "react"
import { ArrowRight, Mail, Phone, MapPin, Globe, CheckCircle, Star, Users, Package, Shield, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function PartnersPage() {
  const [showPartnershipForm, setShowPartnershipForm] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    services: "",
    message: ""
  })

  const currentPartners = [
    { name: "DHL", color: "bg-red-500", description: "Global express delivery services", regions: "Worldwide", rating: 4.8 },
    { name: "FedEx", color: "bg-orange-500", description: "International shipping and logistics", regions: "220+ countries", rating: 4.7 },
    { name: "UPS", color: "bg-yellow-500", description: "Package delivery and supply chain", regions: "220+ countries", rating: 4.6 },
    { name: "USPS", color: "bg-blue-500", description: "United States postal services", regions: "USA & territories", rating: 4.5 },
    { name: "Aramex", color: "bg-red-600", description: "Middle East and North Africa", regions: "70+ countries", rating: 4.4 },
    { name: "Royal Mail", color: "bg-red-700", description: "UK postal and delivery services", regions: "United Kingdom", rating: 4.6 }
  ]

  const additionalPartners = [
    { name: "Canada Post", color: "bg-red-400", description: "Canada's primary postal service" },
    { name: "Australia Post", color: "bg-yellow-600", description: "Australian postal and logistics" },
    { name: "Deutsche Post", color: "bg-yellow-400", description: "German postal and DHL Group" },
    { name: "La Poste", color: "bg-yellow-500", description: "France's postal service" },
    { name: "Poste Italiane", color: "bg-red-500", description: "Italian postal services" },
    { name: "Japan Post", color: "bg-red-600", description: "Japan's national postal service" },
    { name: "China Post", color: "bg-green-600", description: "China's postal service" },
    { name: "India Post", color: "bg-orange-600", description: "India's postal service" },
    { name: "Brazil Correios", color: "bg-yellow-700", description: "Brazil's postal service" },
    { name: "South Africa Post", color: "bg-blue-600", description: "South African postal service" }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle partnership inquiry submission
    console.log("Partnership inquiry:", formData)
    // Here you would typically send this to your backend
    alert("Thank you for your partnership inquiry! We'll contact you within 24-48 hours.")
    setFormData({
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      services: "",
      message: ""
    })
    setShowPartnershipForm(false)
  }

  const handleChange = (e: any) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement
    setFormData(prev => ({
      ...prev,
      [target.name]: target.value
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Our Global <span className="text-primary">Courier Partners</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            We partner with leading logistics companies worldwide to provide seamless tracking across all major shipping networks
          </p>
        </div>
      </section>

      {/* Current Partners */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Active Partners</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentPartners.map((partner, idx) => (
              <div key={idx} className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${partner.color} text-white px-4 py-2 rounded-lg font-bold text-lg`}>
                    {partner.name}
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(partner.rating) ? 'text-yellow-400 fill-current' : 'text-muted'}`}
                      />
                    ))}
                    <span className="text-sm text-foreground/60 ml-2">{partner.rating}</span>
                  </div>
                </div>
                
                <p className="text-foreground/70 mb-4">{partner.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-foreground/60">
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <span>{partner.regions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Partners */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Expanding Network</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {additionalPartners.map((partner, idx) => (
              <div key={idx} className="glass p-4 rounded-xl text-center hover:scale-105 transition-all duration-300">
                <div className={`${partner.color} text-white px-3 py-2 rounded-lg font-bold text-sm mb-3`}>
                  {partner.name}
                </div>
                <p className="text-xs text-foreground/70">{partner.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Partner With FreightSight?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Access to 10M+ Users", description: "Connect with our growing user base" },
              { icon: Globe, title: "Global Reach", description: "Expand your service to 195+ countries" },
              { icon: Zap, title: "Advanced Technology", description: "Leverage our AI-powered platform" },
              { icon: Shield, title: "Secure Integration", description: "Enterprise-grade security and reliability" }
            ].map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{benefit.title}</h3>
                <p className="text-foreground/70">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Inquiry */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Become a Partner</h2>
            <p className="text-lg text-foreground/70">
              Join our growing network of logistics partners and expand your reach
            </p>
          </div>

          {!showPartnershipForm ? (
            <div className="glass rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Name *</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholder="your.email@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                    placeholder="https://yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Services Offered *</label>
                  <textarea
                    name="services"
                    value={formData.services}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                    placeholder="Describe your shipping and logistics services..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Additional Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                    placeholder="Tell us more about your partnership interest..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-smooth"
                  >
                    <Mail size={20} />
                    Submit Inquiry
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPartnershipForm(false)}
                    className="bg-accent hover:bg-accent/80 text-accent-foreground px-8 py-3 rounded-lg font-semibold transition-smooth"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => setShowPartnershipForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center gap-2 transition-smooth"
              >
                <Package size={24} />
                Apply for Partnership
              </button>
              <p className="text-sm text-foreground/60 mt-4">
                We'll review your application and respond within 24-48 hours
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  )
}
