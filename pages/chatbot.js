// pages/chatbot.js
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

export default function ChatbotPage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>AI Pustakawan - Layanan Buku Langka</title>
        <meta name="description" content="Chat dengan AI Pustakawan untuk bantuan koleksi buku langka" />
      </Head>

      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '3rem 1rem' : '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            fontWeight: '800',
            marginBottom: '1rem'
          }}>
            AI Pustakawan 🤖
          </h1>
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            Asisten virtual kami siap membantu Anda menjelajahi koleksi buku langka, 
            memberikan informasi layanan, dan membantu pencarian literatur langka.
          </p>
        </div>
      </section>

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
          {/* Info Section */}
          <div>
            <h2 style={{ color: '#2d3748', marginBottom: '1.5rem' }}>
              Yang Dapat AI Pustakawan Bantu
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ 
                  color: '#667eea', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🔍 Pencarian Koleksi
                </h3>
                <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                  Cari buku berdasarkan judul, pengarang, tahun terbit, atau topik spesifik
                </p>
              </div>

              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ 
                  color: '#667eea', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📋 Informasi Layanan
                </h3>
                <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                  Panduan pemesanan buku, syarat akses, jam operasional, dan prosedur
                </p>
              </div>

              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ 
                  color: '#667eea', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  💡 Rekomendasi
                </h3>
                <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                  Dapatkan rekomendasi buku berdasarkan minat dan topik penelitian Anda
                </p>
              </div>
            </div>
          </div>

          {/* Chatbot Section */}
          <div style={{
            position: isMobile ? 'relative' : 'sticky',
            top: isMobile ? 'auto' : '2rem'
          }}>
            <div style={{
              height: isMobile ? '500px' : '600px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              {/* Chatbot component will be embedded here */}
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f7fafc',
                color: '#718096',
                textAlign: 'center',
                padding: '2rem'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>
                  AI Pustakawan
                </h3>
                <p>
                  Chatbot tersedia di semua halaman melalui tombol floating di sudut kanan bawah.
                </p>
              </div>
            </div>
            
            {/* Tips */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f0fff4',
              border: '1px solid #9ae6b4',
              borderRadius: '8px'
            }}>
              <h4 style={{ 
                color: '#22543d', 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                💡 Tips Berinteraksi
              </h4>
              <ul style={{ 
                color: '#2d3748', 
                fontSize: '0.9rem',
                lineHeight: '1.5',
                paddingLeft: '1rem',
                margin: 0
              }}>
                <li>Gunakan kata kunci spesifik untuk hasil terbaik</li>
                <li>Tanyakan tentang prosedur dan persyaratan</li>
                <li>Minta rekomendasi berdasarkan topik</li>
                <li>Chatbot juga tersedia di semua halaman (tombol 🤖)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
