"use client"
import { useState, useEffect } from "react"
import { ArrowRight, Globe, MapPin, Zap, Package, Shield, BarChart3, Clock, Users, CheckCircle, TrendingUp, Truck, Plane, Ship } from "lucide-react"
import { TrackingSearch } from "@/components/tracking-search"

export default function Home() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const features = [
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Connect to 100+ courier networks spanning 195 countries worldwide",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
      stats: "195+ Countries"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Advanced analytics dashboard with live tracking and predictive delivery times",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      stats: "99.9% Uptime"
    },
    {
      icon: Zap,
      title: "AI-Powered Updates",
      description: "Machine learning algorithms provide accurate delivery predictions and alerts",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
      stats: "5M+ Updates Daily"
    }
  ]

  const partners = [
    { name: "DHL", color: "bg-red-500" },
    { name: "FedEx", color: "bg-orange-500" },
    { name: "UPS", color: "bg-yellow-500" },
    { name: "USPS", color: "bg-blue-500" },
    { name: "Aramex", color: "bg-red-600" },
    { name: "Royal Mail", color: "bg-red-700" }
  ]

  const stats = [
    { value: "10M+", label: "Parcels Tracked", icon: Package },
    { value: "195", label: "Countries", icon: Globe },
    { value: "99.9%", label: "Accuracy", icon: CheckCircle },
    { value: "24/7", label: "Support", icon: Clock }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Hero Image Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url(https://images.unsplash.com/photo-1605699374268-825ee8a5d62c?w=1920&q=80)",
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        />
        
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        
        {/* Animated network lines on top */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 text-balance bg-gradient-to-r from-white via-primary/90 to-secondary/90 bg-clip-text text-transparent">
              Track Your Shipments
              <br />
              <span className="text-white">Globally</span>
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-12 text-balance max-w-3xl mx-auto leading-relaxed">
              FreightSight connects you to 100+ courier networks worldwide with real-time tracking, 
              AI-powered predictions, and enterprise-grade security.
            </p>
          </div>

          {/* Enhanced Tracking Search */}
          <div className="max-w-2xl mx-auto mb-16">
            <TrackingSearch />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="glass bg-white/10 backdrop-blur-md p-4 rounded-xl text-center group hover:scale-105 transition-all duration-300 border border-white/20">
                <stat.icon className="w-8 h-8 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 right-10 animate-bounce">
          <Plane className="w-8 h-8 text-primary/30" />
        </div>
        <div className="absolute bottom-20 left-10 animate-bounce delay-500">
          <Ship className="w-8 h-8 text-secondary/30" />
        </div>
        <div className="absolute top-1/2 right-20 animate-bounce delay-1000">
          <Truck className="w-8 h-8 text-primary/30" />
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Why Choose <span className="text-primary">FreightSight</span>?
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Experience the future of logistics management with our cutting-edge platform
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className={`relative group cursor-pointer transition-all duration-500 ${activeFeature === idx ? 'lg:scale-105' : ''}`}
                onClick={() => setActiveFeature(idx)}
              >
                <div className="glass rounded-2xl overflow-hidden h-full hover:shadow-2xl transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/400x200/1e293b/ffffff?text=${encodeURIComponent(feature.title)}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute top-4 right-4 bg-primary/20 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-primary">{feature.stats}</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                    </div>
                    <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Network Visualization */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Global Logistics Network
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Connecting businesses and customers across every continent
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80"
                alt="Global Logistics"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/800x400/1e293b/ffffff?text=Global+Logistics";
                }}
              />
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Real-Time Tracking</h3>
                  <p className="text-foreground/70">Monitor your shipments 24/7 with live GPS tracking and instant status updates</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Predictive Analytics</h3>
                  <p className="text-foreground/70">AI-powered delivery predictions with 99.9% accuracy rate</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Multi-Carrier Support</h3>
                  <p className="text-foreground/70">Seamless integration with 100+ global courier services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Couriers */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Leading Couriers</h2>
            <p className="text-xl text-foreground/70">Partnered with the world's most reliable shipping companies</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {partners.map((partner, idx) => (
              <div key={idx} className="glass p-6 rounded-xl flex items-center justify-center h-24 group hover:scale-105 transition-all duration-300">
                <div className={`${partner.color} text-white px-4 py-2 rounded-lg font-bold text-lg group-hover:scale-110 transition-transform`}>
                  {partner.name}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a 
              href="/partners" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-smooth"
            >
              View All Partners <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url(https://images.unsplash.com/photo-1578597561984-91d4db4c6b9f?w=1920&q=80)"
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/85" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="glass bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your
              <br />
              <span className="text-white">Shipping Experience</span>?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses and customers who trust FreightSight for reliable, 
              secure, and intelligent parcel tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/register" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-smooth"
              >
                Start Free Trial
              </a>
              <a 
                href="/demo" 
                className="bg-accent hover:bg-accent/80 text-accent-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-smooth"
              >
                Schedule Demo
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
