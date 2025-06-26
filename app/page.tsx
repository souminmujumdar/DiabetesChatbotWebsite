"use client"

import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { InfoSection } from "@/components/info-section"
import { ResourcesSection } from "@/components/resources-section"
import { Footer } from "@/components/footer"
import { ChatModal } from "@/components/chatbot/chat-modal" // Corrected the import path
import { useState } from "react"
import { MessageCircle } from "lucide-react"

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      <InfoSection />
      <ResourcesSection />
      <Footer />
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg"
        aria-label="Open diabetes chatbot"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </main>
  )
}