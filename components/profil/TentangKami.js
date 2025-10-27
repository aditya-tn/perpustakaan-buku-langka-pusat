// components/profil/TentangKami.js
const StatItem = ({ number, label }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  }}>
    <div style={{
      fontSize: '1.5rem',
      fontWeight: '800',
      color: '#4299e1',
      minWidth: '80px'
    }}>
      {number}
    </div>
    <div style={{ color: '#4a5568', fontWeight: '500' }}>
      {label}
    </div>
  </div>
)

export default function TentangKami() {
  return (
    <section style={{ 
      padding: '3rem 2rem', 
      maxWidth: '1200px', 
      margin: '0 auto' 
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '3rem',
        alignItems: 'start'
      }}>
        <div>
          <h2 style={{ 
            color: '#2d3748', 
            marginBottom: '1.5rem',
            fontSize: '2rem',
            fontWeight: '700'
          }}>
            Tentang Layanan Kami
          </h2>
          <div style={{ lineHeight: '1.8', color: '#4a5568', fontSize: '1.1rem' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              <strong>Layanan Koleksi Buku Langka Perpustakaan Nasional RI</strong> didirikan 
              pada tahun 1980 dengan misi melestarikan khazanah literatur Nusantara yang 
              tak ternilai harganya.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              Kami bertanggung jawab atas preservasi, konservasi, dan akses terhadap 
              lebih dari 85.000 koleksi buku langka, naskah kuno, dan dokumen bersejarah 
              yang mencakup periode dari abad ke-16 hingga modern.
            </p>
            <p>
              Layanan kami tidak hanya terbatas pada preservasi fisik, tetapi juga 
              digitalisasi dan aksesibilitas untuk peneliti, akademisi, dan masyarakat 
              umum yang tertarik dengan warisan literasi Indonesia.
            </p>
          </div>
        </div>
        
        <div>
          <h3 style={{ 
            color: '#2d3748', 
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Statistik Koleksi
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <StatItem number="85,000+" label="Total Koleksi Buku Langka" />
            <StatItem number="200+" label="Tahun Sejarah Tercakup" />
            <StatItem number="50+" label="Bahasa yang Tersedia" />
            <StatItem number="15,000+" label="Naskah Kuno Digital" />
            <StatItem number="1,200+" label="Peneliti per Tahun" />
            <StatItem number="500+" label="Koleksi Baru per Tahun" />
          </div>
        </div>
      </div>
    </section>
  )
}
