// components/Layout.js
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
    position: 'bottom-right',
    welcomeMessage: true
  })
  const router = useRouter()

  useEffect(() => {
    setCurrentPath(router.pathname)
    
    // Load chatbot preferences dari localStorage
    if (typeof window !== 'undefined') {
      const savedChatbotPrefs = localStorage.getItem('chatbotPreferences')
      if (savedChatbotPrefs) {
        try {
          const prefs = JSON.parse(savedChatbotPrefs)
          setChatbotConfig(prev => ({ ...prev, ...prefs }))
        } catch (error) {
          console.error('Error loading chatbot preferences:', error)
        }
      }
    }
  }, [router.pathname])

  // Konfigurasi chatbot berdasarkan halaman
  useEffect(() => {
    const pageConfig = {
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
        autoOpen: true,
        welcomeMessage: true
      },
      '/chatbot': { 
        enabled: false,
        autoOpen: false
      },
      '/admin': { 
        enabled: false 
      },
      '/login': { 
        enabled: false 
      }
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
    </div>
  )
}
