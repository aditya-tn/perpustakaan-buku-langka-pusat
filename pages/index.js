import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showStats, setShowStats] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Search Intelligence States
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [searchMethod, setSearchMethod] = useState('')
  const [liveSearchEnabled, setLiveSearchEnabled] = useState(true) // NEW: Live search toggle
  const [isTyping, setIsTyping] = useState(false) // NEW: Typing indicator

  // Refs untuk debounce dan cancellation
  const searchTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load search history dari localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
    
    // Load live search preference
    const savedLiveSearch = localStorage.getItem('liveSearchEnabled')
    if (savedLiveSearch !== null) {
      setLiveSearchEnabled(JSON.parse(savedLiveSearch))
    }
  }, [])

  // Save preferences ke localStorage
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory))
    }
    localStorage.setItem('liveSearchEnabled', JSON.stringify(liveSearchEnabled))
  }, [searchHistory, liveSearchEnabled])

  // NEW: Real-time Search Effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Skip jika search term kosong atau live search disabled
    if (!searchTerm.trim() || !liveSearchEnabled) {
      if (searchTerm.trim().length === 0) {
        setSearchResults([])
        setShowStats(true)
      }
      return
    }

    // Set typing indicator
    setIsTyping(true)

    // Debounce search execution
    searchTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)
      await executeSearch(searchTerm)
    }, 800) // 800ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, liveSearchEnabled])

  // Auto scroll ke atas ketika currentPage berubah
  useEffect(() => {
    if (searchResults.length > 0) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [currentPage, searchResults.length])

  // Hide stats when search results appear
  useEffect(() => {
    if (searchResults.length > 0) {
      setShowStats(false)
    } else {
      setShowStats(true)
    }
  }, [searchResults])

  // Debounced Search Suggestions (terpisah dari real-time search)
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('books')
          .select('judul, pengarang, penerbit, id')
          .or(`judul.ilike.%${searchTerm}%,pengarang.ilike.%${searchTerm}%`)
          .limit(5)

        setSuggestions(data || [])
      } catch (error) {
        console.error('Suggestions error:', error)
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // NEW: Execute Search dengan cancellation
  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return
    
    // Create new AbortController untuk request ini
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setCurrentPage(1)

    try {
      const results = await performSmartSearch(searchQuery)
      setSearchResults(results)
      
      // Save to search history jika ada results
      if (results.length > 0) {
        saveToSearchHistory(searchQuery, results.length)
      }
      
    } catch (err) {
      // Ignore abortion errors
      if (err.name !== 'AbortError') {
        console.error('Search error:', err)
        setSearchResults([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Smart Search Algorithm dengan Relevance Scoring
  const performSmartSearch = async (searchQuery = searchTerm) => {
    if (!searchQuery.trim()) return []
    
    const searchWords = searchQuery.trim().split(/\s+/).filter(word => word.length > 0)
    
    try {
      // Priority 1: Exact phrase match
      const exactMatchQuery = supabase
        .from('books')
        .select('*')
        .or(`judul.ilike.%${searchQuery}%,pengarang.ilike.%${searchQuery}%,penerbit.ilike.%${searchQuery}%`)

      const { data: exactMatches, error: exactError } = await exactMatchQuery
      
      if (exactError) throw exactError

      // Jika exact match memberikan hasil cukup, gunakan itu
      if (exactMatches && exactMatches.length >= 8) {
        setSearchMethod('Exact Match')
        return rankSearchResults(exactMatches, searchWords, searchQuery)
      }

      // Priority 2: Individual word match dengan scoring tinggi
      const wordMatchPromises = searchWords.map(word => 
        supabase
          .from('books')
          .select('*')
          .or(`judul.ilike.%${word}%,pengarang.ilike.%${word}%,penerbit.ilike.%${word}%`)
      )

      const wordResults = await Promise.all(wordMatchPromises)
      
      // Combine semua results
      const allResults = [...(exactMatches || [])]
      wordResults.forEach(({ data }) => {
        if (data) allResults.push(...data)
      })

      setSearchMethod('Smart Ranking')
      return rankSearchResults(allResults, searchWords, searchQuery)

    } catch (error) {
      console.error('Smart search error:', error)
      // Fallback ke basic search
      return performBasicSearch(searchQuery)
    }
  }

  // Relevance Scoring Algorithm
  const rankSearchResults = (results, searchWords, originalQuery) => {
    const scoredResults = results.map(book => {
      let score = 0
      const lowerJudul = book.judul?.toLowerCase() || ''
      const lowerPengarang = book.pengarang?.toLowerCase() || ''
      const lowerPenerbit = book.penerbit?.toLowerCase() || ''
      const lowerQuery = originalQuery.toLowerCase()
      
      // Exact phrase match - highest priority
      if (lowerJudul.includes(lowerQuery)) score += 100
      if (lowerPengarang.includes(lowerQuery)) score += 80
      if (lowerPenerbit.includes(lowerQuery)) score += 60
      
      // Field-specific weighting
      searchWords.forEach(word => {
        const lowerWord = word.toLowerCase()
        
        // Judul matches - highest weight
        if (lowerJudul.includes(lowerWord)) score += 30
        
        // Pengarang matches - medium weight
        if (lowerPengarang.includes(lowerWord)) score += 20
        
        // Penerbit matches - lower weight
        if (lowerPenerbit.includes(lowerWord)) score += 10
      })
      
      // Exact word match bonus (whole word matches)
      const judulWords = lowerJudul.split(/\s+/) || []
      const pengarangWords = lowerPengarang.split(/\s+/) || []
      
      searchWords.forEach(word => {
        const lowerWord = word.toLowerCase()
        if (judulWords.includes(lowerWord)) score += 15
        if (pengarangWords.includes(lowerWord)) score += 10
      })
      
      // Length penalty - prefer shorter, more relevant titles
      if (book.judul && book.judul.length < 50) score += 5
      
      return { ...book, _relevanceScore: score }
    })
    
    // Remove duplicates berdasarkan ID
    const uniqueResults = scoredResults.filter((book, index, self) => 
      index === self.findIndex(b => b.id === book.id)
    )
    
    // Sort by relevance score, lalu judul
    return uniqueResults.sort((a, b) => {
      if (b._relevanceScore !== a._relevanceScore) {
        return b._relevanceScore - a._relevanceScore
      }
      return (a.judul || '').localeCompare(b.judul || '')
    })
  }

  // Basic search fallback
  const performBasicSearch = async (searchQuery) => {
    setSearchMethod('Basic Search')
    
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`judul.ilike.%${searchQuery}%,pengarang.ilike.%${searchQuery}%,penerbit.ilike.%${searchQuery}%`)

    if (error) throw error
    return data || []
  }

  // Save to search history
  const saveToSearchHistory = (term, resultsCount) => {
    const newSearch = {
      term,
      resultsCount,
      timestamp: new Date().toISOString(),
      id: Date.now()
    }
    
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.term !== term)
      return [newSearch, ...filtered.slice(0, 9)] // Keep last 10 searches
    })
  }

  // UPDATED: Manual Search Handler (untuk ketika live search disabled)
  const handleManualSearch = async (e, customTerm = null) => {
    if (e && e.preventDefault) e.preventDefault()
    
    const searchQuery = customTerm || searchTerm
    if (!searchQuery.trim()) return
    
    // Cancel any ongoing real-time search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    await executeSearch(searchQuery)
    setShowSuggestions(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.judul)
    setShowSuggestions(false)
    
    if (liveSearchEnabled) {
      // Trigger real-time search
      setSearchTerm(suggestion.judul) // Will trigger useEffect
    } else {
      // Manual search
      handleManualSearch({ preventDefault: () => {} }, suggestion.judul)
    }
  }

  // Handle search history click
  const handleHistoryClick = (historyItem) => {
    setSearchTerm(historyItem.term)
    
    if (liveSearchEnabled) {
      setSearchTerm(historyItem.term) // Will trigger useEffect
    } else {
      handleManualSearch({ preventDefault: () => {} }, historyItem.term)
    }
  }

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  // NEW: Toggle live search
  const toggleLiveSearch = () => {
    setLiveSearchEnabled(prev => !prev)
  }

  // NEW: Clear current search
  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowStats(true)
    setShowSuggestions(false)
    
    // Cancel any ongoing search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const popularSearches = [
    'sejarah indonesia',
    'sastra jawa',
    'naskah kuno',
    'budaya nusantara',
    'colonial history',
    'manuskrip',
    'sastra melayu',
    'sejarah islam'
  ]

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(searchResults.length / itemsPerPage)
  
  // Function untuk ganti halaman dengan scroll ke atas
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Temukan khazanah literatur langka Indonesia dari koleksi Perpustakaan Nasional RI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Modern Hero Section - Responsive */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2.5rem 1rem' : '4rem 2rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Memori Literasi Nusantara
          </h2>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            marginBottom: isMobile ? '2rem' : '2.5rem',
            opacity: 0.9,
            fontWeight: '300',
            lineHeight: '1.5'
          }}>
            85.000+ warisan budaya di layanan buku langka - Perpustakaan Nasional RI
          </p>
          
          {/* NEW: Enhanced Search Form dengan Live Search Controls */}
          <form onSubmit={handleManualSearch} style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            position: 'relative'
          }}>
            {/* Search Controls Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {/* Live Search Toggle */}
                <button
                  type="button"
                  onClick={toggleLiveSearch}
                  style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: liveSearchEnabled ? '#48bb78' : '#e2e8f0',
                    color: liveSearchEnabled ? 'white' : '#4a5568',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span style={{ fontSize: '0.8rem' }}>
                    {liveSearchEnabled ? '🔴' : '⚪'}
                  </span>
                  Live Search
                </button>

                {/* Search Status Indicator */}
                {(loading || isTyping) && (
                  <div style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isTyping ? '#f6e05e' : '#4299e1',
                      animation: 'pulse 1.5s infinite'
                    }} />
                    {isTyping ? 'Mengetik...' : 'Mencari...'}
                  </div>
                )}
              </div>

              {/* Clear Search Button */}
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  ✕ Hapus
                </button>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0.5rem' : '0',
              borderRadius: isMobile ? '8px' : '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={
                    liveSearchEnabled 
                      ? "Ketik untuk mencari secara real-time..." 
                      : "Cari judul, pengarang, atau tahun terbit..."
                  }
                  style={{
                    width: '100%',
                    padding: isMobile ? '1rem 1.25rem' : '1.25rem 1.5rem',
                    border: 'none',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    outline: 'none'
                  }}
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0 || searchTerm.length >= 2) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {/* Recent Searches */}
                    {searchHistory.length > 0 && searchTerm.length < 2 && (
                      <>
                        <div style={{
                          padding: '0.75rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#718096',
                          borderBottom: '1px solid #f7fafc',
                          backgroundColor: '#f7fafc',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>🔍 Pencarian Terakhir</span>
                          <button
                            onClick={clearSearchHistory}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#718096',
                              cursor: 'pointer',
                              fontSize: '0.7rem'
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                        {searchHistory.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleHistoryClick(item)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f7fafc',
                              transition: 'background-color 0.2s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <span>{item.term}</span>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              color: '#718096',
                              backgroundColor: '#e2e8f0',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '12px'
                            }}>
                              {item.resultsCount} hasil
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Search Suggestions */}
                    {suggestions.length > 0 && (
                      <>
                        <div style={{
                          padding: '0.75rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#718096',
                          borderBottom: '1px solid #f7fafc',
                          backgroundColor: '#f7fafc'
                        }}>
                          💡 Saran Pencarian
                        </div>
                        {suggestions.map((item, index) => (
                          <div
                            key={`${item.id}-${index}`}
                            onClick={() => handleSuggestionClick(item)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f7fafc',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <div style={{ fontWeight: '600', color: '#2d3748', marginBottom: '0.25rem' }}>
                              {item.judul}
                            </div>
                            {item.pengarang && (
                              <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                                oleh {item.pengarang}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {/* Popular Searches */}
                    {searchTerm.length < 2 && (
                      <>
                        <div style={{
                          padding: '0.75rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#718096',
                          borderBottom: '1px solid #f7fafc',
                          backgroundColor: '#f7fafc'
                        }}>
                          🔥 Pencarian Populer
                        </div>
                        {popularSearches.map((term, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setSearchTerm(term)
                              if (!liveSearchEnabled) {
                                handleManualSearch({ preventDefault: () => {} }, term)
                              }
                            }}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f7fafc',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            {term}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Manual Search Button (visible when live search disabled) */}
              {!liveSearchEnabled && (
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#f56565',
                    color: 'white',
                    padding: isMobile ? '1rem 1.5rem' : '0 2.5rem',
                    border: 'none',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    minWidth: isMobile ? 'auto' : '120px',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? '🔍' : 'Cari'}
                </button>
              )}
            </div>

            {/* NEW: Live Search Status */}
            {liveSearchEnabled && searchTerm && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                justifyContent: 'center'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isTyping ? '#f6e05e' : loading ? '#4299e1' : '#48bb78',
                  animation: (isTyping || loading) ? 'pulse 1.5s infinite' : 'none'
                }} />
                {isTyping ? 'Mengetik...' : loading ? 'Mencari...' : 'Live search aktif'}
              </div>
            )}
          </form>

          {/* Search Intelligence Info */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              fontSize: '0.8rem',
              display: 'inline-block'
            }}>
              🧠 {searchMethod} • {searchResults.length} hasil relevan
              {liveSearchEnabled && ' • 🔴 Live'}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section - Responsive */}
      {showStats && (
        <section style={{
          backgroundColor: 'white',
          padding: isMobile ? '2rem 1rem' : '3rem 2rem',
          transition: 'all 0.3s ease-in-out'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#4a5568' }}>85K+</div>
              <div style={{ color: '#718096', fontWeight: '500', fontSize: isMobile ? '0.85rem' : '1rem' }}>Koleksi Buku</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#4a5568' }}>200+</div>
              <div style={{ color: '#718096', fontWeight: '500', fontSize: isMobile ? '0.85rem' : '1rem' }}>Tahun Sejarah</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#4a5568' }}>50+</div>
              <div style={{ color: '#718096', fontWeight: '500', fontSize: isMobile ? '0.85rem' : '1rem' }}>Bahasa</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#4a5568' }}>24/7</div>
              <div style={{ color: '#718096', fontWeight: '500', fontSize: isMobile ? '0.85rem' : '1rem' }}>Akses Digital</div>
            </div>
          </div>

          {/* Quick Search Suggestions */}
          <div style={{
            maxWidth: '800px',
            margin: '2rem auto 0 auto',
            textAlign: 'center'
          }}>
            <p style={{ 
              color: '#718096', 
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              💡 Coba pencarian: 
              {popularSearches.slice(0, 4).map((term, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchTerm(term)
                    if (!liveSearchEnabled) {
                      handleManualSearch({ preventDefault: () => {} }, term)
                    }
                  }}
                  style={{
                    margin: '0 0.5rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#f7fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#4299e1'
                    e.target.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f7fafc'
                    e.target.style.color = 'inherit'
                  }}
                >
                  {term}
                </button>
              ))}
            </p>
          </div>
        </section>
      )}

      {/* Search Results Section */}
      {searchResults.length > 0 && (
        <section style={{ 
          maxWidth: '1400px', 
          margin: isMobile ? '2rem auto' : '3rem auto',
          padding: isMobile ? '0 1rem' : '0 2rem',
          animation: 'fadeInUp 0.5s ease-out'
        }}>
          {/* ... (rest of the search results code remains the same) ... */}
        </section>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Layout>
  )
}
