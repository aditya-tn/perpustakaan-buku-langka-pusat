// pages/chatbot.js
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

export default function ChatbotPage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on mount
    checkMobile()
    
    // Add event listener
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>AI Pustakawan - Layanan Buku Langka</title>
        <meta name="description" content="Chat dengan AI Pustakawan untuk bantuan koleksi buku langka" />
      </Head>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '3rem 1rem' : '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto' 
        }}>
          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            fontWeight: '800',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            AI Pustakawan 🤖
          </h1>
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            opacity: 0.9,
            lineHeight: '1.6',
            marginBottom: '0'
          }}>
            Asisten virtual kami siap membantu Anda menjelajahi koleksi buku langka, 
            memberikan informasi layanan, dan membantu pencarian literatur langka.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section style={{
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: isMobile ? '1rem' : '2rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '3rem',
          alignItems: 'start'
        }}>
          
          {/* Left Column - Information */}
          <div>
            <h2 style={{ 
              color: '#2d3748', 
              marginBottom: '1.5rem',
              fontSize: isMobile ? '1.5rem' : '1.75rem'
            }}>
              Yang Dapat AI Pustakawan Bantu
            </h2>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.5rem' 
            }}>
              {/* Feature 1 */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ 
                  color: '#667eea', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1.1rem'
                }}>
                  <span>🔍</span>
                  Pencarian Koleksi
                </h3>
                <p style={{ 
                  color: '#4a5568', 
                  lineHeight: '1.6',
                  margin: '0',
                  fontSize: '0.95rem'
                }}>
                  Cari buku berdasarkan judul, pengarang, tahun terbit, atau topik spesifik. 
                  AI akan membantu menemukan literatur yang relevan dengan kebutuhan Anda.
                </p>
              </div>

              {/* Feature 2 */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ 
                  color: '#667eea', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1.1rem'
                }}>
                  <span>📋</span>
                  Informasi Layanan
                </h3>
                <p style={{ 
                  color: '#4a5568', 
                  lineHeight: '1.6',
                  margin: '0',
                  fontSize: '0.95rem'
                }}>
                  Panduan lengkap pemesanan buku, syarat akses, jam operasional, 
                  dan prosedur penggunaan layanan buku langka.
                </p>
              </div>

              {/* Feature 3 */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ 
                  color: '#667eea', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1.1rem'
                }}>
                  <span>💡</span>
                  Rekomendasi & Bimbingan
                </h3>
                <p style={{ 
                  color: '#4a5568', 
                  lineHeight: '1.6',
                  margin: '0',
                  fontSize: '0.95rem'
                }}>
                  Dapatkan rekomendasi buku berdasarkan minat dan topik penelitian Anda, 
                  serta bimbingan dalam menelusuri koleksi langka.
                </p>
              </div>

              {/* Feature 4 */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ 
                  color: '#667eea', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1.1rem'
                }}>
                  <span>🕒</span>
                  Bantuan 24/7
                </h3>
                <p style={{ 
                  color: '#4a5568', 
                  lineHeight: '1.6',
                  margin: '0',
                  fontSize: '0.95rem'
                }}>
                  Tanyakan kapan saja tentang koleksi kami. AI Pustakawan tersedia 
                  24/7 untuk membantu pertanyaan dasar dan pencarian awal.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Chatbot Info */}
          <div style={{
            position: isMobile ? 'relative' : 'sticky',
            top: isMobile ? 'auto' : '2rem'
          }}>
            {/* Chatbot Placeholder */}
            <div style={{
              height: isMobile ? '400px' : '500px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              backgroundColor: '#f7fafc'
            }}>
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#718096',
                textAlign: 'center',
                padding: '2rem'
              }}>
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1rem',
                  opacity: 0.7
                }}>
                  🤖
                </div>
                <h3 style={{ 
                  color: '#4a5568', 
                  marginBottom: '1rem',
                  fontSize: '1.5rem'
                }}>
                  AI Pustakawan
                </h3>
                <p style={{
                  lineHeight: '1.6',
                  marginBottom: '2rem',
                  maxWidth: '300px'
                }}>
                  Chatbot tersedia di semua halaman melalui tombol floating di sudut kanan bawah layar.
                </p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  width: '100%',
                  maxWidth: '250px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>📍</span>
                    <span style={{ fontSize: '0.9rem' }}>Sudut kanan bawah</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>🔄</span>
                    <span style={{ fontSize: '0.9rem' }}>Tersedia 24/7</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                    <span style={{ fontSize: '0.9rem' }}>Bantuan instan</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tips Section */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              backgroundColor: '#f0fff4',
              border: '1px solid #9ae6b4',
              borderRadius: '12px'
            }}>
              <h4 style={{ 
                color: '#22543d', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.1rem'
              }}>
                <span>💡</span>
                Tips Berinteraksi
              </h4>
              <ul style={{ 
                color: '#2d3748', 
                fontSize: '0.9rem',
                lineHeight: '1.6',
                paddingLeft: '1rem',
                margin: '0'
              }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Gunakan kata kunci spesifik</strong> untuk hasil pencarian terbaik
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Tanyakan tentang prosedur</strong> dan persyaratan akses
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Minta rekomendasi</strong> berdasarkan topik atau periode waktu
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Manfaatkan pertanyaan cepat</strong> yang sudah disediakan
                </li>
                <li>
                  <strong>Chatbot tersedia</strong> di semua halaman website
                </li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              backgroundColor: '#ebf8ff',
              border: '1px solid #90cdf4',
              borderRadius: '12px'
            }}>
              <h4 style={{ 
                color: '#2b6cb0', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.1rem'
              }}>
                <span>🚀</span>
                Mulai Percakapan
              </h4>
              <p style={{ 
                color: '#2d3748', 
                fontSize: '0.9rem',
                lineHeight: '1.6',
                marginBottom: '1rem'
              }}>
                Coba tanyakan hal-hal seperti:
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {[
                  "Bagaimana cara mengakses naskah kuno?",
                  "Rekomendasi buku sejarah Jawa",
                  "Syarat meminjam buku langka",
                  "Jam buka perpustakaan"
                ].map((question, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem',
                      color: '#4a5568',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f7fafc'
                      e.target.style.borderColor = '#cbd5e0'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white'
                      e.target.style.borderColor = '#e2e8f0'
                    }}
                    onClick={() => {
                      // Scroll to bottom and show chatbot
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                    }}
                  >
                    "{question}"
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section style={{
        backgroundColor: '#f7fafc',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        marginTop: '3rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            color: '#2d3748',
            marginBottom: '1rem',
            fontSize: isMobile ? '1.5rem' : '2rem'
          }}>
            Butuh Bantuan Langsung?
          </h2>
          <p style={{
            color: '#4a5568',
            fontSize: isMobile ? '1rem' : '1.1rem',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}>
            Jika Anda membutuhkan bantuan lebih lanjut dari pustakawan manusia, 
            jangan ragu untuk menghubungi kami langsung.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📞</div>
              <div style={{ fontWeight: '600', color: '#2d3748' }}>(021) 5220100</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>Ext. 1234</div>
            </div>
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✉️</div>
              <div style={{ fontWeight: '600', color: '#2d3748' }}>bukulangka@perpusnas.go.id</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>Email Support</div>
            </div>
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🕒</div>
              <div style={{ fontWeight: '600', color: '#2d3748' }}>Senin - Jumat</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>08.00 - 16.00 WIB</div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
