import { useState, useEffect, useCallback } from 'react'
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
  
  // NEW: Search Intelligence States
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [searchMethod, setSearchMethod] = useState('') // Untuk debug info

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Save search history to localStorage
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory))
    }
  }, [searchHistory])

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

  // NEW: Debounced Search Suggestions
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

  // NEW: Smart Search Algorithm dengan Relevance Scoring
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

  // NEW: Relevance Scoring Algorithm
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

  // NEW: Basic search fallback
  const performBasicSearch = async (searchQuery) => {
    setSearchMethod('Basic Search')
    
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`judul.ilike.%${searchQuery}%,pengarang.ilike.%${searchQuery}%,penerbit.ilike.%${searchQuery}%`)

    if (error) throw error
    return data || []
  }

  // NEW: Save to search history
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

  // UPDATED: Enhanced Search Handler
  const handleSearch = async (e, customTerm = null) => {
    if (e && e.preventDefault) e.preventDefault()
    
    const searchQuery = customTerm || searchTerm
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setCurrentPage(1)
    setShowSuggestions(false)

    try {
      const results = await performSmartSearch(searchQuery)
      setSearchResults(results)
      
      // Save to search history jika ada results
      if (results.length > 0) {
        saveToSearchHistory(searchQuery, results.length)
      }
      
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // NEW: Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.judul)
    setShowSuggestions(false)
    handleSearch({ preventDefault: () => {} }, suggestion.judul)
  }

  // NEW: Handle search history click
  const handleHistoryClick = (historyItem) => {
    setSearchTerm(historyItem.term)
    handleSearch({ preventDefault: () => {} }, historyItem.term)
  }

  // NEW: Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  // Popular searches (bisa diganti dengan data analytics nanti)
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
          
          {/* NEW: Enhanced Search Form dengan Suggestions */}
          <form onSubmit={handleSearch} style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            position: 'relative'
          }}>
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
                  placeholder="Cari judul, pengarang, atau tahun terbit..."
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
                          backgroundColor: '#f7fafc'
                        }}>
                          🔍 Pencarian Terakhir
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
                              handleSearch({ preventDefault: () => {} }, term)
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
            </div>
          </form>

          {/* NEW: Search Intelligence Info */}
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
            </div>
          )}
        </div>
      </section>

      {/* Stats Section dengan Smooth Transition - Responsive */}
      {showStats && (
        <section style={{
          backgroundColor: 'white',
          padding: isMobile ? '2rem 1rem' : '3rem 2rem',
          transition: 'all 0.3s ease-in-out',
          opacity: showStats ? 1 : 0,
          transform: showStats ? 'translateY(0)' : 'translateY(-20px)'
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

          {/* NEW: Quick Search Suggestions */}
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
                    handleSearch({ preventDefault: () => {} }, term)
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

      {/* Search Results - Modern Design & Responsive */}
      {searchResults.length > 0 && (
        <section style={{ 
          maxWidth: '1400px', 
          margin: isMobile ? '2rem auto' : '3rem auto',
          padding: isMobile ? '0 1rem' : '0 2rem',
          animation: 'fadeInUp 0.5s ease-out'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div>
              <h3 style={{ 
                fontSize: isMobile ? '1.5rem' : '1.75rem', 
                fontWeight: '700',
                color: '#2d3748',
                margin: 0
              }}>
                Hasil Pencarian
              </h3>
              <p style={{ 
                color: '#718096',
                margin: '0.5rem 0 0 0',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {searchResults.length} buku ditemukan untuk "{searchTerm}"
                {searchMethod && (
                  <span style={{ 
                    fontSize: '0.8rem',
                    backgroundColor: '#e6fffa',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    marginLeft: '0.5rem'
                  }}>
                    🧠 {searchMethod}
                  </span>
                )}
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                fontSize: isMobile ? '0.8rem' : '0.9rem', 
                color: '#4a5568', 
                fontWeight: '500' 
              }}>
                Tampilkan:
              </span>
              <select 
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                style={{
                  padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  outline: 'none',
                  minWidth: isMobile ? '140px' : 'auto'
                }}
              >
                <option value={20}>20 per halaman</option>
                <option value={50}>50 per halaman</option>
                <option value={100}>100 per halaman</option>
              </select>
            </div>
          </div>

          {/* Pagination Info */}
          <div style={{
            marginBottom: '2rem',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: '#718096',
            padding: isMobile ? '0.75rem' : '1rem',
            backgroundColor: '#f7fafc',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              Menampilkan <strong>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, searchResults.length)}</strong> dari <strong>{searchResults.length}</strong> buku
              {totalPages > 1 && ` • Halaman ${currentPage} dari ${totalPages}`}
            </div>
            
            {/* NEW: Search History Quick Actions */}
            {searchHistory.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem' }}>Pencarian terakhir:</span>
                {searchHistory.slice(0, 2).map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.7rem',
                      backgroundColor: '#edf2f7',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {item.term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Modern Book Grid - Responsive */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem',
            marginBottom: '3rem'
          }}>
            {currentItems.map((book) => (
              <div key={book.id} style={{
                backgroundColor: 'white',
                padding: isMobile ? '1.25rem' : '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #f0f0f0',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                position: 'relative'
              }}>
                {/* NEW: Relevance Indicator */}
                {book._relevanceScore > 50 && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#48bb78',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    🔥 Relevan
                  </div>
                )}
                
                <h4 style={{ 
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '0.75rem',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  lineHeight: '1.4'
                }}>
                  {book.judul}
                </h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.9rem', 
                    color: '#4a5568', 
                    marginBottom: '0.25rem' 
                  }}>
                    <strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.9rem', 
                    color: '#4a5568', 
                    marginBottom: '0.25rem' 
                  }}>
                    <strong>Tahun:</strong> {book.tahun_terbit || 'Tidak diketahui'}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.9rem', 
                    color: '#4a5568' 
                  }}>
                    <strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}
                  </div>
                </div>

                {book.deskripsi_fisik && (
                  <p style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.85rem', 
                    color: '#718096', 
                    marginTop: '0.75rem',
                    lineHeight: '1.5',
                    fontStyle: 'italic'
                  }}>
                    {book.deskripsi_fisik}
                  </p>
                )}

                {/* Modern Action Buttons - Responsive */}
                <div style={{ 
                  marginTop: '1.25rem', 
                  display: 'flex', 
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  {book.lihat_opac && book.lihat_opac !== 'null' && (
                    <a 
                      href={book.lihat_opac}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#4299e1',
                        color: 'white',
                        padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      📖 Lihat OPAC
                    </a>
                  )}

                  {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
                    <a 
                      href={book.link_pesan_koleksi}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#48bb78',
                        color: 'white',
                        padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      📥 Pesan Koleksi
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls - Modern & Responsive */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '3rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: currentPage === 1 ? '#f7fafc' : 'white',
                  color: currentPage === 1 ? '#a0aec0' : '#4a5568',
                  borderRadius: '8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: isMobile ? '0.8rem' : '1rem'
                }}
              >
                ⏮️
              </button>
              
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: currentPage === 1 ? '#f7fafc' : 'white',
                  color: currentPage === 1 ? '#a0aec0' : '#4a5568',
                  borderRadius: '8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: isMobile ? '0.8rem' : '1rem'
                }}
              >
                ◀️
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= (isMobile ? 3 : 5)) {
                  pageNumber = i + 1
                } else if (currentPage <= (isMobile ? 2 : 3)) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - (isMobile ? 1 : 2)) {
                  pageNumber = totalPages - (isMobile ? 2 : 4) + i
                } else {
                  pageNumber = currentPage - (isMobile ? 1 : 2) + i
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    style={{
                      padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: currentPage === pageNumber ? '#4299e1' : 'white',
                      color: currentPage === pageNumber ? 'white' : '#4a5568',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      minWidth: isMobile ? '2.5rem' : '3rem',
                      fontSize: isMobile ? '0.8rem' : '1rem'
                    }}
                  >
                    {pageNumber}
                  </button>
                )
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: currentPage === totalPages ? '#f7fafc' : 'white',
                  color: currentPage === totalPages ? '#a0aec0' : '#4a5568',
                  borderRadius: '8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: isMobile ? '0.8rem' : '1rem'
                }}
              >
                ▶️
              </button>
              
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: currentPage === totalPages ? '#f7fafc' : 'white',
                  color: currentPage === totalPages ? '#a0aec0' : '#4a5568',
                  borderRadius: '8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: isMobile ? '0.8rem' : '1rem'
                }}
              >
                ⏭️
              </button>
            </div>
          )}
        </section>
      )}

      {/* CSS Animation */}
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
      `}</style>
    </Layout>
  )
}
