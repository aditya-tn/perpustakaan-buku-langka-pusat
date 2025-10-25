// pages/layanan.js
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

export default function Layanan() {
  const [activeTab, setActiveTab] = useState('koleksi')
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
        <title>Layanan - Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Pemesanan koleksi buku langka dan ruang baca khusus Perpustakaan Nasional RI" />
      </Head>

      {/* Hero Section Layanan */}
      <section style={{
        background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
        color: 'white',
        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: '800',
          marginBottom: '1rem',
          lineHeight: '1.2'
        }}>
          Layanan Perpustakaan
        </h1>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1.2rem',
          opacity: 0.9,
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          Akses layanan pemesanan koleksi buku langka dan ruang baca khusus
        </p>
      </section>

      {/* Tab Navigation */}
      <div style={{
        maxWidth: '800px',
        margin: isMobile ? '1.25rem 1rem' : '2rem auto',
        display: 'flex',
        gap: '0',
        backgroundColor: '#f7fafc',
        borderRadius: isMobile ? '8px' : '12px',
        padding: isMobile ? '0.375rem' : '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setActiveTab('koleksi')}
          style={{
            flex: 1,
            padding: isMobile ? '0.625rem 0.75rem' : '1rem 2rem',
            border: 'none',
            borderRadius: isMobile ? '6px' : '8px',
            backgroundColor: activeTab === 'koleksi' ? 'white' : 'transparent',
            color: activeTab === 'koleksi' ? '#2d3748' : '#718096',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: activeTab === 'koleksi' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.3s ease',
            fontSize: isMobile ? '0.85rem' : '1rem'
          }}
        >
          📚 Pemesanan Koleksi
        </button>
        <button
          onClick={() => setActiveTab('ruang-baca')}
          style={{
            flex: 1,
            padding: isMobile ? '0.625rem 0.75rem' : '1rem 2rem',
            border: 'none',
            borderRadius: isMobile ? '6px' : '8px',
            backgroundColor: activeTab === 'ruang-baca' ? 'white' : 'transparent',
            color: activeTab === 'ruang-baca' ? '#2d3748' : '#718096',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: activeTab === 'ruang-baca' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.3s ease',
            fontSize: isMobile ? '0.85rem' : '1rem'
          }}
        >
          🏛️ Ruang Baca Khusus
        </button>
      </div>

      {/* Content Area */}
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: isMobile ? '0 1rem 1.5rem' : '0 2rem 4rem'
      }}>
        {activeTab === 'koleksi' && <PemesananKoleksi isMobile={isMobile} />}
        {activeTab === 'ruang-baca' && <PemesananRuangBaca isMobile={isMobile} />}
      </div>
    </Layout>
  )
}

// Komponen Pemesanan Koleksi - HEIGHT ADJUSTED FOR MOBILE
function PemesananKoleksi({ isMobile }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1.25rem' : '2rem',
      borderRadius: isMobile ? '8px' : '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ 
        color: '#2d3748', 
        marginBottom: '0.875rem',
        fontSize: isMobile ? '1.375rem' : '1.75rem'
      }}>
        Pemesanan Koleksi Buku Langka
      </h2>
      <p style={{ 
        color: '#718096', 
        marginBottom: '1.5rem',
        lineHeight: '1.6',
        fontSize: isMobile ? '0.85rem' : '1rem'
      }}>
        Untuk mengakses koleksi buku langka, silakan isi formulir pemesanan berikut. 
        Tim kami akan memanggil Anda untuk menyerahkan koleksi.
      </p>
      
      {/* Google Form Embed - HEIGHT ADJUSTED +60px for mobile */}
      <div style={{
        width: '100%',
        height: isMobile ? '1960px' : '1900px', // +60px for mobile
        borderRadius: isMobile ? '6px' : '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
        border: isMobile ? '1px solid #e2e8f0' : '2px solid #e2e8f0'
      }}>
        <iframe 
          src="https://docs.google.com/forms/d/e/1FAIpQLSdc-dsmpO9oFgzmHTlzU5fvDlLnkWcqqvC9KUL4dn-fqdpiqw/viewform?embedded=true"
          width="100%" 
          height="100%" 
          frameBorder="0"
          title="Form Pemesanan Koleksi Buku Langka"
          style={{ 
            border: 'none',
            display: 'block'
          }}
          scrolling="no"
        >
          Loading…
        </iframe>
      </div>

      {/* Informasi Penting - BORDER ADJUSTED for mobile */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        backgroundColor: '#f0fff4',
        borderRadius: isMobile ? '6px' : '8px',
        border: isMobile ? '1px solid #c6f6d5' : '2px solid #c6f6d5'
      }}>
        <h4 style={{ 
          color: '#2f855a', 
          marginBottom: '0.875rem',
          fontSize: isMobile ? '1rem' : '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📋 Informasi Penting
        </h4>
        <ul style={{ 
          color: '#2d3748', 
          margin: 0, 
          paddingLeft: isMobile ? '1rem' : '1.5rem',
          lineHeight: '1.6'
        }}>
          <li style={{ 
            marginBottom: isMobile ? '0.75rem' : '0.5rem', 
            padding: isMobile ? '0.375rem' : '0.5rem', 
            backgroundColor: 'white', 
            borderRadius: isMobile ? '3px' : '4px', 
            border: isMobile ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
            fontSize: isMobile ? '0.8rem' : '0.9rem'
          }}>
            <strong>Waktu Pemesanan:</strong> Hanya pada saat jam layanan buka
          </li>
          <li style={{ 
            marginBottom: isMobile ? '0.75rem' : '0.5rem', 
            padding: isMobile ? '0.375rem' : '0.5rem', 
            backgroundColor: 'white', 
            borderRadius: isMobile ? '3px' : '4px', 
            border: isMobile ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
            fontSize: isMobile ? '0.8rem' : '0.9rem'
          }}>
            <strong>Lokasi Akses:</strong> Buku hanya dapat dibaca ditempat, tidak diperkenankan dibawa pulang atau ke lantai lain
          </li>
          <li style={{ 
            marginBottom: isMobile ? '0.75rem' : '0.5rem', 
            padding: isMobile ? '0.375rem' : '0.5rem', 
            backgroundColor: 'white', 
            borderRadius: isMobile ? '3px' : '4px', 
            border: isMobile ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
            fontSize: isMobile ? '0.8rem' : '0.9rem'
          }}>
            <strong>Durasi:</strong> Maksimal peminjaman 5 buku untuk sekali pinjam 
          </li>
          <li style={{ 
            marginBottom: isMobile ? '0.75rem' : '0.5rem', 
            padding: isMobile ? '0.375rem' : '0.5rem', 
            backgroundColor: 'white', 
            borderRadius: isMobile ? '3px' : '4px', 
            border: isMobile ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
            fontSize: isMobile ? '0.8rem' : '0.9rem'
          }}>
            <strong>Reproduksi:</strong> Dilarang memfotokopi atau mereproduksi koleksi
          </li>
          <li style={{ 
            marginBottom: '0', 
            padding: isMobile ? '0.375rem' : '0.5rem', 
            backgroundColor: 'white', 
            borderRadius: isMobile ? '3px' : '4px', 
            border: isMobile ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
            fontSize: isMobile ? '0.8rem' : '0.9rem'
          }}>
            <strong>Identitas:</strong> Wajib menyerahkan Kartu Anggota Perpusnas RI / KTP / Kartu Pelajar / Kartu identitas lain yang relevan
          </li>
        </ul>
      </div>
    </div>
  )
}

// Komponen Pemesanan Ruang Baca - HEIGHT ADJUSTED +60px for mobile
function PemesananRuangBaca({ isMobile }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1.25rem' : '2rem',
      borderRadius: isMobile ? '8px' : '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ 
        color: '#2d3748', 
        marginBottom: '0.875rem',
        fontSize: isMobile ? '1.375rem' : '1.75rem'
      }}>
        Pemesanan Ruang Baca Khusus
      </h2>
      <p style={{ 
        color: '#718096', 
        marginBottom: '1.5rem',
        lineHeight: '1.6',
        fontSize: isMobile ? '0.85rem' : '1rem'
      }}>
        Reservasi ruang baca khusus untuk penelitian dan studi mendalam. 
        Tersedia fasilitas lengkap dengan atmosfer yang kondusif.
        Pemesanan harus dilakukan pada saat <strong>jam kerja layanan</strong>.
      </p>
      
      {/* Google Form Embed - HEIGHT ADJUSTED +60px for mobile */}
      <div style={{
        width: '100%',
        height: isMobile ? '1800px' : '1740px', // +60px for mobile
        borderRadius: isMobile ? '6px' : '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
        border: isMobile ? '1px solid #e2e8f0' : '2px solid #e2e8f0'
      }}>
        <iframe 
          src="https://docs.google.comforms/d/e/1FAIpQLScKwZjJ91zKwGnknXSno2_f9qd4MUPxqPMciDnJSQnw-FbsHg/viewform?embedded=true"
          width="100%" 
          height="100%" 
          frameBorder="0"
          title="Form Pemesanan Ruang Baca Khusus"
          style={{ 
            border: 'none',
            display: 'block'
          }}
          scrolling="no"
        >
          Loading…
        </iframe>
      </div>

      {/* Fasilitas - BORDER ADJUSTED for mobile */}
      <div style={{
        marginTop: '1.5rem',
        padding: isMobile ? '1.25rem' : '2rem',
        backgroundColor: '#f7fafc',
        borderRadius: isMobile ? '8px' : '12px',
        border: isMobile ? '1px solid #e2e8f0' : '2px solid #e2e8f0'
      }}>
        <h3 style={{
          color: '#2d3748',
          marginBottom: '1.25rem',
          textAlign: 'center',
          fontSize: isMobile ? '1.125rem' : '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>🏆</span>
          Fasilitas Unggulan
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem'
        }}>
          <div style={{
            padding: isMobile ? '1.25rem' : '1.5rem',
            backgroundColor: 'white',
            borderRadius: isMobile ? '6px' : '8px',
            textAlign: 'center',
            border: isMobile ? '1px solid #e2e8f0' : '2px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: isMobile ? '0.75rem' : '1rem' }}>🪑</div>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              color: '#2d3748',
              fontSize: isMobile ? '0.95rem' : '1rem'
            }}>Kursi Ergonomis</h4>
            <p style={{ 
              margin: 0, 
              color: '#718096', 
              fontSize: isMobile ? '0.8rem' : '0.9rem', 
              lineHeight: '1.5' 
            }}>
              Desain ergonomis dengan pencahayaan optimal untuk kenyamanan membaca berjam-jam
            </p>
          </div>
          
          <div style={{
            padding: isMobile ? '1.25rem' : '1.5rem',
            backgroundColor: 'white',
            borderRadius: isMobile ? '6px' : '8px',
            textAlign: 'center',
            border: isMobile ? '1px solid #e2e8f0' : '2px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: isMobile ? '0.75rem' : '1rem' }}>🔌</div>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              color: '#2d3748',
              fontSize: isMobile ? '0.95rem' : '1rem'
            }}>Stop Kontak</h4>
            <p style={{ 
              margin: 0, 
              color: '#718096', 
              fontSize: isMobile ? '0.8rem' : '0.9rem', 
              lineHeight: '1.5' 
            }}>
              Akses listrik lengkap untuk laptop, tablet, dan perangkat penelitian lainnya
            </p>
          </div>
          
          <div style={{
            padding: isMobile ? '1.25rem' : '1.5rem',
            backgroundColor: 'white',
            borderRadius: isMobile ? '6px' : '8px',
            textAlign: 'center',
            border: isMobile ? '1px solid #e2e8f0' : '2px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: isMobile ? '0.75rem' : '1rem' }}>📶</div>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              color: '#2d3748',
              fontSize: isMobile ? '0.95rem' : '1rem'
            }}>WiFi Cepat</h4>
            <p style={{ 
              margin: 0, 
              color: '#718096', 
              fontSize: isMobile ? '0.8rem' : '0.9rem', 
              lineHeight: '1.5' 
            }}>
              Internet berkecepatan tinggi untuk penelitian dan akses database e-resources Perpustakaan Nasional RI
            </p>
          </div>

          <div style={{
            padding: isMobile ? '1.25rem' : '1.5rem',
            backgroundColor: 'white',
            borderRadius: isMobile ? '6px' : '8px',
            textAlign: 'center',
            border: isMobile ? '1px solid #e2e8f0' : '2px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: isMobile ? '0.75rem' : '1rem' }}>🔇</div>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              color: '#2d3748',
              fontSize: isMobile ? '0.95rem' : '1rem'
            }}>Atmosfer Tenang</h4>
            <p style={{ 
              margin: 0, 
              color: '#718096', 
              fontSize: isMobile ? '0.8rem' : '0.9rem', 
              lineHeight: '1.5' 
            }}>
              Lingkungan yang kondusif dan bebas gangguan untuk konsentrasi maksimal
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
