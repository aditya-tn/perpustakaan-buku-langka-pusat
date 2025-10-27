// components/profil/StaffCard.js - FIXED BOUNCE EFFECT
export default function StaffCard({ person, index, isMobile }) {
  const departmentColors = {
    manajemen: '#4299e1',
    layanan: '#48bb78'
  }

  const departmentLabels = {
    manajemen: 'Manajemen',
    layanan: 'Layanan Pengguna'
  }

  // Function to get initials without degrees/titles
  const getInitials = (fullName) => {
    // Remove common degrees and titles
    const cleanedName = fullName
      .replace(/, S\.S/g, '')
      .replace(/, S\.E\./g, '')
      .replace(/, M\.P\./g, '')
      .replace(/, S\.Hum/g, '')
      .replace(/, M\.Hum\./g, '')
      .replace(/, S\.S\./g, '')
      .replace(/, MTCSOL/g, '')
      .replace(/, S\.S\.I/g, '')
      .replace(/, A\.Md/g, '')
      .replace(/, S\.H/g, '')
      .replace(/, M\./g, '')
      .trim();
    
    // Get initials from cleaned name
    const nameParts = cleanedName.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0][0].toUpperCase();
    }
    return 'US';
  }

  return (
    <div 
      style={{
        backgroundColor: 'white',
        padding: isMobile ? '1.5rem' : '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderTop: `4px solid ${departmentColors[person.department]}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      {/* Subtle background gradient on hover */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${departmentColors[person.department]}, ${departmentColors[person.department]}80)`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none'
      }}
      onMouseEnter={(e) => {
        e.target.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.target.style.opacity = '0';
      }}
      />
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.25rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          width: isMobile ? '60px' : '80px',
          height: isMobile ? '60px' : '80px',
          borderRadius: '50%',
          backgroundColor: departmentColors[person.department] + '15',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '1.5rem' : '2rem',
          color: departmentColors[person.department],
          fontWeight: 'bold',
          flexShrink: 0,
          border: `2px solid ${departmentColors[person.department]}25`,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        >
          {getInitials(person.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            color: '#2d3748',
            margin: '0 0 0.5rem 0',
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: '600',
            lineHeight: '1.3',
            wordWrap: 'break-word',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = departmentColors[person.department];
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#2d3748';
          }}
          >
            {person.name}
          </h3>
          <div style={{
            display: 'inline-block',
            backgroundColor: departmentColors[person.department] + '15',
            color: departmentColors[person.department],
            padding: '0.3rem 0.8rem',
            borderRadius: '20px',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600',
            border: `1px solid ${departmentColors[person.department]}30`,
            transition: 'all 0.3s ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = departmentColors[person.department];
            e.target.style.color = 'white';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = departmentColors[person.department] + '15';
            e.target.style.color = departmentColors[person.department];
            e.target.style.transform = 'scale(1)';
          }}
          >
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
        lineHeight: '1.4',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 2
      }}
      onMouseEnter={(e) => {
        e.target.style.color = '#2b6cb0';
        e.target.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.target.style.color = '#4299e1';
        e.target.style.transform = 'translateX(0)';
      }}
      >
        {person.position}
      </p>

      {/* Details */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateX(4px)';
          e.target.style.paddingLeft = '0.5rem';
          e.target.style.borderLeft = `3px solid ${departmentColors[person.department]}`;
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateX(0)';
          e.target.style.paddingLeft = '0';
          e.target.style.borderLeft = 'none';
        }}
        >
          <strong style={{ 
            color: '#4a5568', 
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            display: 'block',
            marginBottom: '0.25rem',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = departmentColors[person.department];
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#4a5568';
          }}
          >
            Pendidikan:
          </strong>
          <p style={{ 
            color: '#718096', 
            margin: 0, 
            fontSize: isMobile ? '0.75rem' : '0.8rem', 
            lineHeight: '1.5',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#4a5568';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#718096';
          }}
          >
            {person.education}
          </p>
        </div>

        <div style={{
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateX(4px)';
          e.target.style.paddingLeft = '0.5rem';
          e.target.style.borderLeft = `3px solid ${departmentColors[person.department]}`;
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateX(0)';
          e.target.style.paddingLeft = '0';
          e.target.style.borderLeft = 'none';
        }}
        >
          <strong style={{ 
            color: '#4a5568', 
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            display: 'block',
            marginBottom: '0.25rem',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = departmentColors[person.department];
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#4a5568';
          }}
          >
            Pengalaman:
          </strong>
          <p style={{ 
            color: '#718096', 
            margin: 0, 
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#4a5568';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#718096';
          }}
          >
            {person.experience}
          </p>
        </div>
      </div>

      {/* Hover background effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${departmentColors[person.department]}08, ${departmentColors[person.department]}02)`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        borderRadius: '12px'
      }}
      onMouseEnter={(e) => {
        e.target.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.target.style.opacity = '0';
      }}
      />
    </div>
  )
}
