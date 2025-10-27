// components/profil/VisiMisi.js
export default function VisiMisi() {
  return (
    <section style={{ 
      padding: '3rem 2rem', 
      maxWidth: '1000px', 
      margin: '0 auto' 
    }}>
      <div style={{
        display: 'grid',
        gap: '3rem'
      }}>
        {/* Visi */}
        <div style={{
          backgroundColor: 'white',
          padding: '2.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #4299e1'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '2rem',
              backgroundColor: '#4299e1',
              color: 'white',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              👁️
            </div>
            <h2 style={{ 
              color: '#2d3748',
              fontSize: '1.75rem',
              fontWeight: '700',
              margin: 0
            }}>
              Visi
            </h2>
          </div>
          <p style={{
            fontSize: '1.2rem',
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
          padding: '2.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #48bb78'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '2rem',
              backgroundColor: '#48bb78',
              color: 'white',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              🎯
            </div>
            <h2 style={{ 
              color: '#2d3748',
              fontSize: '1.75rem',
              fontWeight: '700',
              margin: 0
            }}>
              Misi
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#f0fff4',
                borderRadius: '8px'
              }}>
                <span style={{
                  color: '#48bb78',
                  fontWeight: 'bold',
                  minWidth: '25px'
                }}>
                  {index + 1}.
                </span>
                <span style={{ color: '#22543d', lineHeight: '1.6' }}>
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
