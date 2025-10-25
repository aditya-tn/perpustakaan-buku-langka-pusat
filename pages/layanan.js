// pages/layanan.js
import { useState, useEffect, useRef } from 'react'
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
        <title>Layanan - Perpustakaan Nasional RI</title>
        <meta name="description" content="Pemesanan koleksi buku langka dan ruang baca khusus" />
      </Head>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        color: 'white',
        padding: isMobile ? '3rem 1rem' : '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: isMobile ? '2rem' : '2.5rem',
          fontWeight: '800',
          marginBottom: '1rem'
        }}>
          Layanan Khusus
        </h1>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          opacity: 0.9,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Akses koleksi buku langka dan ruang baca khusus
        </p>
      </section>

      {/* Tab Navigation */}
      <div style={{
        maxWidth: '800px',
        margin: isMobile ? '2rem 1rem' : '3rem auto',
        display: 'flex',
        gap: '0',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setActiveTab('koleksi')}
          style={{
            flex: 1,
            padding: isMobile ? '1rem 1.5rem' : '1.25rem 2rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'koleksi' ? 'white' : 'transparent',
            color: activeTab === 'koleksi' ? '#1e40af' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: activeTab === 'koleksi' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          📚 Pemesanan Koleksi
        </button>
        <button
          onClick={() => setActiveTab('ruang-baca')}
          style={{
            flex: 1,
            padding: isMobile ? '1rem 1.5rem' : '1.25rem 2rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'ruang-baca' ? 'white' : 'transparent',
            color: activeTab === 'ruang-baca' ? '#1e40af' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: activeTab === 'ruang-baca' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          🏛️ Ruang Baca Khusus
        </button>
      </div>

      {/* Content Area - TANPA PADDING BOTTOM BESAR */}
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: isMobile ? '0 1rem 1rem' : '0 2rem 2rem'
      }}>
        {activeTab === 'koleksi' && <PemesananKoleksi isMobile={isMobile} />}
        {activeTab === 'ruang-baca' && <PemesananRuangBaca isMobile={isMobile} />}
      </div>
    </Layout>
  )
}

// Komponen Pemesanan Koleksi - DIOPTIMALKAN UNTUK SCROLL
function PemesananKoleksi({ isMobile }) {
  const [formHeight, setFormHeight] = useState(800)
  const formRef = useRef(null)

  // Adjust form height based on content
  useEffect(() => {
    const updateFormHeight = () => {
      if (isMobile) {
        setFormHeight(window.innerHeight - 200) // Sesuaikan dengan kebutuhan
      } else {
        setFormHeight(window.innerHeight - 150)
      }
    }

    updateFormHeight()
    window.addEventListener('resize', updateFormHeight)
    return () => window.removeEventListener('resize', updateFormHeight)
  }, [isMobile])

  const informasiPenting = [
    "Waktu Pemesanan: Hanya pada saat jam layanan buka",
    "Lokasi Akses: Buku hanya dapat dibaca ditempat, tidak diperkenankan dibawa pulang",
    "Durasi: Maksimal peminjaman 5 buku untuk sekali pinjam",
    "Reproduksi: Dilarang memfotokopi atau mereproduksi koleksi",
    "Identitas: Wajib menyerahkan Kartu Anggota Perpusnas RI / KTP / Kartu Pelajar"
  ]

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1.5rem 1.5rem 1rem' : '2rem 2rem 1.5rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <h2 style={{ 
          color: '#1e293b', 
          marginBottom: '0.75rem',
          fontSize: isMobile ? '1.5rem' : '1.75rem'
        }}>
          Pemesanan Koleksi Buku Langka
        </h2>
        <p style={{ 
          color: '#64748b', 
          margin: 0,
          lineHeight: '1.5'
        }}>
          Formulir pemesanan akses ke koleksi buku langka Perpustakaan Nasional RI
        </p>
      </div>

      {/* Google Form Container - TANPA SCROLL INTERNAL */}
      <div ref={formRef} style={{
        width: '100%',
        height: `${formHeight}px`,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <iframe 
          src="https://docs.google.com/forms/d/e/1FAIpQLSdc-dsmpO9oFgzmHTlzU5fvDlLnkWcqqvC9KUL4dn-fqdpiqw/viewform?embedded=true"
          width="100%" 
          height="100%" 
          frameBorder="0"
          title="Form Pemesanan Koleksi Buku Langka"
          style={{ 
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          scrolling="no" // Nonaktifkan scroll internal
        >
          Loading…
        </iframe>
      </div>

      {/* Informasi Penting - Ditempatkan di bawah form */}
      <div style={{
        padding: isMobile ? '1.5rem' : '2rem',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0'
      }}>
        <h4 style={{ 
          color: '#334155', 
          marginBottom: '1rem',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📋 Informasi Penting
        </h4>
        <div style={{ 
          color: '#475569',
          lineHeight: '1.6'
        }}>
          {informasiPenting.map((info, index) => (
            <div key={index} style={{ 
              marginBottom: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              {info}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Komponen Pemesanan Ruang Baca - DIOPTIMALKAN UNTUK SCROLL
function PemesananRuangBaca({ isMobile }) {
  const [formHeight, setFormHeight] = useState(700)

  // Adjust form height based on content
  useEffect(() => {
    const updateFormHeight = () => {
      if (isMobile) {
        setFormHeight(window.innerHeight - 200)
      } else {
        setFormHeight(window.innerHeight - 150)
      }
    }

    updateFormHeight()
    window.addEventListener('resize', updateFormHeight)
    return () => window.removeEventListener('resize', updateFormHeight)
  }, [isMobile])

  const fasilitas = [
    { icon: '🪑', title: 'Kursi Ergonomis', desc: 'Desain ergonomis untuk kenyamanan membaca' },
    { icon: '🔌', title: 'Stop Kontak', desc: 'Akses listrik untuk perangkat penelitian' },
    { icon: '📶', title: 'WiFi Cepat', desc: 'Internet berkecepatan tinggi' },
    { icon: '🔇', title: 'Atmosfer Tenang', desc: 'Lingkungan kondusif bebas gangguan' }
  ]

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1.5rem 1.5rem 1rem' : '2rem 2rem 1.5rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <h2 style={{ 
          color: '#1e293b', 
          marginBottom: '0.75rem',
          fontSize: isMobile ? '1.5rem' : '1.75rem'
        }}>
          Pemesanan Ruang Baca Khusus
        </h2>
        <p style={{ 
          color: '#64748b', 
          margin: 0,
          lineHeight: '1.5'
        }}>
          Reservasi ruang baca khusus untuk penelitian dan studi mendalam
        </p>
      </div>

      {/* Google Form Container - TANPA SCROLL INTERNAL */}
      <div style={{
        width: '100%',
        height: `${formHeight}px`,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <iframe 
          src="https://docs.google.com/forms/d/e/1FAIpQLScKwZjJ91zKwGnknXSno2_f9qd4MUPxqPMciDnJSQnw-FbsHg/viewform?embedded=true"
          width="100%" 
          height="100%" 
          frameBorder="0"
          title="Form Pemesanan Ruang Baca Khusus"
          style={{ 
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          scrolling="no" // Nonaktifkan scroll internal
        >
          Loading…
        </iframe>
      </div>

      {/* Fasilitas */}
      <div style={{
        padding: isMobile ? '1.5rem' : '2rem',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          color: '#334155',
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontSize: isMobile ? '1.25rem' : '1.5rem'
        }}>
          🏆 Fasilitas Unggulan
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {fasilitas.map((fasilitas, index) => (
            <div key={index} style={{
              padding: '1.25rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{fasilitas.icon}</div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{fasilitas.title}</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                {fasilitas.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
