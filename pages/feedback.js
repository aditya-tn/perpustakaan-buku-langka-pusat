// pages/feedback.js
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function Feedback() {
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

  // Real-time sentiment analysis
  const analyzeSentiment = (text) => {
    const positiveWords = ['bagus', 'baik', 'mantap', 'puas', 'cepat', 'mudah', 'helpful', 'excellent', 'terima kasih']
    const negativeWords = ['buruk', 'jelek', 'lambat', 'sulit', 'ribet', 'error', 'gagal', 'kecewa']
    
    const words = text.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(word => positiveWords.includes(word)).length
    const negativeCount = words.filter(word => negativeWords.includes(word)).length
    
    if (positiveCount > negativeCount) return { sentiment: 'positive', confidence: (positiveCount / words.length) * 100 }
    if (negativeCount > positiveCount) return { sentiment: 'negative', confidence: (negativeCount / words.length) * 100 }
    return { sentiment: 'neutral', confidence: 50 }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const sentiment = analyzeSentiment(formData.pesan)
    
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert([
          {
            ...formData,
            sentiment: sentiment.sentiment,
            confidence: sentiment.confidence,
            created_at: new Date().toISOString()
          }
        ])
        .select()
      
      if (error) throw error
      
      setSubmitted(true)
      setFormData({ nama: '', email: '', kategori: 'umum', pesan: '', rating: 0 })
      loadFeedbacks()
    } catch (error) {
      console.error('Error submitting feedback:', error)
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
      
      if (error) throw error
      setFeedbacks(data || [])
      
      // Calculate analytics
      const analytics = {
        total: data.length,
        positive: data.filter(f => f.sentiment === 'positive').length,
        negative: data.filter(f => f.sentiment === 'negative').length,
        neutral: data.filter(f => f.sentiment === 'neutral').length,
        averageRating: data.filter(f => f.rating > 0).reduce((acc, f) => acc + f.rating, 0) / data.filter(f => f.rating > 0).length
      }
      setAnalysis(analytics)
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

  return (
    <Layout>
      <Head>
        <title>Kritik & Saran - Perpustakaan Nasional RI</title>
        <meta name="description" content="Berikan masukan Anda untuk pengembangan layanan Perpustakaan Nasional RI" />
      </Head>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '1rem'
          }}>
            Kritik & Saran
          </h1>
          <p style={{
            fontSize: '1.25rem',
            opacity: 0.9,
            fontWeight: '300',
            lineHeight: '1.5'
          }}>
            Suara Anda membantu kami meningkatkan layanan Perpustakaan Nasional RI
          </p>
        </div>
      </section>

      {/* Analytics Dashboard */}
      {analysis && (
        <section style={{
          backgroundColor: 'white',
          padding: '2rem',
          margin: '2rem auto',
          maxWidth: '1200px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>📊 Analisis Feedback</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4299e1' }}>
                {analysis.total}
              </div>
              <div style={{ color: '#718096' }}>Total Feedback</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0fff4', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#48bb78' }}>
                {analysis.positive}
              </div>
              <div style={{ color: '#718096' }}>Positif</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff5f5', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f56565' }}>
                {analysis.negative}
              </div>
              <div style={{ color: '#718096' }}>Perlu Perbaikan</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fffaf0', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ed8936' }}>
                {analysis.neutral}
              </div>
              <div style={{ color: '#718096' }}>Netral</div>
            </div>
          </div>
        </section>
      )}

      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem'
      }}>
        
        {/* Form Section */}
        <div>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>
              💬 Berikan Feedback Anda
            </h3>

            {submitted && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0fff4',
                border: '1px solid #9ae6b4',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                color: '#22543d'
              }}>
                ✅ Terima kasih! Feedback Anda telah direkam dan sedang dianalisis.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                  Nama
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
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                  Email
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
                    fontSize: '1rem'
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
                  <option value="koleksi">Koleksi Buku</option>
                  <option value="layanan">Layanan Perpustakaan</option>
                  <option value="website">Website & Teknologi</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                  Rating
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '2rem',
                        cursor: 'pointer',
                        color: star <= formData.rating ? '#f6e05e' : '#e2e8f0'
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                  Pesan
                </label>
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
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Mengirim...' : 'Kirim Feedback'}
              </button>
            </form>
          </div>
        </div>

        {/* Feedback List Section */}
        <div>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: '#2d3748', margin: 0 }}>
                📝 Feedback Terbaru
              </h3>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white'
                }}
              >
                <option value="semua">Semua</option>
                <option value="positive">Positif</option>
                <option value="negative">Perlu Perbaikan</option>
                <option value="neutral">Netral</option>
              </select>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredFeedbacks.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#718096' 
                }}>
                  Belum ada feedback untuk filter ini
                </div>
              ) : (
                filteredFeedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    style={{
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      backgroundColor: '#f7fafc'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
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
                          {new Date(feedback.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {feedback.rating > 0 && (
                          <span style={{ color: '#f6e05e' }}>
                            {'⭐'.repeat(feedback.rating)}
                          </span>
                        )}
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: getSentimentColor(feedback.sentiment),
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}
                        >
                          {getSentimentIcon(feedback.sentiment)} {feedback.sentiment}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.8rem',
                      color: '#718096',
                      marginBottom: '0.5rem'
                    }}>
                      Kategori: <strong>{feedback.kategori}</strong>
                    </div>

                    <p style={{
                      color: '#4a5568',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {feedback.pesan}
                    </p>

                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.7rem',
                      color: '#a0aec0'
                    }}>
                      Confidence: {Math.round(feedback.confidence)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
