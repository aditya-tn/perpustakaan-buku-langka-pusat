// components/profil/ContactCard.js
export default function ContactCard({ icon, title, content, subtitle }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'center',
      transition: 'transform 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-4px)'
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)'
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
