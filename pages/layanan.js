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
        padding: isMobile ? '2.5rem 1rem' : '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: isMobile ? '2rem' : '2.5rem',
          fontWeight: '800',
          marginBottom: '1rem',
          lineHeight: '1.2'
        }}>
          Layanan Perpustakaan
        </h1>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
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
        margin: isMobile ? '1.5rem 1rem' : '2rem auto',
        display: 'flex',
        gap: '0',
        backgroundColor: '#f7fafc',
        borderRadius: '12px',
        padding: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setActiveTab('koleksi')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'koleksi' ? 'white' : 'transparent',
            color: activeTab === 'koleksi' ? '#2d3748' : '#718096',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: activeTab === 'koleksi' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.3s ease',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}
        >
          📚 Pemesanan Koleksi
        </button>
        <button
          onClick={() => setActiveTab('ruang-baca')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'ruang-baca' ? 'white' : 'transparent',
            color: activeTab === 'ruang-baca' ? '#2d3748' : '#718096',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: activeTab === 'ruang-baca' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.3s ease',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}
        >
          🏛️ Ruang Baca Khusus
        </button>
      </div>

      {/* Content Area */}
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: isMobile ? '0 1rem 2rem' : '0 2rem 4rem'
      }}>
        {activeTab === 'koleksi' && <PemesananKoleksi isMobile={isMobile} />}
        {activeTab === 'ruang-baca' && <PemesananRuangBaca isMobile={isMobile} />}
      </div>
    </Layout>
  )
}

// Komponen Pemesanan Koleksi - HEIGHT FIXED 1900px
function PemesananKoleksi({ isMobile }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1.5rem' : '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ 
        color: '#2d3748', 
        marginBottom: '1rem',
        fontSize: isMobile ? '1.5rem' : '1.75rem'
      }}>
        Pemesanan Koleksi Buku Langka
      </h2>
      <p style={{ 
        color: '#718096', 
        marginBottom: '2rem',
        lineHeight: '1.6',
        fontSize: isMobile ? '0.9rem' : '1rem'
      }}>
        Untuk mengakses koleksi buku langka, silakan isi formulir pemesanan berikut. 
        Tim kami akan memanggil Anda untuk menyerahkan koleksi.
      </p>
      
      {/* Google Form Embed - HEIGHT FIXED 1900px */}
      <div style={{
        width: '100%',
        height: '1900px', // Height fixed sesuai permintaan
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        border: '2px solid #e2e8f0' // Border lebih jelas
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
          scrolling="no" // Scroll internal dimatikan, menggunakan scroll halaman saja
        >
          Loading…
        </iframe>
      </div>

      {/* Informasi Penting */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        backgroundColor: '#f0fff4',
        borderRadius: '8px',
        border: '2px solid #c6f6d5' // Border lebih jelas
      }}>
        <h4 style={{ 
          color: '#2f855a', 
          marginBottom: '1rem',
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📋 Informasi Penting
        </h4>
        <ul style={{ 
          color: '#2d3748', 
          margin: 0, 
          paddingLeft: '1.5rem',
          lineHeight: '1.6'
        }}>
          <li style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <strong>Waktu Pemesanan:</strong> Hanya pada saat jam layanan buka
          </li>
          <li style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <strong>Lokasi Akses:</strong> Buku hanya dapat dibaca ditempat, tidak diperkenankan dibawa pulang atau ke lantai lain
          </li>
          <li style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <strong>Durasi:</strong> Maksimal peminjaman 5 buku untuk sekali pinjam 
          </li>
          <li style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <strong>Reproduksi:</strong> Dilarang memfotokopi atau mereproduksi koleksi
          </li>
          <li style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <strong>Identitas:</strong> Wajib menyerahkan Kartu Anggota Perpusnas RI / KTP / Kartu Pelajar / Kartu identitas lain yang relevan
          </li>
        </ul>
      </div>
    </div>
  )
}

// Komponen Pemesanan Ruang Baca - HEIGHT FIXED 1740px
function PemesananRuangBaca({ isMobile }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1.5rem' : '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ 
        color: '#2d3748', 
        marginBottom: '1rem',
        fontSize: isMobile ? '1.5rem' : '1.75rem'
      }}>
        Pemesanan Ruang Baca Khusus
      </h2>
      <p style={{ 
        color: '#718096', 
        marginBottom: '2rem',
        lineHeight: '1.6',
        fontSize: isMobile ? '0.9rem' : '1rem'
      }}>
        Reservasi ruang baca khusus untuk penelitian dan studi mendalam. 
        Tersedia fasilitas lengkap dengan atmosfer yang kondusif.
        Pemesanan harus dilakukan pada saat <strong>jam kerja layanan</strong>.
      </p>
      
      {/* Google Form Embed - HEIGHT FIXED 1740px */}
      <div style={{
        width: '100%',
        height: '1740px', // Height fixed sesuai permintaan
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        border: '2px solid #e2e8f0' // Border lebih jelas
      }}>
        <iframe 
          src="https://docs.google.com/forms/d/e/1FAIpQLScKwZjJ91zKwGnknXSno2_f9qd4MUPxqPMciDnJSQnw-FbsHg/viewform?embedded=true"
          width="100%" 
          height="100%" 
          frameBorder="0"
          title="Form Pemesanan Ruang Baca Khusus"
          style={{ 
            border: 'none',
            display: 'block'
          }}
          scrolling="no" // Scroll internal dimatikan, menggunakan scroll halaman saja
        >
          Loading…
        </iframe>
      </div>

      {/* Fasilitas dengan border lebih jelas */}
      <div style={{
        marginTop: '2rem',
        padding: isMobile ? '1.5rem' : '2rem',
        backgroundColor: '#f7fafc',
        borderRadius: '12px',
        border: '2px solid #e2e8f0'
      }}>
        <h3 style={{
          color: '#2d3748',
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
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
          gap: '1.5rem'
        }}>
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🪑</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Kursi Ergonomis</h4>
            <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Desain ergonomis dengan pencahayaan optimal untuk kenyamanan membaca berjam-jam
            </p>
          </div>
          
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔌</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Stop Kontak</h4>
            <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Akses listrik lengkap untuk laptop, tablet, dan perangkat penelitian lainnya
            </p>
          </div>
          
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📶</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>WiFi Cepat</h4>
            <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Internet berkecepatan tinggi untuk penelitian dan akses database e-resources Perpustakaan Nasional RI
            </p>
          </div>

          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔇</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Atmosfer Tenang</h4>
            <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Lingkungan yang kondusif dan bebas gangguan untuk konsentrasi maksimal
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
