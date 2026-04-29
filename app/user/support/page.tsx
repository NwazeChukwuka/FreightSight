"use client"

import { useState } from "react"
import { Send } from "lucide-react"

export default function SupportPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "support",
      text: "Hello! How can we help you today?",
      timestamp: new Date(Date.now() - 3600000),
    },
  ])
  const [input, setInput] = useState("")

  const handleSendMessage = () => {
    if (!input.trim()) return

    const newMessage = {
      id: messages.length + 1,
      sender: "user",
      text: input,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setInput("")

    // Simulate support response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "support",
          text: "Thank you for your message. Our team will respond shortly.",
          timestamp: new Date(),
        },
      ])
    }, 1000)
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Live Chat Support</h1>

      <div className="glass p-8 max-w-2xl h-96 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender === "user" ? "bg-primary text-white" : "bg-white/10 text-foreground"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSendMessage}
            className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg transition-smooth"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
