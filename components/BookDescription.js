// components/BookDescription.js - CLEAN VERSION
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
    <div style={{ display: 'inline-block', position: 'relative' }}>
      {/* Clean Info Button */}
      <button
        onClick={generateDescription}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={loading}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: description ? '#4299e1' : '#e2e8f0',
          color: description ? 'white' : '#4a5568',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.6 : 1,
          marginLeft: '0.5rem'
        }}
        title="Deskripsi Kontekstual"
      >
        {loading ? '⋯' : 'i'}
      </button>
      
      {/* Simple Tooltip */}
      {showTooltip && !description && (
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
          marginTop: '0.5rem'
        }}>
          Deskripsi kontekstual
        </div>
      )}
      
      {/* Floating Description Box */}
      {description && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '380px',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.25rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 1001,
          marginTop: '0.75rem'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem'
          }}>
            <h4 style={{ 
              margin: '0',
              color: '#2d3748',
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              Deskripsi Kontekstual
            </h4>
            <button
              onClick={() => setDescription(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: '#718096',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
          
          {/* Description Content */}
          <div style={{ 
            marginBottom: '1rem',
            lineHeight: '1.5',
            color: '#4a5568',
            fontSize: '0.9rem'
          }}>
            {description.description}
          </div>
          
          {/* Metadata */}
          <div style={{
            padding: '0.875rem',
            backgroundColor: '#f7fafc',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#4a5568',
            marginBottom: '0.75rem'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem'
            }}>
              <div>Era: {description.characteristics.era}</div>
              <div>Bahasa: {description.characteristics.languageLabel}</div>
              <div>Topik: {description.characteristics.topics.join(', ')}</div>
              {description.characteristics.year && (
                <div>Tahun: {description.characteristics.year}</div>
              )}
            </div>
          </div>

          {/* Clean Rule-Based Notification */}
          <div style={{
            fontSize: '0.75rem',
            color: '#718096',
            textAlign: 'center',
            padding: '0.5rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            Deskripsi dibuat oleh sistem komputer • Tingkat kepercayaan: {Math.round(description.confidence * 100)}%
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '300px',
          backgroundColor: '#fed7d7',
          border: '1px solid #feb2b2',
          borderRadius: '6px',
          padding: '0.875rem',
          color: '#c53030',
          fontSize: '0.8rem',
          marginTop: '0.75rem',
          zIndex: 1001
        }}>
          <div style={{ marginBottom: '0.25rem' }}>Error</div>
          {error}
        </div>
      )}
    </div>
  );
};

export default BookDescription;
