// components/profil/VisiMisi.js - UPDATED
export default function VisiMisi({ isMobile }) {
  return (
    <section style={{ 
      padding: isMobile ? '2rem 1rem' : '3rem 2rem', 
      maxWidth: '1000px', 
      margin: '0 auto',
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid #f1f5f9',
        textAlign: 'center',
        maxWidth: '800px',
        width: '100%',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'
      }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            fontSize: isMobile ? '3rem' : '4rem',
            color: '#4299e1',
            marginBottom: '0.5rem'
          }}>
            🎯
          </div>
          <h2 style={{ 
            color: '#2d3748',
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            margin: 0,
            lineHeight: '1.3'
          }}>
            Visi Perpustakaan Nasional
          </h2>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#4299e1',
            color: 'white',
            padding: '0.5rem 1.5rem',
            borderRadius: '25px',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            2025 – 2029
          </div>
        </div>

        {/* Visi Content */}
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '2px solid #e2e8f0'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            lineHeight: '1.7',
            color: '#2d3748',
            margin: 0,
            fontStyle: 'italic',
            fontWeight: '500'
          }}>
            "Menjadi perpustakaan yang transformatif dalam meningkatkan budaya baca dan literasi untuk mewujudkan bangsa bermartabat bersama Indonesia Maju menuju Indonesia Emas 2045."
          </p>
        </div>

        {/* Additional Info */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f0fff4',
          borderRadius: '8px',
          border: '1px solid #c6f6d5'
        }}>
          <p style={{
            margin: 0,
            color: '#22543d',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            lineHeight: '1.5',
            fontWeight: '500'
          }}>
            🌟 <strong>Fokus Transformasi:</strong> Penguatan budaya baca, literasi digital, dan preservasi khazanah nusantara
          </p>
        </div>
      </div>
    </section>
  )
}
