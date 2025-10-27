// components/profil/TentangKami.js - UPDATED
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
              <strong>Layanan Koleksi Buku Langka</strong> merupakan unit layanan di bawah 
              Perpustakaan Nasional Republik Indonesia yang memberikan akses langsung bagi 
              masyarakat terhadap koleksi buku langka yang bernilai historis dan ilmiah.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              Melalui layanan ini, pengguna dapat menelusuri informasi koleksi, mengajukan 
              permohonan baca di tempat, serta memperoleh pendampingan dari pustakawan 
              dalam meneliti atau menelaah isi buku langka.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              Kami berkomitmen memberikan pelayanan yang profesional, ramah, dan tertib, 
              agar masyarakat dapat memanfaatkan khazanah pustaka nasional dengan nyaman, 
              tanpa mengurangi keamanan dan keutuhan fisik koleksi.
            </p>
            <p>
              Layanan ini menjadi jembatan antara warisan pengetahuan masa lalu dan 
              kebutuhan informasi masa kini — menghadirkan kembali nilai-nilai literasi 
              yang abadi untuk generasi penerus bangsa.
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
            Statistik Layanan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <StatItem number="85,000+" label="Total Koleksi Buku Langka" />
            <StatItem number="200+" label="Tahun Sejarah Tercakup" />
            <StatItem number="50+" label="Bahasa yang Tersedia" />
            <StatItem number="1,200+" label="Peneliti per Tahun" />
            <StatItem number="500+" label="Kunjungan per Tahun" />
            <StatItem number="7" label="Tim Profesional" />
          </div>
        </div>
      </div>
    </section>
  )
}
