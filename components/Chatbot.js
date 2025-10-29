// components/Chatbot.js
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Chatbot = ({ isMobile }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Predefined questions
  const predefinedQuestions = [
    "Bagaimana cara memesan buku langka?",
    "Apa syarat mengakses koleksi buku langka?",
    "Jam operasional layanan buku langka?",
    "Rekomendasi buku sejarah Indonesia",
    "Cara mencari naskah kuno?"
  ]

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          text: "Halo! Saya AI Pustakawan 🤖. Saya siap membantu Anda menjelajahi koleksi buku langka kami. Silakan tanyakan tentang koleksi, layanan, atau bantuan pencarian.",
          isBot: true,
          timestamp: new Date()
        }
      ])
    }
  }, [isOpen])

  // Extract search terms from query
  const extractSearchTerms = (query) => {
    const stopWords = ['cari', 'carikan', 'rekomendasi', 'buku', 'tentang', 'apa', 'ada', 'yang', 'di', 'ke']
    const words = query.toLowerCase().split(' ')
    return words.filter(word => !stopWords.includes(word) && word.length > 2).join(' ')
  }

  // Search books from database
  const searchBooks = async (searchTerm) => {
    if (!searchTerm) return []

    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`judul.ilike.%${searchTerm}%,pengarang.ilike.%${searchTerm}%,penerbit.ilike.%${searchTerm}%`)
        .limit(5)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Search books error:', error)
      return []
    }
  }

  // Generate bot response based on query
  const generateBotResponse = async (query) => {
    const lowerQuery = query.toLowerCase()

    // Service questions
    if (lowerQuery.includes('pesan') || lowerQuery.includes('memesan') || lowerQuery.includes('booking')) {
      return `Untuk memesan buku langka:\n\n1. Login ke akun Perpustakaan Nasional\n2. Kunjungi halaman "Layanan"\n3. Pilih "Pemesanan Koleksi Buku Langka"\n4. Isi formulir dengan detail buku yang diinginkan\n5. Tunggu konfirmasi via email\n\n📚 Buku akan disiapkan di ruang baca khusus.`
    }

    if (lowerQuery.includes('syarat') || lowerQuery.includes('akses') || lowerQuery.includes('persyaratan')) {
      return `Syarat mengakses koleksi buku langka:\n\n• Memiliki kartu anggota Perpustakaan Nasional\n• Mengisi formulir permohonan\n• Menunjukkan identitas asli\n• Menggunakan sarung tangan yang disediakan\n• Tidak memfotokopi (kecuali ijin khusus)\n• Hanya boleh dibaca di ruang baca khusus`
    }

    if (lowerQuery.includes('jam') || lowerQuery.includes('buka') || lowerQuery.includes('operasional')) {
      return `🕒 Jam Operasional Layanan Buku Langka:\n\nSenin - Jumat: 08.00 - 16.00 WIB\nSabtu: 09.00 - 15.00 WIB\nMinggu & Hari Libur: Tutup\n\n📍 Lokasi: Gedung Perpustakaan Nasional Lantai 7`
    }

    if (lowerQuery.includes('ruang') || lowerQuery.includes('baca') || lowerQuery.includes('khusus')) {
      return `Untuk memesan ruang baca khusus:\n\n1. Minimal 3 hari sebelumnya\n2. Maksimal 2 jam per sesi\n3. Maksimal 5 buku per sesi\n4. Tidak boleh membawa tas\n5. Hanya boleh menggunakan laptop dan alat tulis\n\n📞 Hubungi: (021) 5220100 ext. 1234`
    }

    // Search for books
    if (lowerQuery.includes('cari') || lowerQuery.includes('rekomendasi') || 
        lowerQuery.includes('buku tentang') || lowerQuery.includes('naskah')) {
      
      const searchTerms = extractSearchTerms(query)
      const bookResults = await searchBooks(searchTerms)
      
      if (bookResults.length > 0) {
        let response = `Saya menemukan ${bookResults.length} buku terkait "${searchTerms}":\n\n`
        
        bookResults.slice(0, 3).forEach((book, index) => {
          response += `${index + 1}. **${book.judul}**\n`
          response += `   👤 ${book.pengarang || 'Pengarang tidak diketahui'}\n`
          response += `   📅 ${book.tahun_terbit || 'Tahun tidak diketahui'}\n`
          response += `   📚 ${book.penerbit || 'Penerbit tidak diketahui'}\n\n`
        })

        if (bookResults.length > 3) {
          response += `...dan ${bookResults.length - 3} buku lainnya. Gunakan fitur pencarian di beranda untuk hasil lengkap!`
        }
        
        response += `\n🔍 **Tips**: Gunakan pencarian di halaman utama untuk filter yang lebih detail.`
        
        return response
      } else {
        return `Saya tidak menemukan buku yang spesifik terkait "${searchTerms}". Coba gunakan kata kunci yang lebih umum atau kunjungi halaman pencarian untuk opsi lanjutan.`
      }
    }

    // Default response
    return `Terima kasih atas pertanyaannya! 🤖\n\nSaya AI Pustakawan khusus koleksi buku langka. Saya dapat membantu Anda dengan:\n\n• Pencarian koleksi buku\n• Informasi layanan pemesanan\n• Jam operasional\n• Syarat akses\n• Rekomendasi buku\n\nSilakan tanyakan hal spesifik tentang koleksi kami!`
  }

  // Process user query
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

      // Process and get bot response
      let botResponse = await generateBotResponse(query)
      
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
      const errorMessage = {
        id: Date.now() + 1,
        text: "Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi pustakawan kami langsung.",
        isBot: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && !isLoading) {
      processUserQuery(inputMessage.trim())
      setInputMessage('')
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

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={toggleChatbot}
        style={{
          position: 'fixed',
          bottom: isMobile ? '20px' : '30px',
          right: isMobile ? '20px' : '30px',
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
          bottom: isMobile ? '90px' : '110px',
          right: isMobile ? '20px' : '30px',
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
                backgroundColor: '#48bb78',
                animation: 'pulse 2s infinite'
              }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                AI Pustakawan
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
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#667eea',
                      animation: 'pulse 1.5s infinite'
                    }} />
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#667eea',
                      animation: 'pulse 1.5s infinite 0.2s'
                    }} />
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#667eea',
                      animation: 'pulse 1.5s infinite 0.4s'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                    AI Pustakawan sedang mengetik...
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
