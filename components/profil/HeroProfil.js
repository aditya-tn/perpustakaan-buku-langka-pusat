// components/profil/HeroProfil.js
export default function HeroProfil() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '4rem 2rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: '800', 
          marginBottom: '1rem',
          lineHeight: '1.2'
        }}>
          Profil Layanan Koleksi Buku Langka
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          opacity: 0.9,
          lineHeight: '1.6',
          marginBottom: '0'
        }}>
          Menjaga 85.000+ warisan literasi Nusantara untuk generasi mendatang
        </p>
      </div>
    </section>
  )
}
