// components/Chatbot.js
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'

const Chatbot = ({ 
  isMobile = false, 
  autoOpen = false,
  position = 'bottom-right',
  welcomeMessage = true 
}) => {
  // 🎯 LOAD INITIAL STATE DARI localStorage
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatbot-isOpen')
      return saved ? JSON.parse(saved) : autoOpen
    }
    return autoOpen
  })
  
  const [messages, setMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatbot-messages')
      try {
        const parsed = saved ? JSON.parse(saved) : []
        // 🎯 FIX: Convert timestamp strings back to Date objects
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      } catch (e) {
        return []
      }
    }
    return []
  })
  
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Predefined questions
  const predefinedQuestions = [
    "Jam buka perpustakaan?",
    "Dimana lokasi perpustakaan?",
    "Cara meminjam buku?",
    "Syarat jadi anggota?",
    "Kontak perpustakaan?"
  ]

  // 🎯 SAVE STATE KE localStorage SETIAP PERUBAHAN
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatbot-isOpen', JSON.stringify(isOpen))
    }
  }, [isOpen])

  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('chatbot-messages', JSON.stringify(messages))
    }
  }, [messages])

  // 🎯 AUTO FOCUS KE INPUT KETIKA CHATBOT DIBUKA
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus()
      }, 300)
    }
  }, [isOpen])

  // 🎯 FIXED POSITION STYLING - PAKAI INLINE STYLE UNTUK POSITION
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      bottom: isMobile ? '20px' : '30px',
      right: isMobile ? '20px' : '30px',
      width: isMobile ? '60px' : '70px',
      height: isMobile ? '60px' : '70px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isMobile ? '1.5rem' : '1.8rem',
      zIndex: 1000,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }

    switch (position) {
      case 'bottom-left':
        return {
          ...baseStyles,
          right: 'auto',
          left: isMobile ? '20px' : '30px'
        }
      case 'top-right':
        return {
          ...baseStyles,
          bottom: 'auto',
          top: isMobile ? '20px' : '30px'
        }
      case 'top-left':
        return {
          ...baseStyles,
          bottom: 'auto',
          right: 'auto',
          top: isMobile ? '20px' : '30px',
          left: isMobile ? '20px' : '30px'
        }
      default: // bottom-right
        return baseStyles
    }
  }

  const toggleButtonStyle = getPositionStyles()

  // 🎯 FIXED CHAT INTERFACE POSITION
  const getChatInterfaceStyle = () => {
    const baseStyle = {
      position: 'fixed',
      width: isMobile ? 'calc(100vw - 40px)' : '400px',
      height: isMobile ? '60vh' : '500px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1001,
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }

    switch (position) {
      case 'bottom-left':
        return {
          ...baseStyle,
          bottom: isMobile ? '90px' : '110px',
          right: 'auto',
          left: isMobile ? '20px' : '30px'
        }
      case 'top-right':
        return {
          ...baseStyle,
          bottom: 'auto',
          top: isMobile ? '90px' : '110px',
          right: isMobile ? '20px' : '30px'
        }
      case 'top-left':
        return {
          ...baseStyle,
          bottom: 'auto',
          right: 'auto',
          top: isMobile ? '90px' : '110px',
          left: isMobile ? '20px' : '30px'
        }
      default: // bottom-right
        return {
          ...baseStyle,
          bottom: isMobile ? '90px' : '110px',
          right: isMobile ? '20px' : '30px'
        }
    }
  }

  const chatInterfaceStyle = getChatInterfaceStyle()

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 🎯 INITIALIZE DENGAN WELCOME MESSAGE HANYA JIKA BELUM ADA MESSAGES
  useEffect(() => {
    if (isOpen && messages.length === 0 && welcomeMessage) {
      const welcomeMsg = {
        id: Date.now(),
        text: "Halo! Saya Asisten Pustakawan Koleksi Buku Langka 🤖 Silakan tanyakan tentang koleksi, layanan, atau bantuan pencarian.",
        isBot: true,
        timestamp: new Date()
      }
      setMessages([welcomeMsg])
    }
  }, [isOpen, welcomeMessage, messages.length])

  // Auto open effect
  useEffect(() => {
    if (autoOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatbot-isOpen')
      if (!saved) {
        setIsOpen(true)
      }
    }
  }, [autoOpen])

  // 🎯 CLEAR CHAT HISTORY FUNCTION
  const clearChatHistory = () => {
    setMessages([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatbot-messages')
    }
  }

  // 🎯 PROCESS USER QUERY
  const processUserQuery = async (query) => {
    setIsLoading(true)
    
    try {
      // Add user message
      const userMessage = {
        id: Date.now(),
        text: query,
        isBot: false,
        timestamp: new Date() // 🎯 PASTIKAN TIMESTAMP DATE OBJECT
      }

      setMessages(prev => [...prev, userMessage])

      console.log('Sending to API:', query);
      
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
        
        if (Array.isArray(data) && data.length > 0) {
          botResponse = data[0].text;
        } else if (data && data.text) {
          botResponse = data.text;
        } else {
          botResponse = "Maaf, saya belum bisa menjawab pertanyaan itu.";
        }
      } else {
        console.error('API Error:', response.status);
        botResponse = await generateFallbackResponse(query);
      }
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date() // 🎯 PASTIKAN TIMESTAMP DATE OBJECT
      }

      setMessages(prev => [...prev, botMessage])

    } catch (error) {
      console.error('Chatbot error:', error)
      
      const fallbackResponse = await generateFallbackResponse(query);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: fallbackResponse,
        isBot: true,
        timestamp: new Date() // 🎯 PASTIKAN TIMESTAMP DATE OBJECT
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
      return "🕐 **Jam Operasional Perpustakaan Nasional:**\n\n• Senin-Jumat: 08.00-19.00 WIB\n• Sabtu-Minggu: 09.00-16.00 WIB";
    }
    
    if (lowerQuery.includes('lokasi') || lowerQuery.includes('alamat') || lowerQuery.includes('dimana')) {
      return "📍 **Alamat Perpustakaan Nasional RI:**\n\nGedung Fasilitas Layanan Perpustakaan Nasional\nJl. Medan Merdeka Selatan No.11, Jakarta 10110";
    }
    
    if (lowerQuery.includes('pinjam') || lowerQuery.includes('buku')) {
      return "📚 **Cara Meminjam Buku:**\n\n1. **Kartu Anggota** - Pastikan sudah menjadi anggota\n2. **Pencarian** - Cari buku di katalog online/rak\n3. **Sirkulasi** - Bawa ke meja sirkulasi\n4. **Batasan** - Maksimal 5 buku\n5. **Durasi** - 2 minggu (baca di tempat)";
    }
    
    if (lowerQuery.includes('syarat') || lowerQuery.includes('anggota')) {
      return "📝 **Syarat Keanggotaan:**\n\n• KTP asli / Paspor yang masih berlaku\n• Mengisi formulir pendaftaran\n• Validasi di lantai 2\n• **Gratis** - tidak ada biaya\n• Proses: ±3 menit";
    }
    
    if (lowerQuery.includes('kontak') || lowerQuery.includes('telpon') || lowerQuery.includes('email')) {
      return "📞 **Kontak Perpustakaan Nasional:**\n\n• WhatsApp: +6285717147303\n• Email: info_pujasintara@perpusnas.go.id\n• Alamat: Jl. Medan Merdeka Selatan No.11, Jakarta";
    }
    
    return "Halo! Saya asisten Perpustakaan Nasional. Tanyakan tentang: **jam buka**, **lokasi**, **peminjaman buku**, atau **syarat keanggotaan**.";
  }

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && !isLoading) {
      processUserQuery(inputMessage.trim())
      setInputMessage('')
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Toggle chatbot
  const toggleChatbot = () => {
    setIsOpen(!isOpen)
  }

  // Handle predefined question click
  const handlePredefinedQuestion = (question) => {
    processUserQuery(question)
  }

  // 🎯 SAFE TIMESTAMP FORMATTING
  const formatTimestamp = (timestamp) => {
    try {
      // Handle both Date objects and strings
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return '--:--'
    }
  }

  return (
    <>
      {/* Chatbot Toggle Button - TANPA NOTIFIKASI ANGKA */}
      <button
        onClick={toggleChatbot}
        style={toggleButtonStyle}
        aria-label="Buka chatbot"
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)'
          e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.6)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)'
          e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)'
        }}
      >
        🤖
        {/* 🎯 HAPUS NOTIFIKASI ANGKA */}
      </button>

      {/* Chatbot Interface */}
      {isOpen && (
        <div style={chatInterfaceStyle}>
          {/* Header dengan Clear Button */}
          <div style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#48bb78',
                animation: 'pulse 2s infinite'
              }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                Asisten Pustakawan Buku Langka
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {messages.length > 1 && (
                <button
                  onClick={clearChatHistory}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    fontSize: '0.8rem'
                  }}
                  title="Bersihkan percakapan"
                  aria-label="Bersihkan percakapan"
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)'
                    e.target.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  🗑️
                </button>
              )}
              <button
                onClick={toggleChatbot}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                aria-label="Tutup chatbot"
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '1rem', // 🎯 KURANGI PADDING
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem', // 🎯 KURANGI GAP
            background: '#f8fafc'
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '100%',
                  alignItems: message.isBot ? 'flex-start' : 'flex-end'
                }}
              >
                <div style={{
                  maxWidth: '75%', // 🎯 KURANGI LEBAR MAXIMUM
                  padding: '0.75rem 1rem', // 🎯 KURANGI PADDING
                  borderRadius: '16px', // 🎯 KURANGI BORDER RADIUS
                  lineHeight: '1.4', // 🎯 KURANGI LINE HEIGHT
                  wordWrap: 'break-word',
                  boxShadow: '0 1px 8px rgba(0, 0, 0, 0.1)', // 🎯 KURANGI SHADOW
                  background: message.isBot ? 'white' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: message.isBot ? '#2d3748' : 'white',
                  borderBottomLeftRadius: message.isBot ? '4px' : '16px',
                  borderBottomRightRadius: message.isBot ? '16px' : '4px',
                  border: message.isBot ? '1px solid #e2e8f0' : 'none',
                  fontSize: '0.9rem' // 🎯 KURANGI FONT SIZE
                }}>
                  {message.isBot ? (
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  ) : (
                    message.text
                  )}
                </div>
                <div style={{
                  fontSize: '0.65rem', // 🎯 KURANGI FONT SIZE TIMESTAMP
                  color: '#718096',
                  marginTop: '0.2rem', // 🎯 KURANGI MARGIN
                  textAlign: message.isBot ? 'left' : 'right'
                }}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '100%',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  maxWidth: '75%', // 🎯 KURANGI LEBAR MAXIMUM
                  padding: '0.75rem 1rem', // 🎯 KURANGI PADDING
                  borderRadius: '16px',
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  boxShadow: '0 1px 8px rgba(0, 0, 0, 0.1)',
                  background: '#f7fafc',
                  border: '1px solid #e2e8f0',
                  borderBottomLeftRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[0, 1, 2].map((index) => (
                      <span
                        key={index}
                        style={{
                          width: '5px', // 🎯 KURANGI UKURAN DOT
                          height: '5px',
                          borderRadius: '50%',
                          background: '#667eea',
                          animation: `bounce 1.4s infinite ${index * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                    Asisten mengetik...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Predefined Questions - Hanya tampil jika messages sedikit */}
          {messages.length <= 2 && (
            <div style={{
              padding: '0.75rem', // 🎯 KURANGI PADDING
              borderTop: '1px solid #e2e8f0',
              background: 'white'
            }}>
              <div style={{
                fontSize: '0.75rem', // 🎯 KURANGI FONT SIZE
                color: '#718096',
                marginBottom: '0.5rem', // 🎯 KURANGI MARGIN
                fontWeight: '600'
              }}>
                💡 Pertanyaan cepat:
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem' // 🎯 KURANGI GAP
              }}>
                {predefinedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handlePredefinedQuestion(question)}
                    style={{
                      padding: '0.5rem 0.6rem', // 🎯 KURANGI PADDING
                      background: '#f7fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px', // 🎯 KURANGI BORDER RADIUS
                      fontSize: '0.7rem', // 🎯 KURANGI FONT SIZE
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: '#4a5568',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#edf2f7'
                      e.target.style.borderColor = '#cbd5e0'
                      e.target.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f7fafc'
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.transform = 'translateY(0)'
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
            padding: '0.75rem', // 🎯 KURANGI PADDING
            borderTop: '1px solid #e2e8f0',
            background: 'white'
          }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tanyakan tentang koleksi buku langka..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem 0.875rem', // 🎯 KURANGI PADDING
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px', // 🎯 KURANGI BORDER RADIUS
                  fontSize: '0.85rem', // 🎯 KURANGI FONT SIZE
                  outline: 'none',
                  background: 'white',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                aria-label="Pesan chatbot"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                style={{
                  width: '40px', // 🎯 KURANGI UKURAN
                  height: '40px',
                  background: !inputMessage.trim() || isLoading ? '#cbd5e0' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px', // 🎯 KURANGI BORDER RADIUS
                  cursor: !inputMessage.trim() || isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem', // 🎯 KURANGI FONT SIZE
                  fontWeight: '600'
                }}
                aria-label="Kirim pesan"
                onMouseEnter={(e) => {
                  if (inputMessage.trim() && !isLoading) {
                    e.target.style.background = '#5a6fd8'
                    e.target.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (inputMessage.trim() && !isLoading) {
                    e.target.style.background = '#667eea'
                    e.target.style.transform = 'scale(1)'
                  }
                }}
              >
                {isLoading ? '⋯' : '↑'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0); 
          }
          40% { 
            transform: scale(1); 
          }
        }
      `}</style>
    </>
  )
}

export default Chatbot