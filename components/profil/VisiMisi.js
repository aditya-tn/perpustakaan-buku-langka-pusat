// components/profil/VisiMisi.js - OPTIMIZED
export default function VisiMisi({ isMobile }) {
  return (
    <section style={{ 
      padding: isMobile ? '2rem 1rem' : '3rem 2rem', 
      maxWidth: '1000px', 
      margin: '0 auto',
      minHeight: '60vh'
    }}>
      <div style={{
        display: 'grid',
        gap: isMobile ? '2rem' : '3rem'
      }}>
        {/* Visi */}
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '1.5rem' : '2.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #4299e1',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)'
        }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              backgroundColor: '#4299e1',
              color: 'white',
              width: isMobile ? '50px' : '60px',
              height: isMobile ? '50px' : '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              👁️
            </div>
            <h2 style={{ 
              color: '#2d3748',
              fontSize: isMobile ? '1.25rem' : '1.75rem',
              fontWeight: '700',
              margin: 0,
              lineHeight: '1.3'
            }}>
              Visi
            </h2>
          </div>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1.1rem',
            lineHeight: '1.7',
            color: '#4a5568',
            margin: 0,
            fontStyle: 'italic'
          }}>
            "Menjadi pusat preservasi dan akses koleksi buku langka terdepan di Asia Tenggara 
            yang melestarikan memori kolektif bangsa Indonesia untuk generasi sekarang dan mendatang."
          </p>
        </div>

        {/* Misi */}
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '1.5rem' : '2.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #48bb78',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)'
        }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              backgroundColor: '#48bb78',
              color: 'white',
              width: isMobile ? '50px' : '60px',
              height: isMobile ? '50px' : '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              🎯
            </div>
            <h2 style={{ 
              color: '#2d3748',
              fontSize: isMobile ? '1.25rem' : '1.75rem',
              fontWeight: '700',
              margin: 0,
              lineHeight: '1.3'
            }}>
              Misi
            </h2>
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem' 
          }}>
            {[
              "Melestarikan dan mengonservasi koleksi buku langka melalui standar preservasi internasional",
              "Mendigitalisasi koleksi untuk memastikan aksesibilitas dan keberlanjutan",
              "Menyediakan akses penelitian yang komprehensif bagi akademisi dan masyarakat",
              "Mengembangkan sistem manajemen koleksi yang terintegrasi dan modern",
              "Mempromosikan warisan literasi Indonesia melalui pameran dan publikasi"
            ].map((misi, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#f0fff4',
                borderRadius: '6px',
                border: '1px solid #c6f6d5'
              }}>
                <span style={{
                  color: '#48bb78',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  fontSize: isMobile ? '0.8rem' : '0.9rem'
                }}>
                  {index + 1}.
                </span>
                <span style={{ 
                  color: '#22543d', 
                  lineHeight: '1.5',
                  fontSize: isMobile ? '0.8rem' : '0.9rem'
                }}>
                  {misi}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
