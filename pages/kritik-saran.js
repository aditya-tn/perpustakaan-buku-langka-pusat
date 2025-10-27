// pages/kritik-saran.js - ADVANCED FEEDBACK SYSTEM WITH SENTIMENT ANALYSIS
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function KritikSaran() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    kategori: 'umum',
    pesan: '',
    rating: 0
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [feedbacks, setFeedbacks] = useState([])
  const [filter, setFilter] = useState('semua')
  const [analysis, setAnalysis] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Enhanced sentiment analysis dengan vocabulary yang lebih kaya
  const analyzeSentiment = (text) => {
    const positiveWords = [
      'bagus', 'baik', 'mantap', 'puas', 'cepat', 'mudah', 'helpful', 'excellent', 
      'terima kasih', 'keren', 'luar biasa', 'memuaskan', 'profesional', 'responsif',
      'bermanfaat', 'inovasi', 'recommended', 'wow', 'keren', 'sangat baik'
    ]
    
    const negativeWords = [
      'buruk', 'jelek', 'lambat', 'sulit', 'ribet', 'error', 'gagal', 'kecewa',
      'tidak bisa', 'tidak ada', 'kosong', 'rusak', 'bug', 'masalah', 'komplain',
      'protes', 'mengecewakan', 'seharusnya', 'kurang', 'perlu perbaikan'
    ]
    
    const words = text.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(word => 
      positiveWords.some(positive => word.includes(positive))
    ).length
    
    const negativeCount = words.filter(word => 
      negativeWords.some(negative => word.includes(negative))
    ).length
    
    const totalRelevant = positiveCount + negativeCount
    
    if (totalRelevant === 0) return { 
      sentiment: 'neutral', 
      confidence: 30,
      reasons: ['Pesan netral tanpa kata kunci sentiment spesifik']
    }
    
    let sentiment, confidence
    if (positiveCount > negativeCount) {
      sentiment = 'positive'
      confidence = (positiveCount / totalRelevant) * 100
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative' 
      confidence = (negativeCount / totalRelevant) * 100
    } else {
      sentiment = 'neutral'
      confidence = 50
    }
    
    // Analyze reasons
    const reasons = []
    if (positiveCount > 0) reasons.push(`Ditemukan ${positiveCount} kata positif`)
    if (negativeCount > 0) reasons.push(`Ditemukan ${negativeCount} kata perlu perbaikan`)
    
    return { sentiment, confidence: Math.min(95, confidence), reasons }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const sentimentAnalysis = analyzeSentiment(formData.pesan)
    
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert([
          {
            ...formData,
            sentiment: sentimentAnalysis.sentiment,
            confidence: sentimentAnalysis.confidence,
            analysis_reasons: sentimentAnalysis.reasons,
            created_at: new Date().toISOString(),
            status: 'new'
          }
        ])
        .select()
      
      if (error) throw error
      
      setSubmitted(true)
      setFormData({ nama: '', email: '', kategori: 'umum', pesan: '', rating: 0 })
      setTimeout(() => setSubmitted(false), 5000)
      loadFeedbacks()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Terjadi error saat mengirim feedback. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const loadFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setFeedbacks(data || [])
      
      // Calculate comprehensive analytics
      const total = data.length
      const positive = data.filter(f => f.sentiment === 'positive').length
      const negative = data.filter(f => f.sentiment === 'negative').length
      const neutral = data.filter(f => f.sentiment === 'neutral').length
      const ratings = data.filter(f => f.rating > 0)
      const averageRating = ratings.length > 0 
        ? (ratings.reduce((acc, f) => acc + f.rating, 0) / ratings.length).toFixed(1)
        : 0
        
      const kategoriCount = data.reduce((acc, f) => {
        acc[f.kategori] = (acc[f.kategori] || 0) + 1
        return acc
      }, {})

      setAnalysis({
        total,
        positive,
        negative,
        neutral,
        averageRating,
        kategoriCount,
        satisfaction: total > 0 ? Math.round((positive / total) * 100) : 0
      })
    } catch (error) {
      console.error('Error loading feedbacks:', error)
    }
  }

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const filteredFeedbacks = filter === 'semua' 
    ? feedbacks 
    : feedbacks.filter(f => f.sentiment === filter)

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return '#48bb78'
      case 'negative': return '#f56565'
      default: return '#ed8936'
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  const getSentimentText = (sentiment) => {
    switch(sentiment) {
      case 'positive': return 'Positif'
      case 'negative': return 'Perlu Perbaikan'
      default: return 'Netral'
    }
  }

  const previewSentiment = formData.pesan ? analyzeSentiment(formData.pesan) : null

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Kritik & Saran - Perpustakaan Nasional RI</title>
        <meta name="description" content="Berikan masukan Anda untuk pengembangan layanan Perpustakaan Nasional RI" />
      </Head>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2.5rem 1rem' : '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Kritik & Saran
          </h1>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            opacity: 0.9,
            fontWeight: '300',
            lineHeight: '1.5'
          }}>
            Suara Anda membantu kami meningkatkan layanan Perpustakaan Nasional RI
          </p>
        </div>
      </section>

      {/* Analytics Dashboard */}
      {analysis && analysis.total > 0 && (
        <section style={{
          backgroundColor: 'white',
          padding: isMobile ? '1.5rem 1rem' : '2rem',
          margin: isMobile ? '1rem auto' : '2rem auto',
          maxWidth: '1200px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            marginBottom: '1.5rem', 
            color: '#2d3748',
            fontSize: isMobile ? '1.25rem' : '1.5rem'
          }}>
            📊 Dashboard Analisis Feedback
          </h3>
          
          {/* Main Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#ebf8ff', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#4299e1' }}>
                {analysis.total}
              </div>
              <div style={{ color: '#718096', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Total Feedback</div>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f0fff4', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#48bb78' }}>
                {analysis.satisfaction}%
              </div>
              <div style={{ color: '#718096', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Kepuasan</div>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fffaf0', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#ed8936' }}>
                {analysis.averageRating}/5
              </div>
              <div style={{ color: '#718096', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Rating Rata-rata</div>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fff5f5', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#f56565' }}>
                {analysis.negative}
              </div>
              <div style={{ color: '#718096', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Perlu Perhatian</div>
            </div>
          </div>

          {/* Sentiment Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0fff4',
              border: '2px solid #9ae6b4',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>😊</div>
              <div style={{ fontWeight: 'bold', color: '#22543d' }}>{analysis.positive} Positif</div>
              <div style={{ fontSize: '0.8rem', color: '#38a169' }}>
                {Math.round((analysis.positive / analysis.total) * 100)}%
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#fffaf0',
              border: '2px solid #fbd38d',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>😐</div>
              <div style={{ fontWeight: 'bold', color: '#744210' }}>{analysis.neutral} Netral</div>
              <div style={{ fontSize: '0.8rem', color: '#dd6b20' }}>
                {Math.round((analysis.neutral / analysis.total) * 100)}%
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#fff5f5',
              border: '2px solid #fc8181',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>😔</div>
              <div style={{ fontWeight: 'bold', color: '#742a2a' }}>{analysis.negative} Perlu Perbaikan</div>
              <div style={{ fontSize: '0.8rem', color: '#e53e3e' }}>
                {Math.round((analysis.negative / analysis.total) * 100)}%
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: isMobile ? '0 1rem' : '0 2rem',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '2rem' : '3rem'
      }}>
        
        {/* Form Section */}
        <div>
          <div style={{
            backgroundColor: 'white',
            padding: isMobile ? '1.5rem' : '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              marginBottom: '1.5rem', 
              color: '#2d3748',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>
              💬 Berikan Feedback Anda
            </h3>

            {submitted && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0fff4',
                border: '1px solid #9ae6b4',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                color: '#22543d',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>✅</span>
                <div>
                  <strong>Terima kasih!</strong> Feedback Anda telah direkam dan sedang dianalisis.
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    Tim kami akan meninjau masukan Anda untuk perbaikan layanan.
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                  Nama *
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                  Kategori
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="umum">Umum</option>
                  <option value="koleksi">Koleksi Buku Langka</option>
                  <option value="layanan">Layanan Perpustakaan</option>
                  <option value="website">Website & Teknologi</option>
                  <option value="fasilitas">Fasilitas & Ruang Baca</option>
                  <option value="staff">Pelayanan Staff</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                  Rating (Opsional)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: isMobile ? '1.5rem' : '2rem',
                        cursor: 'pointer',
                        color: star <= formData.rating ? '#f6e05e' : '#e2e8f0',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      ⭐
                    </button>
                  ))}
                  {formData.rating > 0 && (
                    <span style={{ 
                      marginLeft: '0.5rem', 
                      color: '#718096',
                      fontSize: '0.9rem'
                    }}>
                      {formData.rating}/5
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', color: '#4a5568' }}>
                    Pesan *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4299e1',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textDecoration: 'underline'
                    }}
                  >
                    {showPreview ? 'Sembunyikan Preview' : 'Lihat Analisis'}
                  </button>
                </div>
                
                <textarea
                  value={formData.pesan}
                  onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                  rows="6"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Tuliskan kritik, saran, atau masukan Anda untuk layanan kami..."
                  required
                />
                
                {/* Real-time Sentiment Preview */}
                {showPreview && previewSentiment && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f7fafc',
                    border: `2px solid ${getSentimentColor(previewSentiment.sentiment)}`,
                    borderRadius: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {getSentimentIcon(previewSentiment.sentiment)}
                      </span>
                      <strong style={{ color: getSentimentColor(previewSentiment.sentiment) }}>
                        {getSentimentText(previewSentiment.sentiment)}
                      </strong>
                      <span style={{ 
                        marginLeft: 'auto',
                        fontSize: '0.8rem',
                        color: '#718096'
                      }}>
                        Confidence: {Math.round(previewSentiment.confidence)}%
                      </span>
                    </div>
                    {previewSentiment.reasons && (
                      <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                        {previewSentiment.reasons.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: loading ? '#a0aec0' : '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Mengirim Feedback...
                  </span>
                ) : (
                  '📤 Kirim Feedback'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Feedback List Section */}
        <div>
          <div style={{
            backgroundColor: 'white',
            padding: isMobile ? '1.5rem' : '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h3 style={{ 
                color: '#2d3748', 
                margin: 0,
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>
                📝 Feedback Terbaru
              </h3>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '0.9rem'
                }}
              >
                <option value="semua">Semua Sentimen</option>
                <option value="positive">😊 Positif</option>
                <option value="negative">😔 Perlu Perbaikan</option>
                <option value="neutral">😐 Netral</option>
              </select>
            </div>

            <div style={{ 
              maxHeight: isMobile ? '400px' : '600px', 
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {filteredFeedbacks.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 2rem', 
                  color: '#718096' 
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                    {feedbacks.length === 0 ? 'Belum ada feedback' : 'Tidak ada feedback untuk filter ini'}
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    {feedbacks.length === 0 
                      ? 'Jadilah yang pertama memberikan masukan!' 
                      : 'Coba ubah filter untuk melihat lebih banyak feedback.'
                    }
                  </div>
                </div>
              ) : (
                filteredFeedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    style={{
                      padding: '1.5rem',
                      border: `1px solid ${getSentimentColor(feedback.sentiment)}20`,
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      backgroundColor: '#f7fafc',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div>
                        <strong style={{ color: '#2d3748' }}>
                          {feedback.nama}
                        </strong>
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.8rem',
                          color: '#718096'
                        }}>
                          {new Date(feedback.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        {feedback.rating > 0 && (
                          <span style={{ color: '#f6e05e', fontSize: '0.9rem' }}>
                            {'⭐'.repeat(feedback.rating)}
                            <span style={{ color: '#718096', marginLeft: '0.25rem' }}>
                              ({feedback.rating})
                            </span>
                          </span>
                        )}
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: getSentimentColor(feedback.sentiment),
                            color: 'white',
                            borderRadius: '15px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {getSentimentIcon(feedback.sentiment)} {getSentimentText(feedback.sentiment)}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        fontSize: '0.8rem',
                        color: '#718096',
                        backgroundColor: '#edf2f7',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '12px'
                      }}>
                        📁 {feedback.kategori}
                      </span>
                      
                      <span style={{
                        fontSize: '0.7rem',
                        color: '#a0aec0'
                      }}>
                        AI Confidence: {Math.round(feedback.confidence)}%
                      </span>
                    </div>

                    <p style={{
                      color: '#4a5568',
                      lineHeight: '1.5',
                      margin: 0,
                      fontSize: '0.9rem'
                    }}>
                      {feedback.pesan}
                    </p>

                    {feedback.analysis_reasons && feedback.analysis_reasons.length > 0 && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        backgroundColor: '#edf2f7',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        color: '#4a5568'
                      }}>
                        <strong>Analisis: </strong>
                        {feedback.analysis_reasons.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Custom Scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </Layout>
  )
}
