// components/Layout.js - EXTENDED VERSION
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from './Header'
import Footer from './Footer'
import Chatbot from './Chatbot'

export default function Layout({ children, isMobile }) {
  const [currentPath, setCurrentPath] = useState('')
  const [chatbotConfig, setChatbotConfig] = useState({
    enabled: true,
    autoOpen: false,
    position: 'bottom-right'
  })
  const router = useRouter()

  useEffect(() => {
    setCurrentPath(router.pathname)
    
    // Load chatbot preferences dari localStorage
    const savedChatbotPrefs = localStorage.getItem('chatbotPreferences')
    if (savedChatbotPrefs) {
      try {
        const prefs = JSON.parse(savedChatbotPrefs)
        setChatbotConfig(prev => ({ ...prev, ...prefs }))
      } catch (error) {
        console.error('Error loading chatbot preferences:', error)
      }
    }
  }, [router.pathname])

  // Konfigurasi chatbot berdasarkan halaman
  useEffect(() => {
    const pageConfig = {
      // Default configuration
      '/': { 
        enabled: true, 
        autoOpen: false,
        welcomeMessage: true
      },
      '/koleksi': { 
        enabled: true, 
        autoOpen: false,
        welcomeMessage: false
      },
      '/layanan': { 
        enabled: true, 
        autoOpen: false,
        welcomeMessage: true
      },
      '/profil': { 
        enabled: true, 
        autoOpen: false,
        welcomeMessage: true
      },
      '/kritik-saran': { 
        enabled: true, 
        autoOpen: true, // Auto open di halaman feedback
        welcomeMessage: true
      },
      '/chatbot': { 
        enabled: false, // Disable floating button di halaman chatbot khusus
        autoOpen: false
      },
      // Tambahkan halaman admin atau lainnya yang perlu disable chatbot
      '/admin': { enabled: false },
      '/login': { enabled: false }
    }

    const config = pageConfig[router.pathname] || pageConfig['/']
    setChatbotConfig(prev => ({ ...prev, ...config }))

  }, [router.pathname])

  // Simpan preferences ke localStorage ketika berubah
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatbotPreferences', JSON.stringify(chatbotConfig))
    }
  }, [chatbotConfig])

  // Function untuk toggle chatbot (bisa dipanggil dari komponen lain)
  const toggleChatbot = () => {
    setChatbotConfig(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  // Function untuk hide/show chatbot sementara
  const hideChatbotTemporarily = (duration = 30000) => { // Default 30 detik
    setChatbotConfig(prev => ({ ...prev, enabled: false }))
    setTimeout(() => {
      setChatbotConfig(prev => ({ ...prev, enabled: true }))
    }, duration)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <Header isMobile={isMobile} currentPath={currentPath} />
      
      <main style={{ 
        flex: 1,
        // Pastikan konten tidak tertutup chatbot
        paddingBottom: chatbotConfig.enabled ? (isMobile ? '80px' : '100px') : '0'
      }}>
        {children}
      </main>
      
      <Footer isMobile={isMobile} />
      
      {/* Integrasi Chatbot dengan config */}
      {chatbotConfig.enabled && (
        <Chatbot 
          isMobile={isMobile}
          autoOpen={chatbotConfig.autoOpen}
          position={chatbotConfig.position}
          welcomeMessage={chatbotConfig.welcomeMessage}
        />
      )}

      {/* Global styles untuk memastikan chatbot tidak mengganggu */}
      <style jsx global>{`
        @media (max-width: 768px) {
          /* Pastikan elemen penting tidak tertutup chatbot di mobile */
          .important-mobile-element {
            margin-bottom: 80px;
          }
        }
      `}</style>
    </div>
  )
}
