// components/BookDescription.js - FINAL INTEGRATED VERSION
import { useState } from 'react';
import { generateRuleBasedDescription } from '../utils/ruleBasedDescriptions';

const BookDescription = ({ book }) => {
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(0);

  const generateDescription = async (templateIndex = 0) => {
    if (description && templateIndex === currentTemplate) {
      setDescription(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const bookWithTemplate = { ...book, _templateVariant: templateIndex };
      const result = generateRuleBasedDescription(bookWithTemplate);
      
      if (result && result.description) {
        setDescription(result);
        setCurrentTemplate(templateIndex);
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

  const askAIForBetterDescription = async () => {
    if (!book?.id) {
      setError('Book ID tidak tersedia');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      // Gunakan API route baru yang terintegrasi dengan system Gemini Anda
      const response = await fetch('/api/generate-ai-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
          bookTitle: book.judul,
          bookYear: book.tahun_terbit,
          bookAuthor: book.pengarang,
          currentDescription: description?.description
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memproses permintaan AI');
      }

      if (result.success && result.data) {
        // Update state dengan hasil AI yang sudah disimpan ke database
        setDescription({
          description: result.data.deskripsi_buku,
          confidence: result.data.deskripsi_confidence || 0.95,
          source: 'ai-enhanced',
          characteristics: description?.characteristics || {},
          metadata: {
            ...description?.metadata,
            aiGenerated: true,
            savedToDb: true,
            source: result.source // 'database-cache' atau 'ai-generated'
          }
        });

        console.log('✅ AI description:', result.source);
      }
    } catch (err) {
      console.error('❌ Error asking AI:', err);
      setError(`Gagal mendapatkan deskripsi AI: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const cycleTemplate = () => {
    const nextTemplate = (currentTemplate + 1) % 3;
    generateDescription(nextTemplate);
  };

  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      {/* Clean Info Button */}
      <button
        onClick={() => generateDescription(0)}
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
          width: '420px',
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
              {description.source === 'ai-enhanced' ? '🤖 Deskripsi AI' : '📚 Deskripsi Kontekstual'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Template Cycle Button - hanya untuk rule-based */}
              {description.source !== 'ai-enhanced' && (
                <button
                  onClick={cycleTemplate}
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    color: '#4a5568',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f7fafc'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                  title="Ganti template deskripsi"
                >
                  🔄
                </button>
              )}
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
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <div><strong>Era:</strong> {description.characteristics.era}</div>
              <div><strong>Bahasa:</strong> {description.characteristics.languageLabel}</div>
              <div><strong>Topik:</strong> {description.characteristics.topics.join(', ')}</div>
              {description.characteristics.year && (
                <div><strong>Tahun:</strong> {description.characteristics.year}</div>
              )}
            </div>
            
            {/* Source Indicator */}
            <div style={{ 
              fontSize: '0.7rem', 
              color: '#718096',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              {description.metadata?.source === 'database-cache' && '📀 Diambil dari cache database'}
              {description.metadata?.source === 'ai-generated' && '🔄 Baru digenerate oleh AI'}
            </div>
          </div>

          {/* Notification + AI Button */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: description.source === 'ai-enhanced' ? '#f0fff4' : '#f7fafc',
            border: description.source === 'ai-enhanced' ? '1px solid #9ae6b4' : '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: description.source === 'ai-enhanced' ? '#2f855a' : '#718096',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: description.source === 'ai-enhanced' ? '0' : '0.5rem' }}>
              {description.source === 'ai-enhanced' ? (
                '✅ Deskripsi AI tersimpan di database'
              ) : (
                `Deskripsi dibuat oleh sistem komputer • Tingkat kepercayaan: ${Math.round(description.confidence * 100)}%`
              )}
            </div>
            
            {description.source !== 'ai-enhanced' && (
              <button
                onClick={askAIForBetterDescription}
                disabled={aiLoading}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#48bb78',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  opacity: aiLoading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!aiLoading) e.target.style.backgroundColor = '#38a169';
                }}
                onMouseOut={(e) => {
                  if (!aiLoading) e.target.style.backgroundColor = '#48bb78';
                }}
              >
                {aiLoading ? (
                  <>
                    <span>⏳</span>
                    Memproses AI...
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    Tanya AI untuk hasil lebih akurat
                  </>
                )}
              </button>
            )}
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
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Error</div>
          {error}
        </div>
      )}
    </div>
  );
};

export default BookDescription;