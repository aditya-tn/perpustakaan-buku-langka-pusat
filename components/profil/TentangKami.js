// components/profil/TentangKami.js - OPTIMIZED
const StatItem = ({ number, label, isMobile }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0.75rem' : '1rem',
    padding: isMobile ? '0.75rem' : '1rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    transition: 'transform 0.2s ease',
    cursor: 'default'
  }}
  onMouseEnter={(e) => {
    e.target.style.transform = 'translateY(-2px)'
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = 'translateY(0)'
  }}
  >
    <div style={{
      fontSize: isMobile ? '1.25rem' : '1.5rem',
      fontWeight: '800',
      color: '#4299e1',
      minWidth: isMobile ? '60px' : '80px',
      textAlign: 'center'
    }}>
      {number}
    </div>
    <div style={{ 
      color: '#4a5568', 
      fontWeight: '500',
      fontSize: isMobile ? '0.8rem' : '0.9rem',
      lineHeight: '1.4'
    }}>
      {label}
    </div>
  </div>
)

export default function TentangKami({ isMobile }) {
  return (
    <section style={{ 
      padding: isMobile ? '2rem 1rem' : '3rem 2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '60vh'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: isMobile ? '2rem' : '3rem',
        alignItems: 'start'
      }}>
        <div>
          <h2 style={{ 
            color: '#2d3748', 
            marginBottom: '1.5rem',
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            lineHeight: '1.3'
          }}>
            Tentang Layanan Kami
          </h2>
          <div style={{ 
            lineHeight: '1.7', 
            color: '#4a5568', 
            fontSize: isMobile ? '0.9rem' : '1rem' 
          }}>
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
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600'
          }}>
            Statistik Layanan
          </h3>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem' 
          }}>
            <StatItem number="85,000+" label="Total Koleksi Buku Langka" isMobile={isMobile} />
            <StatItem number="200+" label="Tahun Sejarah Tercakup" isMobile={isMobile} />
            <StatItem number="50+" label="Bahasa yang Tersedia" isMobile={isMobile} />
            <StatItem number="1,200+" label="Peneliti per Tahun" isMobile={isMobile} />
            <StatItem number="500+" label="Kunjungan per Tahun" isMobile={isMobile} />
            <StatItem number="7" label="Tim Profesional" isMobile={isMobile} />
          </div>
        </div>
      </div>
    </section>
  )
}
