// components/profil/KontakJam.js - OPTIMIZED
import { useState, useEffect } from 'react'
import ContactCard from './ContactCard'

export default function KontakJam({ isMobile }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const isOpen = () => {
    if (!isClient) return false
    const hour = currentTime.getHours()
    const day = currentTime.getDay()
    const isWeekday = day >= 1 && day <= 5
    const isWeekend = day === 0 || day === 6
    
    if (isWeekday) return hour >= 8 && hour < 19
    if (isWeekend) return hour >= 9 && hour < 16
    return false
  }

  const formatTime = () => {
    if (!isClient) return 'Loading...'
    return currentTime.toLocaleTimeString('id-ID')
  }

  const formatDate = () => {
    if (!isClient) return 'Loading...'
    return currentTime.toLocaleDateString('id-ID', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <section style={{ 
      padding: isMobile ? '2rem 1rem' : '3rem 2rem', 
      maxWidth: '1000px', 
      margin: '0 auto',
      minHeight: '70vh'
    }}>
      {/* Status Buka/Tutup */}
      <div style={{
        backgroundColor: isOpen() ? '#f0fff4' : '#fed7d7',
        border: `2px solid ${isOpen() ? '#48bb78' : '#f56565'}`,
        padding: isMobile ? '1.5rem' : '2rem',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: isMobile ? '2rem' : '3rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{ 
          fontSize: isMobile ? '2rem' : '3rem', 
          marginBottom: '0.75rem' 
        }}>
          {isOpen() ? '🟢' : '🔴'}
        </div>
        <h3 style={{ 
          color: isOpen() ? '#22543d' : '#742a2a',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          marginBottom: '0.5rem'
        }}>
          {isOpen() ? 'SEDANG BUKA' : 'SEDANG TUTUP'}
        </h3>
        <p style={{ 
          color: isOpen() ? '#2d3748' : '#4a5568',
          marginBottom: '0.5rem',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}>
          {formatDate()} • {formatTime()}
        </p>
        <p style={{ 
          color: isOpen() ? '#38a169' : '#e53e3e',
          fontWeight: '600',
          margin: 0,
          fontSize: isMobile ? '0.8rem' : '0.9rem'
        }}>
          {isOpen() ? 'Kami siap melayani Anda!' : 'Kami akan buka sesuai jam operasional'}
        </p>
      </div>

      {/* Contact Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: isMobile ? '1.5rem' : '2rem',
        marginBottom: isMobile ? '2rem' : '3rem'
      }}>
        <ContactCard 
          icon="💬" 
          title="WhatsApp" 
          content="+62 857-1714-7303"
          subtitle="Pujasintara - Layanan Cepat"
          link="https://wa.me/6285717147303"
          isMobile={isMobile}
        />
        <ContactCard 
          icon="📧" 
          title="Email" 
          content="info_pujasintara@perpusnas.go.id"
          subtitle="Respon dalam 24 jam"
          link="mailto:info_pujasintara@perpusnas.go.id"
          isMobile={isMobile}
        />
        <ContactCard 
          icon="📍" 
          title="Lokasi" 
          content="Gedung Layanan Perpustakaan Nasional RI Lantai 14"
          subtitle="Jl. Medan Merdeka Selatan No. 11, Gambir, Jakarta"
          isMobile={isMobile}
        />
        <ContactCard 
          icon="🕒" 
          title="Jam Layanan" 
          content="Senin - Minggu"
          subtitle="Lihat jadwal detail"
          isMobile={isMobile}
        />
      </div>

      {/* Detailed Schedule */}
      <div style={{
        backgroundColor: 'white',
        padding: isMobile ? '1.5rem' : '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ 
          color: '#2d3748',
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700'
        }}>
          Jadwal Detail Layanan
        </h3>
        <div style={{
          display: 'grid',
          gap: '0.75rem',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          {[
            { day: 'Senin - Jumat', hours: '08:00 - 19:00 WIB', type: 'Layanan Penuh' },
            { day: 'Sabtu - Minggu', hours: '09:00 - 16:00 WIB', type: 'Layanan Terbatas' },
            { day: 'Hari Libur Nasional', hours: 'Tutup', type: 'Libur' }
          ].map((schedule, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: isMobile ? '0.75rem' : '1rem',
              backgroundColor: index % 2 === 0 ? '#f7fafc' : 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#2d3748', 
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  marginBottom: '0.25rem'
                }}>
                  {schedule.day}
                </div>
                <div style={{ 
                  fontSize: isMobile ? '0.75rem' : '0.8rem', 
                  color: '#718096' 
                }}>
                  {schedule.type}
                </div>
              </div>
              <div style={{
                fontWeight: '600',
                color: schedule.hours === 'Tutup' ? '#e53e3e' : '#38a169',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                textAlign: 'right'
              }}>
                {schedule.hours}
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional Info */}
        <div style={{
          marginTop: '1.5rem',
          padding: isMobile ? '0.75rem' : '1rem',
          backgroundColor: '#fffaf0',
          border: '1px solid #fed7d7',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#744210', 
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            lineHeight: '1.5'
          }}>
            📍 <strong>Lokasi:</strong> Gedung Layanan Perpustakaan Nasional RI, Lantai 14<br/>
            🏛️ Jalan Medan Merdeka Selatan No. 11, Gambir, Jakarta Pusat
          </p>
        </div>
      </div>
    </section>
  )
}
