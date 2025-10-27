// components/profil/StaffCard.js - UPDATED
export default function StaffCard({ person, index }) {
  const departmentColors = {
    manajemen: '#4299e1',
    layanan: '#48bb78'
  }

  const departmentLabels = {
    manajemen: 'Manajemen',
    layanan: 'Layanan Pengguna'
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      borderTop: `4px solid ${departmentColors[person.department]}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: departmentColors[person.department] + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: departmentColors[person.department],
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          {person.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            color: '#2d3748',
            margin: '0 0 0.5rem 0',
            fontSize: '1.25rem',
            fontWeight: '600',
            lineHeight: '1.4'
          }}>
            {person.name}
          </h3>
          <div style={{
            display: 'inline-block',
            backgroundColor: departmentColors[person.department] + '20',
            color: departmentColors[person.department],
            padding: '0.25rem 0.75rem',
            borderRadius: '15px',
            fontSize: '0.8rem',
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
        fontSize: '0.95rem',
        lineHeight: '1.4'
      }}>
        {person.position}
      </p>

      {/* Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <strong style={{ color: '#4a5568', fontSize: '0.9rem' }}>Pendidikan:</strong>
          <p style={{ color: '#718096', margin: '0.25rem 0 0 0', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {person.education}
          </p>
        </div>

        <div>
          <strong style={{ color: '#4a5568', fontSize: '0.9rem' }}>Pengalaman:</strong>
          <p style={{ color: '#718096', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            {person.experience}
          </p>
        </div>
      </div>
    </div>
  )
}
