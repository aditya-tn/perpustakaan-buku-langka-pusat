// components/BookDescription.js
import { useState } from 'react';
import { generateRuleBasedDescription } from '../utils/ruleBasedDescriptions';

const BookDescription = ({ book }) => {
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateDescription = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Instant - no API call needed
      const result = generateRuleBasedDescription(book);
      setDescription(result);
    } catch (err) {
      setError('Gagal generate deskripsi. Silakan coba lagi.');
      console.error('Error generating description:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageLabel = (lang) => {
    const labels = {
      'id': 'Indonesia',
      'nl': 'Belanda', 
      'jv': 'Jawa',
      'ar': 'Arab',
      'unknown': 'Tidak diketahui'
    };
    return labels[lang] || lang;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.7) return '#48bb78'; // green
    if (confidence > 0.5) return '#ed8936'; // orange
    return '#e53e3e'; // red
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
          transition: 'all 0.2s ease',
          opacity: loading ? 0.7 : 1
        }}
        onMouseOver={(e) => {
          if (!loading) e.target.style.backgroundColor = '#3182ce';
        }}
        onMouseOut={(e) => {
          if (!loading) e.target.style.backgroundColor = '#4299e1';
        }}
      >
        {loading ? (
          <>
            <span>⏳</span>
            <span>Menganalisis...</span>
          </>
        ) : (
          <>
            <span>🤖</span>
            <span>Deskripsi Kontekstual</span>
          </>
        )}
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
              backgroundColor: getConfidenceColor(description.confidence),
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
                <strong>{getLanguageLabel(description.characteristics.language)}</strong>
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
          
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.65rem',
            color: '#718096',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            Generated by Rule-Based System • Zero Cost • Instant Response
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDescription;
