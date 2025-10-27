// components/profil/TimKami.js
import { useState } from 'react'
import StaffCard from './StaffCard'

export default function TimKami() {
  const [selectedDept, setSelectedDept] = useState('semua')
  
  const staffData = [
    {
      name: "Dr. Sari Dewi, M.Hum.",
      position: "Kepala Layanan Koleksi Buku Langka",
      department: "manajemen",
      email: "sari.dewi@perpusnas.go.id",
      expertise: "Filologi, Konservasi Naskah Kuno, Manajemen Koleksi",
      education: "S3 Filologi - Universitas Indonesia",
      experience: "15 tahun",
      image: null
    },
    {
      name: "Budi Santoso, S.S.",
      position: "Koordinator Preservasi",
      department: "konservasi", 
      email: "budi.santoso@perpusnas.go.id",
      expertise: "Konservasi Kertas, Restorasi Dokumen, Digital Preservation",
      education: "S1 Ilmu Perpustakaan - Universitas Indonesia",
      experience: "12 tahun",
      image: null
    },
    {
      name: "Maya Sari, M.Lib.",
      position: "Pustakawan Spesialis",
      department: "layanan",
      email: "maya.sari@perpusnas.go.id",
      expertise: "Layanan Referensi, Katalogisasi Khusus, Research Assistance",
      education: "S2 Library Science - Universitas Gadjah Mada", 
      experience: "8 tahun",
      image: null
    },
    {
      name: "Ahmad Rizki, S.T.",
      position: "Spesialis Digitalisasi",
      department: "konservasi",
      email: "ahmad.rizki@perpusnas.go.id", 
      expertise: "Digital Imaging, Metadata Management, System Administration",
      education: "S1 Teknik Informatika - Institut Teknologi Bandung",
      experience: "6 tahun",
      image: null
    },
    {
      name: "Dewi Anggraeni, S.Sos.",
      position: "Pustakawan Layanan",
      department: "layanan",
      email: "dewi.anggraeni@perpusnas.go.id",
      expertise: "User Service, Collection Access, Research Guidance", 
      education: "S1 Ilmu Perpustakaan - Universitas Padjadjaran",
      experience: "7 tahun",
      image: null
    },
    {
      name: "Dr. Hendra Wijaya, M.A.",
      position: "Konservator Senior",
      department: "konservasi",
      email: "hendra.wijaya@perpusnas.go.id",
      expertise: "Chemical Conservation, Material Science, Preventive Conservation",
      education: "S3 Material Science - Universitas Indonesia",
      experience: "18 tahun", 
      image: null
    }
  ]

  const departments = [
    { id: 'semua', label: 'Semua Departemen' },
    { id: 'manajemen', label: 'Manajemen' },
    { id: 'konservasi', label: 'Konservasi & Digitalisasi' },
    { id: 'layanan', label: 'Layanan Pengguna' }
  ]

  const filteredStaff = selectedDept === 'semua' 
    ? staffData 
    : staffData.filter(staff => staff.department === selectedDept)

  return (
    <section style={{ 
      padding: '3rem 2rem',
      backgroundColor: '#f7fafc',
      minHeight: '60vh'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ 
            color: '#2d3748', 
            marginBottom: '1rem',
            fontSize: '2rem',
            fontWeight: '700'
          }}>
            Tim Profesional Kami
          </h2>
          <p style={{ 
            color: '#718096', 
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Bertugas melayani kebutuhan penelitian, preservasi, dan akses koleksi langka
          </p>
          
          {/* Department Filter */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            marginTop: '2rem'
          }}>
            {departments.map(dept => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: selectedDept === dept.id ? '#4299e1' : 'white',
                  color: selectedDept === dept.id ? 'white' : '#4a5568',
                  border: '1px solid #e2e8f0',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '2rem'
        }}>
          {filteredStaff.map((person, index) => (
            <StaffCard key={person.email} person={person} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
