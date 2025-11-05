// components/BookDescription.js - FIXED DISPLAY
import { useState } from 'react';
import { generateRuleBasedDescription } from '../utils/ruleBasedDescriptions';

const BookDescription = ({ book }) => {
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateDescription = async () => {
    setLoading(true);
    setError(null);
    setDescription(null);
    
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
    <div className="book-description">
      <button
        onClick={generateDescription}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: loading ? '#cbd5e0' : '#4299e1',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease'
        }}
      >
        {loading ? '⏳' : '🤖'} 
        {loading ? 'Menganalisis...' : 'Deskripsi Kontekstual'}
      </button>
      
      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#fed7d7',
          border: '1px solid #feb2b2',
          borderRadius: '6px',
          color: '#c53030',
          fontSize: '0.8rem'
        }}>
          {error}
        </div>
      )}
      
      {description && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f0fff4',
          border: '1px solid #9ae6b4',
          borderRadius: '8px',
          fontSize: '0.9rem',
          lineHeight: '1.5'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <strong style={{ color: '#22543d' }}>📚 Deskripsi Kontekstual</strong>
            <span style={{
              fontSize: '0.7rem',
              backgroundColor: description.confidence > 0.7 ? '#48bb78' : '#ed8936',
              color: 'white',
              padding: '0.2rem 0.5rem',
              borderRadius: '10px',
              fontWeight: '600'
            }}>
              {Math.round(description.confidence * 100)}% confidence
            </span>
          </div>
          
          <p style={{ 
            margin: '0 0 0.75rem 0',
            color: '#2d3748'
          }}>
            {description.description}
          </p>
          
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(154, 230, 180, 0.2)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#2d3748'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Analisis Buku:</div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.5rem',
              fontSize: '0.7rem'
            }}>
              <div>
                <span style={{ color: '#718096' }}>Era: </span>
                <strong>{description.characteristics.era}</strong>
              </div>
              <div>
                <span style={{ color: '#718096' }}>Bahasa: </span>
                <strong>{description.characteristics.languageLabel}</strong>
              </div>
              <div>
                <span style={{ color: '#718096' }}>Topik: </span>
                <strong>{description.characteristics.topics.join(', ')}</strong>
              </div>
              {description.characteristics.year && (
                <div>
                  <span style={{ color: '#718096' }}>Tahun: </span>
                  <strong>{description.characteristics.year}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDescription;
