// components/profil/KontakJam.js
import { useState, useEffect } from 'react'
import ContactCard from './ContactCard'

export default function KontakJam() {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const isOpen = () => {
    const hour = currentTime.getHours()
    const day = currentTime.getDay()
    // Senin-Jumat, 08:00-16:00
    return day >= 1 && day <= 5 && hour >= 8 && hour < 16
  }

  const getDayName = (dayIndex) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    return days[dayIndex]
  }

  return (
    <section style={{ 
      padding: '3rem 2rem', 
      maxWidth: '1000px', 
      margin: '0 auto' 
    }}>
      {/* Status Buka/Tutup */}
      <div style={{
        backgroundColor: isOpen() ? '#f0fff4' : '#fed7d7',
        border: `2px solid ${isOpen() ? '#48bb78' : '#f56565'}`,
        padding: '2rem',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {isOpen() ? '🟢' : '🔴'}
        </div>
        <h3 style={{ 
          color: isOpen() ? '#22543d' : '#742a2a',
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '0.5rem'
        }}>
          {isOpen() ? 'SEDANG BUKA' : 'SEDANG TUTUP'}
        </h3>
        <p style={{ 
          color: isOpen() ? '#2d3748' : '#4a5568',
          marginBottom: '0.5rem',
          fontSize: '1.1rem'
        }}>
          {currentTime.toLocaleDateString('id-ID', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} • {currentTime.toLocaleTimeString('id-ID')}
        </p>
        <p style={{ 
          color: isOpen() ? '#38a169' : '#e53e3e',
          fontWeight: '600',
          margin: 0
        }}>
          Jam Operasional: Senin-Jumat, 08:00-16:00 WIB
        </p>
      </div>

      {/* Contact Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <ContactCard 
          icon="📞" 
          title="Telepon" 
          content="+62-21-3456789"
          subtitle="Ext. 1234"
        />
        <ContactCard 
          icon="📧" 
          title="Email" 
          content="bukulangka@perpusnas.go.id"
          subtitle="Respon dalam 24 jam"
        />
        <ContactCard 
          icon="📍" 
          title="Lokasi" 
          content="Gedung Perpustakaan Nasional RI Lantai 7"
          subtitle="Jl. Medan Merdeka Selatan No.11, Jakarta"
        />
        <ContactCard 
          icon="🕒" 
          title="Jam Layanan" 
          content="Senin - Jumat"
          subtitle="08:00 - 16:00 WIB"
        />
      </div>

      {/* Detailed Schedule */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          color: '#2d3748',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Jadwal Detail Layanan
        </h3>
        <div style={{
          display: 'grid',
          gap: '1rem',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          {[
            { day: 'Senin - Kamis', hours: '08:00 - 16:00 WIB', type: 'Layanan Penuh' },
            { day: 'Jumat', hours: '08:00 - 16:00 WIB', type: 'Layanan Penuh' },
            { day: 'Sabtu', hours: '09:00 - 15:00 WIB', type: 'Layanan Terbatas' },
            { day: 'Minggu', hours: 'Tutup', type: 'Libur' },
            { day: 'Hari Libur Nasional', hours: 'Tutup', type: 'Libur' }
          ].map((schedule, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: index % 2 === 0 ? '#f7fafc' : 'white',
              borderRadius: '8px'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: '#2d3748' }}>
                  {schedule.day}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                  {schedule.type}
                </div>
              </div>
              <div style={{
                fontWeight: '600',
                color: schedule.hours === 'Tutup' ? '#e53e3e' : '#38a169'
              }}>
                {schedule.hours}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
