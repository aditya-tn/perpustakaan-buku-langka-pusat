// components/BookDescription.js - UPDATED FOR IN-PLACE ANIMATION
import { useState, useEffect } from 'react';
import { generateRuleBasedDescription } from '../utils/ruleBasedDescriptions';

const BookDescription = ({ book, onClose, autoOpen = false }) => {
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(0);

  // Auto-generate description ketika component mount
  useEffect(() => {
    if (autoOpen && !description) {
      generateDescription(0);
    }
  }, [autoOpen]);

  const generateDescription = async (templateIndex = 0) => {
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
        setDescription({
          description: result.data.deskripsi_buku,
          confidence: result.data.deskripsi_confidence || 0.95,
          source: 'ai-enhanced',
          characteristics: description?.characteristics || {},
          metadata: {
            ...description?.metadata,
            aiGenerated: true,
            savedToDb: true,
            source: result.source
          }
        });
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

  // Styles untuk in-place description (bukan modal)
  const styles = {
    container: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '8px',
      animation: 'fadeIn 0.3s ease-in-out'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '0.75rem'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#718096',
      padding: '0',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: '#f7fafc',
      transition: 'all 0.2s ease'
    },
    content: {
      lineHeight: '1.6',
      color: '#4a5568',
      fontSize: '0.9rem',
      marginBottom: '1rem'
    },
    metadataBox: {
      padding: '0.875rem',
      backgroundColor: '#f7fafc',
      borderRadius: '6px',
      fontSize: '0.8rem',
      color: '#4a5568',
      marginBottom: '0.75rem'
    },
    actionBox: {
      padding: '0.75rem',
      backgroundColor: '#f7fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: '0.75rem',
      color: '#718096',
      textAlign: 'center'
    },
    aiButton: {
      width: '100%',
      padding: '0.5rem',
      backgroundColor: '#48bb78',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '0.75rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      marginTop: '0.5rem'
    },
    errorBox: {
      backgroundColor: '#fed7d7',
      border: '1px solid #feb2b2',
      borderRadius: '6px',
      padding: '0.875rem',
      color: '#c53030',
      fontSize: '0.8rem',
      marginTop: '0.75rem'
    },
    sourceBadge: {
      display: 'inline-block',
      backgroundColor: '#edf2f7',
      color: '#4a5568',
      fontSize: '0.7rem',
      padding: '0.2rem 0.5rem',
      borderRadius: '4px',
      marginLeft: '0.5rem',
      fontWeight: '500'
    }
  };

  // Loading state
  if (loading && !description) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳</div>
          <p>Membuat deskripsi kontekstual...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header - SELALU tampilkan judul buku */}
      <div style={styles.header}>
        <div>
          <h4 style={{ 
            margin: '0 0 0.25rem 0',
            color: '#2d3748',
            fontSize: '1.1rem',
            fontWeight: '600',
            lineHeight: '1.3'
          }}>
            {book?.judul || 'Deskripsi Buku'}
          </h4>
          <div style={{ fontSize: '0.8rem', color: '#718096' }}>
            {description?.source === 'ai-enhanced' ? (
              <span>
                🤖 Deskripsi AI
                <span style={styles.sourceBadge}>Enhanced</span>
              </span>
            ) : (
              <span>
                📚 Deskripsi Kontekstual
                <span style={styles.sourceBadge}>Sistem</span>
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Template Cycle Button - hanya untuk rule-based */}
          {description?.source !== 'ai-enhanced' && (
            <button
              onClick={cycleTemplate}
              data-no-close="true"
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
          
          {/* Close Button */}
          <button
            onClick={onClose}
            data-no-close="true"
            style={styles.closeButton}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#f7fafc'}
            title="Tutup deskripsi dan kembali ke katalog"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Description Content */}
      <div style={styles.content}>
        {description?.description || 'Deskripsi tidak tersedia'}
      </div>
      
      {/* Metadata */}
      {description && (
        <>
          <div style={styles.metadataBox}>
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
              {description.source === 'ai-enhanced' && '🤖 Enhanced by AI'}
            </div>
          </div>

          {/* Notification + AI Button */}
          <div style={{
            ...styles.actionBox,
            backgroundColor: description.source === 'ai-enhanced' ? '#f0fff4' : '#f7fafc',
            border: description.source === 'ai-enhanced' ? '1px solid #9ae6b4' : '1px solid #e2e8f0',
            color: description.source === 'ai-enhanced' ? '#2f855a' : '#718096'
          }}>
            <div style={{ 
              marginBottom: description.source === 'ai-enhanced' ? '0' : '0.5rem',
              lineHeight: '1.4'
            }}>
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
                data-no-close="true"
                style={{
                  ...styles.aiButton,
                  opacity: aiLoading ? 0.6 : 1,
                  cursor: aiLoading ? 'not-allowed' : 'pointer'
                }}
                onMouseOver={(e) => !aiLoading && (e.target.style.backgroundColor = '#38a169')}
                onMouseOut={(e) => !aiLoading && (e.target.style.backgroundColor = '#48bb78')}
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
        </>
      )}
      
      {/* Error Message */}
      {error && (
        <div style={styles.errorBox}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Error</div>
          {error}
          <button
            onClick={() => setError(null)}
            data-no-close="true"
            style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      )}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { 
              opacity: 0; 
              transform: translateY(10px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
        `}
      </style>
    </div>
  );
};

export default BookDescription;