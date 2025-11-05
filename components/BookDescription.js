// components/BookDescription.js - FLOATING VERSION
import { useState } from 'react';
import { generateRuleBasedDescription } from '../utils/ruleBasedDescriptions';

const BookDescription = ({ book }) => {
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const generateDescription = async () => {
    if (description) {
      setDescription(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Generating description for:', book?.judul);
      const result = generateRuleBasedDescription(book);
      
      if (result && result.description) {
        setDescription(result);
      } else {
        throw new Error('Invalid response from description generator');
      }
    } catch (err) {
      console.error('❌ Error generating description:', err);
      setError(`Gagal generate deskripsi. Silakan coba lagi.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-description" style={{ display: 'inline', position: 'relative' }}>
      {/* Floating Button di sebelah judul */}
      <button
        onClick={generateDescription}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={loading}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1.1rem',
          padding: '0.2rem 0.5rem',
          marginLeft: '0.5rem',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.6 : 1,
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Deskripsi Kontekstual"
      >
        {loading ? '⏳' : description ? '📚' : '💡'}
        
        {/* Tooltip */}
        {showTooltip && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#2d3748',
            color: 'white',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            marginTop: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {description ? 'Sembunyikan deskripsi' : 'Tampilkan deskripsi kontekstual'}
            <div style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '4px solid #2d3748'
            }} />
          </div>
        )}
      </button>
      
      {/* Floating Description Box */}
      {description && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 1000,
          marginTop: '0.5rem',
          maxWidth: '400px',
          fontSize: '0.85rem',
          lineHeight: '1.5'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.75rem'
          }}>
            <strong style={{ color: '#22543d' }}>📚 Deskripsi Kontekstual</strong>
            <button
              onClick={() => setDescription(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                color: '#718096',
                padding: '0'
              }}
            >
              ✕
            </button>
          </div>
          
          <p style={{ 
            margin: '0 0 0.75rem 0',
            color: '#2d3748'
          }}>
            {description.description}
          </p>
          
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f7fafc',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#4a5568'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span><strong>Era:</strong> {description.characteristics.era}</span>
              <span><strong>Bahasa:</strong> {description.characteristics.languageLabel}</span>
              <span><strong>Topik:</strong> {description.characteristics.topics.join(', ')}</span>
            </div>
            {description.characteristics.year && (
              <div style={{ marginTop: '0.25rem' }}>
                <strong>Tahun:</strong> {description.characteristics.year}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          backgroundColor: '#fed7d7',
          border: '1px solid #feb2b2',
          borderRadius: '6px',
          padding: '0.75rem',
          color: '#c53030',
          fontSize: '0.8rem',
          marginTop: '0.5rem',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default BookDescription;
