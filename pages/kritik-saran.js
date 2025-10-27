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
  const [dashboardFilter, setDashboardFilter] = useState('semua') // Filter untuk dashboard

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Enhanced sentiment analysis dengan konteks bahasa Indonesia
  const analyzeSentiment = (text) => {
    // Expanded positive words dengan konteks layanan
    const positiveWords = [
      // Service quality
      'bagus', 'baik', 'mantap', 'puas', 'cepat', 'mudah', 'helpful', 'excellent', 
      'terima kasih', 'keren', 'luar biasa', 'memuaskan', 'profesional', 'responsif',
      'bermanfaat', 'inovasi', 'recommended', 'wow', 'sangat baik', 'istimewa',
      'memukau', 'fantastis', 'hebat', 'unggul', 'berkualitas', 'premium',
      
      // Staff & service attitude
      'ramah', 'sopan', 'ganteng', 'cantik', 'murah senyum', 'penuh perhatian',
      'responsif', 'sigap', 'tanggap', 'solutif', 'kooperatif', 'friendly',
      'helpful', 'supportive', 'care', 'peduli', 'baik hati',
      
      // Facility & experience
      'nyaman', 'rapi', 'bersih', 'teratur', 'modern', 'canggih', 'lengkap',
      'akses mudah', 'user friendly', 'intuitif', 'efisien', 'efektif',
      
      // Collection & content
      'lengkap', 'bervariasi', 'bermanfaat', 'relevan', 'update', 'terkini',
      'komprehensif', 'detail', 'akurat', 'reliable'
    ];
    
    // Expanded negative words dengan konteks
    const negativeWords = [
      // Service issues
      'buruk', 'jelek', 'lambat', 'sulit', 'ribet', 'error', 'gagal', 'kecewa',
      'tidak bisa', 'tidak ada', 'kosong', 'rusak', 'bug', 'masalah', 'komplain',
      'protes', 'mengecewakan', 'seharusnya', 'kurang', 'perlu perbaikan',
      
      // Staff & attitude issues
      'tidak ramah', 'kasar', 'cuek', 'acuh', 'tidak sopan', 'marah', 'kesal',
      'emosi', 'tidak membantu', 'malas', 'lamban', 'tidak responsif',
      
      // Technical & facility issues
      'hang', 'crash', 'down', 'maintenance', 'gangguan', 'trouble', 'error',
      'blank', 'kosong', 'tidak muncul', 'loading', 'lemot', 'lelet',
      
      // Collection & content issues
      'terbatas', 'sedikit', 'tidak lengkap', 'kadaluarsa', 'usang', 'basil',
      'tidak update', 'tidak relevan', 'tidak akurat', 'salah'
    ];
    
    // Negation words yang membalikkan makna
    const negationWords = ['tidak', 'bukan', 'jangan', 'tanpa', 'kurang', 'belum'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let negationContext = false;
    
    // Advanced scoring dengan konteks negasi
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Check for negation words
      if (negationWords.includes(word)) {
        negationContext = true;
        continue;
      }
      
      // Check for positive words
      const isPositive = positiveWords.some(positive => {
        return word.includes(positive) || positive.includes(word);
      });
      
      // Check for negative words  
      const isNegative = negativeWords.some(negative => {
        return word.includes(negative) || negative.includes(word);
      });
      
      if (isPositive) {
        if (negationContext) {
          negativeScore += 2; // "tidak baik" = negative
        } else {
          positiveScore += 1;
        }
        negationContext = false;
      }
      
      if (isNegative) {
        if (negationContext) {
          positiveScore += 2; // "tidak buruk" = positive  
        } else {
          negativeScore += 1;
        }
        negationContext = false;
      }
      
      // Reset negation context setelah beberapa kata
      if (i > 0 && negationContext && !negationWords.includes(words[i-1])) {
        negationContext = false;
      }
    }
    
    // Additional scoring untuk intensifier
    const intensifiers = ['sangat', 'sekali', 'banget', 'amat', 'benar', 'sungguh'];
    words.forEach((word, i) => {
      if (intensifiers.includes(word) && i < words.length - 1) {
        const nextWord = words[i + 1];
        if (positiveWords.some(p => nextWord.includes(p))) {
          positiveScore += 0.5;
        }
        if (negativeWords.some(n => nextWord.includes(n))) {
          negativeScore += 0.5;
        }
      }
    });
    
    const totalRelevant = positiveScore + negativeScore;
    const reasons = [];
    
    if (totalRelevant === 0) {
      return { 
        sentiment: 'neutral', 
        confidence: 30,
        reasons: ['Pesan netral tanpa kata kunci sentiment spesifik'],
        scores: { positive: 0, negative: 0 }
      };
    }
    
    let sentiment, confidence;
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive';
      confidence = Math.min(95, (positiveScore / totalRelevant) * 100 + 20);
      reasons.push(`Ditemukan ${positiveScore.toFixed(1)} poin positif`);
      if (negativeScore > 0) reasons.push(`Dengan ${negativeScore.toFixed(1)} catatan`);
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
      confidence = Math.min(95, (negativeScore / totalRelevant) * 100 + 20);
      reasons.push(`Ditemukan ${negativeScore.toFixed(1)} poin perlu perbaikan`);
      if (positiveScore > 0) reasons.push(`Dengan ${positiveScore.toFixed(1)} aspek positif`);
    } else {
      sentiment = 'neutral';
      confidence = 50;
      reasons.push('Balance antara aspek positif dan perlu perbaikan');
    }
    
    // Special cases detection
    const lowerText = text.toLowerCase();
    
    // Thankful messages biasanya positive
    if (lowerText.includes('terima kasih') && positiveScore === 0) {
      sentiment = 'positive';
      confidence = 70;
      reasons.push('Mengungkapkan rasa terima kasih');
    }
    
    // Apology messages biasanya negative  
    if (lowerText.includes('maaf') && negativeScore === 0 && lowerText.includes('tidak')) {
      sentiment = 'negative';
      confidence = 65;
      reasons.push('Mengungkapkan permintaan maaf atau ketidaknyamanan');
    }
    
    // Question marks netral jika tidak ada sentiment jelas
    if ((text.includes('?') || lowerText.includes('apakah') || lowerText.includes('bagaimana')) && totalRelevant === 0) {
      sentiment = 'neutral';
      confidence = 40;
      reasons.push('Pesan bersifat pertanyaan atau netral');
    }
    
    return { 
      sentiment, 
      confidence: Math.round(confidence),
      reasons,
      scores: { positive: positiveScore, negative: negativeScore }
    };
  };

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

  // Filter feedbacks berdasarkan sentiment dan kategori dashboard
  const filteredFeedbacks = filter === 'semua' 
    ? feedbacks 
    : feedbacks.filter(f => f.sentiment === filter)

  // Data untuk dashboard berdasarkan filter kategori
  const getDashboardData = () => {
    if (!analysis) return null
    
    if (dashboardFilter === 'semua') {
      return analysis
    }
    
    // Filter feedbacks berdasarkan kategori untuk dashboard
    const filteredByKategori = feedbacks.filter(f => f.kategori === dashboardFilter)
    const total = filteredByKategori.length
    const positive = filteredByKategori.filter(f => f.sentiment === 'positive').length
    const negative = filteredByKategori.filter(f => f.sentiment === 'negative').length
    const neutral = filteredByKategori.filter(f => f.sentiment === 'neutral').length
    const ratings = filteredByKategori.filter(f => f.rating > 0)
    const averageRating = ratings.length > 0 
      ? (ratings.reduce((acc, f) => acc + f.rating, 0) / ratings.length).toFixed(1)
      : 0
    
    return {
      total,
      positive,
      negative,
      neutral,
      averageRating,
      satisfaction: total > 0 ? Math.round((positive / total) * 100) : 0
    }
  }

  const dashboardData = getDashboardData()

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

      {/* Main Content dengan Layout Baru */}
      <div style={{
        maxWidth: '1400px',
        margin: '2rem auto',
        padding: isMobile ? '0 1rem' : '0 2rem',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
        gap: isMobile ? '2rem' : '3rem',
        alignItems: 'start'
      }}>
        
        {/* Left Column - Form (Sticky) */}
        <div>
          <div style={{
            backgroundColor: 'white',
            padding: isMobile ? '1.5rem' : '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: isMobile ? 'static' : 'sticky',
            top: '2rem'
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
                        Confidence: {previewSentiment.confidence}%
                      </span>
                    </div>
                    
                    {/* Detailed Scores */}
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.8rem'
                    }}>
                      <span style={{ color: '#48bb78' }}>
                        👍 {previewSentiment.scores.positive.toFixed(1)} positif
                      </span>
                      <span style={{ color: '#f56565' }}>
                        👎 {previewSentiment.scores.negative.toFixed(1)} perbaikan
                      </span>
                    </div>
                    
                    {previewSentiment.reasons && (
                      <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                        <strong>Analisis: </strong>
                        {previewSentiment.reasons.join(' • ')}
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

        {/* Right Column - Dashboard & Feedback List */}
        <div>
          {/* Dashboard Section */}
          <div style={{
            backgroundColor: 'white',
            padding: isMobile ? '1.5rem' : '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
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
                📊 Dashboard Feedback
              </h3>
              
              <select
                value={dashboardFilter}
                onChange={(e) => setDashboardFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '0.9rem'
                }}
              >
                <option value="semua">Semua Kategori</option>
                <option value="umum">Umum</option>
                <option value="koleksi">Koleksi Buku</option>
                <option value="layanan">Layanan</option>
                <option value="website">Website</option>
                <option value="fasilitas">Fasilitas</option>
                <option value="staff">Staff</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            
            {dashboardData ? (
              <div>
                {/* Main Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: '#ebf8ff', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4299e1' }}>
                      {dashboardData.total}
                    </div>
                    <div style={{ color: '#718096', fontSize: '0.8rem' }}>Total</div>
                  </div>
                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: '#f0fff4', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#48bb78' }}>
                      {dashboardData.satisfaction}%
                    </div>
                    <div style={{ color: '#718096', fontSize: '0.8rem' }}>Kepuasan</div>
                  </div>
                </div>

                {/* Sentiment Breakdown */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#f0fff4',
                    borderRadius: '6px',
                    borderLeft: '4px solid #48bb78'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>😊</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Positif</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#22543d' }}>
                      {dashboardData.positive}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#fffaf0',
                    borderRadius: '6px',
                    borderLeft: '4px solid #ed8936'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>😐</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Netral</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#744210' }}>
                      {dashboardData.neutral}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#fff5f5',
                    borderRadius: '6px',
                    borderLeft: '4px solid #f56565'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>😔</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Perbaikan</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#742a2a' }}>
                      {dashboardData.negative}
                    </div>
                  </div>
                </div>

                {/* Rating Summary */}
                {dashboardData.averageRating > 0 && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fffaf0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: '#744210', marginBottom: '0.5rem' }}>
                      Rating Rata-rata
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d69e2e' }}>
                      {dashboardData.averageRating}/5
                    </div>
                    <div style={{ color: '#f6e05e', fontSize: '1rem', marginTop: '0.25rem' }}>
                      {'⭐'.repeat(Math.round(dashboardData.averageRating))}
                    </div>
                  </div>
                )}

                {/* Filter Info */}
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f7fafc',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#4a5568',
                  textAlign: 'center'
                }}>
                  📊 Menampilkan data untuk: <strong>
                    {dashboardFilter === 'semua' ? 'Semua Kategori' : 
                     dashboardFilter === 'koleksi' ? 'Koleksi Buku Langka' :
                     dashboardFilter === 'layanan' ? 'Layanan Perpustakaan' :
                     dashboardFilter === 'website' ? 'Website & Teknologi' :
                     dashboardFilter === 'fasilitas' ? 'Fasilitas & Ruang Baca' :
                     dashboardFilter === 'staff' ? 'Pelayanan Staff' :
                     dashboardFilter === 'lainnya' ? 'Lainnya' : 'Umum'}
                  </strong>
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#718096' 
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                <div>Memuat analisis...</div>
              </div>
            )}
          </div>

          {/* Feedback List Section */}
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
