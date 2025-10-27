// components/profil/TimKami.js - OPTIMIZED
import { useState } from 'react'
import StaffCard from './StaffCard'

export default function TimKami({ isMobile }) {
  const [selectedDept, setSelectedDept] = useState('semua')
  
  const staffData = [
    // Manajemen
    {
      name: "Yeri Nurita, S.S",
      position: "Plt. Kepala Pusat Jasa Informasi dan Pengelolaan Naskah Nusantara",
      department: "manajemen",
      education: "S-1 Sastra Indonesia - Universitas Indonesia",
      experience: "32 tahun"
    },
    {
      name: "Hety Setiawati, S.E., M.P.",
      position: "Ketua Kelompok Substansi Layanan Koleksi Langka", 
      department: "manajemen",
      education: "S-1 Ekonomi, S-2 Manajemen",
      experience: "20 tahun"
    },
    // Layanan Pengguna
    {
      name: "Aditya Taufik Nugraha, S.Hum",
      position: "Ketua Tim Layanan Koleksi Buku Langka, Pustakawan Ahli Muda",
      department: "layanan",
      education: "S-1 Ilmu Perpustakaan - Universitas Indonesia", 
      experience: "6 tahun"
    },
    {
      name: "Dian Soni Amellia, S.Hum., M.Hum.",
      position: "Pustakawan Ahli Madya",
      department: "layanan",
      education: "S-1 Program Studi Belanda - Universitas Indonesia, S-2 Ilmu Perpustakaan - Universitas Indonesia",
      experience: "17 tahun"
    },
    {
      name: "Katolo Gowani, S.S., MTCSOL",
      position: "Pustakawan Ahli Muda",
      department: "layanan",
      education: "S-1 Sastra Cina - Universitas Bina Nusantara, S-2 Magister Pengajaran Bahasa Tionghoa untuk Penutur Bahasa Lain",
      experience: "6 tahun"
    },
    {
      name: "Kharissa Putri, S.Hum",
      position: "Pustakawan Ahli Pertama",
      department: "layanan",
      education: "S-1 Program Studi Belanda - Universitas Indonesia",
      experience: "6 tahun"
    },
    {
      name: "Regina Savitri, S.S.I",
      position: "Pustakawan Ahli Pertama",
      department: "layanan",
      education: "S-1 Ilmu Perpustakaan dan Informasi - Universitas Padjajaran",
      experience: "1 tahun"
    },
    {
      name: "Dinda Ayumanda, A.Md",
      position: "Asisten Perpustakaan Terampil",
      department: "layanan",
      education: "D-III Ilmu Perpustakaan dan Kearsipan - Universitas Negeri Padang",
      experience: "2 tahun"
    }
  ]

  const departments = [
    { id: 'semua', label: 'Semua Tim' },
    { id: 'manajemen', label: 'Manajemen' },
    { id: 'layanan', label: 'Layanan Pengguna' }
  ]

  const filteredStaff = selectedDept === 'semua' 
    ? staffData 
    : staffData.filter(staff => staff.department === selectedDept)

  return (
    <section style={{ 
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      backgroundColor: '#f8fafc',
      minHeight: '80vh'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
          <h2 style={{ 
            color: '#2d3748', 
            marginBottom: '0.75rem',
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700'
          }}>
            Tim Profesional Kami
          </h2>
          <p style={{ 
            color: '#718096', 
            fontSize: isMobile ? '0.9rem' : '1.1rem',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            Tim yang berdedikasi melayani kebutuhan akses koleksi buku langka
          </p>
          
          {/* Department Filter */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            marginTop: '1.5rem'
          }}>
            {departments.map(dept => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                  backgroundColor: selectedDept === dept.id ? '#4299e1' : 'white',
                  color: selectedDept === dept.id ? 'white' : '#4a5568',
                  border: '1px solid #e2e8f0',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  boxShadow: selectedDept === dept.id ? '0 2px 8px rgba(66, 153, 225, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                {dept.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: isMobile ? '1.5rem' : '2rem'
        }}>
          {filteredStaff.map((person, index) => (
            <StaffCard key={index} person={person} index={index} isMobile={isMobile} />
          ))}
        </div>

        {/* Empty State */}
        {filteredStaff.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#718096'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>Tidak ada staff di departemen ini</h3>
            <p>Silakan pilih departemen lain</p>
          </div>
        )}
      </div>
    </section>
  )
}
