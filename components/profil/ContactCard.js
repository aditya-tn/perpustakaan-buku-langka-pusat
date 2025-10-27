// components/profil/ContactCard.js - OPTIMIZED
export default function ContactCard({ icon, title, content, subtitle, link, isMobile }) {
  const handleClick = () => {
    if (link) {
      window.open(link, '_blank')
    }
  }

  return (
    <div 
      style={{
        backgroundColor: 'white',
        padding: isMobile ? '1.5rem' : '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: link ? 'pointer' : 'default',
        border: link ? '2px solid #4299e1' : '1px solid #e2e8f0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (link) {
          e.target.style.transform = 'translateY(-4px)'
          e.target.style.boxShadow = '0 8px 25px rgba(66, 153, 225, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (link) {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
        }
      }}
    >
      <div style={{ 
        fontSize: isMobile ? '2.5rem' : '3rem', 
        marginBottom: '1rem' 
      }}>
        {icon}
      </div>
      <h4 style={{ 
        color: '#2d3748',
        marginBottom: '0.5rem',
        fontWeight: '600',
        fontSize: isMobile ? '1rem' : '1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem'
      }}>
        {title}
        {link && <span style={{ fontSize: '0.8rem', color: '#4299e1' }}>↗</span>}
      </h4>
      <p style={{ 
        color: '#4299e1',
        fontWeight: '600',
        margin: '0 0 0.5rem 0',
        fontSize: isMobile ? '0.9rem' : '1rem',
        lineHeight: '1.3',
        wordBreak: 'break-word'
      }}>
        {content}
      </p>
      {subtitle && (
        <p style={{ 
          color: '#718096',
          margin: 0,
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          lineHeight: '1.4'
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
