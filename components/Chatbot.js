// components/Chatbot.js
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Chatbot = ({ 
  isMobile, 
  autoOpen = false,
  position = 'bottom-right',
  welcomeMessage = true 
}) => {
  const [isOpen, setIsOpen] = useState(autoOpen)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Predefined questions - DIUPDATE sesuai API
  const predefinedQuestions = [
    "Jam buka perpustakaan?",
    "Dimana lokasi perpustakaan?",
    "Cara meminjam buku?",
    "Syarat jadi anggota?",
    "Kontak perpustakaan?"
  ]

  // Position styling (SAMA)
  const getPositionStyles = () => {
    const baseStyles = {
      bottom: isMobile ? '20px' : '30px',
      right: isMobile ? '20px' : '30px'
    }

    switch (position) {
      case 'bottom-left':
        return {
          bottom: isMobile ? '20px' : '30px',
          left: isMobile ? '20px' : '30px'
        }
      case 'top-right':
        return {
          top: isMobile ? '20px' : '30px',
          right: isMobile ? '20px' : '30px'
        }
      case 'top-left':
        return {
          top: isMobile ? '20px' : '30px',
          left: isMobile ? '20px' : '30px'
        }
      default: // bottom-right
        return baseStyles
    }
  }

  const positionStyles = getPositionStyles()

  // Scroll to bottom (SAMA)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with welcome message (SAMA)
  useEffect(() => {
    if (isOpen && messages.length === 0 && welcomeMessage) {
      setMessages([
        {
          id: 1,
          text: "Halo! Saya Asisten Pustakawan Koleksi Buku Langka 🤖 Silakan tanyakan tentang koleksi, layanan, atau bantuan pencarian.",
          isBot: true,
          timestamp: new Date()
        }
      ])
    }
  }, [isOpen, welcomeMessage])

  // Auto open effect (SAMA)
  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true)
    }
  }, [autoOpen])

  // 🎯 PROCESS USER QUERY - DIUPDATE UNTUK INTEGRASI API
  const processUserQuery = async (query) => {
    setIsLoading(true)
    
    try {
      // Add user message
      const userMessage = {
        id: Date.now(),
        text: query,
        isBot: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])

      console.log('Sending to API:', query);
      
      // 🎯 KIRIM KE API ROUTE YANG SUDAH FIX
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query }),
      });

      console.log('Response status:', response.status);
      
      let botResponse = "";
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);
        
        // 🎯 AMBIL RESPONSE DARI API
        if (Array.isArray(data) && data.length > 0) {
          botResponse = data[0].text;
        } else if (data && data.text) {
          botResponse = data.text;
        } else {
          botResponse = "Maaf, saya belum bisa menjawab pertanyaan itu.";
        }
      } else {
        // Fallback jika API error
        botResponse = await generateFallbackResponse(query);
      }
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])

    } catch (error) {
      console.error('Chatbot error:', error)
      
      // Fallback response
      const fallbackResponse = await generateFallbackResponse(query);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: fallbackResponse,
        isBot: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 🎯 FALLBACK RESPONSE JIKA API ERROR
  const generateFallbackResponse = async (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Simple rule-based fallback
    if (lowerQuery.includes('jam') || lowerQuery.includes('buka')) {
      return "🕐 Perpustakaan buka:\n• Senin-Jumat: 08.00-19.00\n• Sabtu-Minggu: 09.00-16.00";
    }
    
    if (lowerQuery.includes('lokasi') || lowerQuery.includes('alamat') || lowerQuery.includes('dimana')) {
      return "📍 Gedung Perpustakaan Nasional Lantai 14\nJl. Medan Merdeka Selatan No.11, Jakarta";
    }
    
    if (lowerQuery.includes('pinjam') || lowerQuery.includes('buku')) {
      return "📚 Cara meminjam buku:\n1. Bawa kartu anggota\n2. Datang ke meja sirkulasi\n3. Maksimal 5 buku untuk 14 hari";
    }
    
    if (lowerQuery.includes('syarat') || lowerQuery.includes('anggota')) {
      return "📝 Syarat jadi anggota:\n• KTP \n• Mengisi formulir pendaftaran online";
    }
    
    if (lowerQuery.includes('kontak') || lowerQuery.includes('telpon') || lowerQuery.includes('email')) {
      return "📞 Kontak kami:\n• whatsapp : +6285717147303 \n• Email: info_pujasintara@perpusnas.go.id";
    }
    
    return "Halo! Saya asisten pustakawan layanan buku langka, Perpustakaan Nasional. Tanyakan tentang: jam buka, lokasi, peminjaman buku, atau syarat jadi anggota.";
  }

  // Handle form submit (SAMA)
  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && !isLoading) {
      processUserQuery(inputMessage.trim())
      setInputMessage('')
    }
  }

  // Toggle chatbot (SAMA)
  const toggleChatbot = () => {
    setIsOpen(!isOpen)
  }

  // Handle predefined question click (SAMA)
  const handlePredefinedQuestion = (question) => {
    processUserQuery(question)
  }

  // Get chat interface position (SAMA)
  const getChatInterfacePosition = () => {
    const baseStyle = {
      bottom: isMobile ? '90px' : '110px',
      right: isMobile ? '20px' : '30px'
    }

    switch (position) {
      case 'bottom-left':
        return {
          bottom: isMobile ? '90px' : '110px',
          left: isMobile ? '20px' : '30px'
        }
      case 'top-right':
        return {
          top: isMobile ? '90px' : '110px',
          right: isMobile ? '20px' : '30px'
        }
      case 'top-left':
        return {
          top: isMobile ? '90px' : '110px',
          left: isMobile ? '20px' : '30px'
        }
      default:
        return baseStyle
    }
  }

  const chatInterfaceStyle = getChatInterfacePosition()

  // 🎯 RENDER COMPONENT (SAMA)
  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={toggleChatbot}
        style={{
          position: 'fixed',
          ...positionStyles,
          width: isMobile ? '60px' : '70px',
          height: isMobile ? '60px' : '70px',
          borderRadius: '50%',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '1.5rem' : '1.8rem',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)'
          e.target.style.backgroundColor = '#764ba2'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)'
          e.target.style.backgroundColor = '#667eea'
        }}
      >
        🤖
      </button>

      {/* Chatbot Interface */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          ...chatInterfaceStyle,
          width: isMobile ? 'calc(100vw - 40px)' : '400px',
          height: isMobile ? '60vh' : '500px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          border: '1px solid #e2e8f0'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#667eea',
            color: 'white',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#48bb78'
              }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                Asisten Pustakawan Buku Langka
              </h3>
            </div>
            <button
              onClick={toggleChatbot}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0.2rem'
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: '#f7fafc'
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  alignSelf: message.isBot ? 'flex-start' : 'flex-end',
                  maxWidth: '85%'
                }}
              >
                <div style={{
                  backgroundColor: message.isBot ? 'white' : '#667eea',
                  color: message.isBot ? '#2d3748' : 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: message.isBot ? 
                    '12px 12px 12px 4px' : '12px 12px 4px 12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.4',
                  fontSize: '0.9rem'
                }}>
                  {message.text}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#718096',
                  marginTop: '0.25rem',
                  textAlign: message.isBot ? 'left' : 'right'
                }}>
                  {message.timestamp.toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px 12px 12px 4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.2rem'
                  }}>
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#667eea',
                          animation: `pulse 1.5s infinite ${index * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                    Asiten Pustakawan sedang mengetik...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Predefined Questions */}
          {messages.length <= 2 && (
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: 'white'
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#718096',
                marginBottom: '0.5rem',
                fontWeight: '600'
              }}>
                💡 Pertanyaan cepat:
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}>
                {predefinedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handlePredefinedQuestion(question)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#f7fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: '#4a5568'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#edf2f7'
                      e.target.style.borderColor = '#cbd5e0'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f7fafc'
                      e.target.style.borderColor = '#e2e8f0'
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} style={{
            padding: '1rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: 'white',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tanyakan tentang koleksi buku langka..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: isLoading ? '#f7fafc' : 'white'
                }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: inputMessage.trim() && !isLoading ? '#667eea' : '#cbd5e0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                {isLoading ? '⋯' : 'Kirim'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  )
}

export default Chatbot
