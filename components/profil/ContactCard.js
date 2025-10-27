// components/profil/ContactCard.js - UPDATED
export default function ContactCard({ icon, title, content, subtitle, link }) {
  const handleClick = () => {
    if (link) {
      window.open(link, '_blank')
    }
  }

  return (
    <div 
      style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
        transition: 'transform 0.3s ease',
        cursor: link ? 'pointer' : 'default',
        border: link ? '2px solid #4299e1' : '1px solid #e2e8f0'
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
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        {icon}
      </div>
      <h4 style={{ 
        color: '#2d3748',
        marginBottom: '0.5rem',
        fontWeight: '600'
      }}>
        {title}
        {link && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>↗</span>}
      </h4>
      <p style={{ 
        color: '#4299e1',
        fontWeight: '600',
        margin: '0 0 0.5rem 0',
        fontSize: '1.1rem'
      }}>
        {content}
      </p>
      {subtitle && (
        <p style={{ 
          color: '#718096',
          margin: 0,
          fontSize: '0.9rem'
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
