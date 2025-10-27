// components/profil/StaffCard.js - SIMPLER VERSION
export default function StaffCard({ person, index, isMobile }) {
  const departmentColors = {
    manajemen: '#4299e1',
    layanan: '#48bb78'
  }

  const departmentLabels = {
    manajemen: 'Manajemen',
    layanan: 'Layanan Pengguna'
  }

  // Simple function to get first two letters of first name
  const getSimpleInitials = (fullName) => {
    // Take only the first two words (first name and last name)
    const nameParts = fullName.split(' ').slice(0, 2);
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0][0].toUpperCase();
    }
    return 'US';
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1.5rem' : '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      borderTop: `4px solid ${departmentColors[person.department]}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-4px)'
      e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)'
      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
    }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          width: isMobile ? '60px' : '80px',
          height: isMobile ? '60px' : '80px',
          borderRadius: '50%',
          backgroundColor: departmentColors[person.department] + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '1.5rem' : '2rem',
          color: departmentColors[person.department],
          fontWeight: 'bold',
          flexShrink: 0,
          border: `2px solid ${departmentColors[person.department]}20`
        }}>
          {getSimpleInitials(person.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            color: '#2d3748',
            margin: '0 0 0.5rem 0',
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: '600',
            lineHeight: '1.3'
          }}>
            {person.name}
          </h3>
          <div style={{
            display: 'inline-block',
            backgroundColor: departmentColors[person.department] + '20',
            color: departmentColors[person.department],
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600'
          }}>
            {departmentLabels[person.department]}
          </div>
        </div>
      </div>

      {/* Position */}
      <p style={{ 
        color: '#4299e1',
        fontWeight: '600',
        margin: '0 0 1rem 0',
        fontSize: isMobile ? '0.8rem' : '0.9rem',
        lineHeight: '1.4'
      }}>
        {person.position}
      </p>

      {/* Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <strong style={{ 
            color: '#4a5568', 
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            display: 'block',
            marginBottom: '0.25rem'
          }}>
            Pendidikan:
          </strong>
          <p style={{ 
            color: '#718096', 
            margin: 0, 
            fontSize: isMobile ? '0.75rem' : '0.8rem', 
            lineHeight: '1.5' 
          }}>
            {person.education}
          </p>
        </div>

        <div>
          <strong style={{ 
            color: '#4a5568', 
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            display: 'block',
            marginBottom: '0.25rem'
          }}>
            Pengalaman:
          </strong>
          <p style={{ 
            color: '#718096', 
            margin: 0, 
            fontSize: isMobile ? '0.75rem' : '0.8rem' 
          }}>
            {person.experience}
          </p>
        </div>
      </div>
    </div>
  )
}
