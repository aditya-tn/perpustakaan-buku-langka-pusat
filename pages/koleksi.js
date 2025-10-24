import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import ErrorBoundary from '../components/ErrorBoundary'
import { supabase } from '../lib/supabase'

const ITEMS_PER_PAGE = 100

function Koleksi() {
  const [visibleBooks, setVisibleBooks] = useState([])
  const [allLoadedBooks, setAllLoadedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  
  // Filter states
  const [hurufFilter, setHurufFilter] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [sortBy, setSortBy] = useState('judul')
  const [sortOrder, setSortOrder] = useState('asc')
  const [viewMode, setViewMode] = useState('list')
  const [filtersApplied, setFiltersApplied] = useState(false)

  // Refs untuk debounce
  const filterTimeoutRef = useRef(null)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Back to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 1000)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Fungsi untuk mendapatkan karakter pertama dengan logika khusus
  const getFirstCharacter = useCallback((text) => {
    if (!text || typeof text !== 'string') return '#'
    
    const trimmedText = text.trim()
    if (!trimmedText) return '#'
    
    const firstChar = trimmedText.charAt(0)
    
    // Jika karakter pertama adalah angka (0-9)
    if (/[0-9]/.test(firstChar)) {
      return '#'
    }
    
    // Jika karakter pertama adalah huruf (A-Z, a-z)
    if (/[A-Za-z]/.test(firstChar)) {
      return firstChar.toUpperCase()
    }
    
    // Jika karakter pertama adalah karakter khusus
    // Cari huruf pertama dalam kata tersebut
    const words = trimmedText.split(/\s+/)
    for (let word of words) {
      if (word.length > 0) {
        const firstLetter = word.charAt(0)
        if (/[A-Za-z]/.test(firstLetter)) {
          return firstLetter.toUpperCase()
        }
      }
    }
    
    // Jika tidak ditemukan huruf sama sekali
    return '#'
  }, [])

  // Initial load
  useEffect(() => {
    loadInitialBooks()
  }, [])

  // Load first batch of books
  const loadInitialBooks = async () => {
    try {
      setLoading(true)
      setCurrentOffset(0) // Reset offset
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(0, ITEMS_PER_PAGE - 1)

      if (error) throw error
      
      setAllLoadedBooks(data || [])
      setVisibleBooks(data || [])
      setCurrentOffset(ITEMS_PER_PAGE)
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE)
      setFiltersApplied(false)
    } catch (error) {
      console.error('Error loading books:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load more books on scroll - HANYA untuk data tanpa filter
  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore || filtersApplied) return
    
    try {
      setLoadingMore(true)
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1)

      if (error) throw error
      
      const newBooks = data || []
      const updatedBooks = [...allLoadedBooks, ...newBooks]
      
      setAllLoadedBooks(updatedBooks)
      setVisibleBooks(updatedBooks) // Tampilkan semua data yang sudah diload
      setCurrentOffset(prev => prev + ITEMS_PER_PAGE)
      setHasMore(newBooks.length === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error loading more books:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, currentOffset, sortBy, sortOrder, allLoadedBooks, filtersApplied])

  // Infinite scroll detection - HANYA aktif ketika tidak ada filter
  useEffect(() => {
    if (filtersApplied) return; // Nonaktifkan infinite scroll saat filter aktif

    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        loadMoreBooks()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMoreBooks, filtersApplied])

  // Apply filters function dengan logika karakter pertama
  const applyFilters = useCallback(() => {
    if (!allLoadedBooks.length) return

    let result = [...allLoadedBooks]

    // Apply huruf filter dengan logika karakter pertama
    if (hurufFilter) {
      result = result.filter(book => {
        let fieldToCheck = ''
        
        if (sortBy === 'pengarang') {
          fieldToCheck = book.pengarang || ''
        } else if (sortBy === 'penerbit') {
          fieldToCheck = book.penerbit || ''
        } else {
          fieldToCheck = book.judul || ''
        }
        
        const firstChar = getFirstCharacter(fieldToCheck)
        
        if (hurufFilter === '#') {
          return firstChar === '#'
        } else {
          return firstChar === hurufFilter
        }
      })
    }

    // Apply tahun filter
    if (tahunFilter) {
      const [startYear, endYear] = tahunFilter.split('-').map(Number)
      result = result.filter(book => {
        const bookYear = parseInt(book.tahun_terbit) || 0
        return bookYear >= startYear && bookYear <= endYear
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortBy] || ''
      let bValue = b[sortBy] || ''
      
      if (!aValue && !bValue) return 0
      if (!aValue) return sortOrder === 'asc' ? 1 : -1
      if (!bValue) return sortOrder === 'asc' ? -1 : 1
      
      aValue = aValue.toString().toLowerCase().trim()
      bValue = bValue.toString().toLowerCase().trim()

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue, 'id', { numeric: true })
      } else {
        return bValue.localeCompare(aValue, 'id', { numeric: true })
      }
    })

    console.log(`✅ Filter results: ${result.length} books found`)
    setVisibleBooks(result)
    setFiltersApplied(true)
    setHasMore(false) // Nonaktifkan infinite scroll saat filter aktif
  }, [allLoadedBooks, hurufFilter, tahunFilter, sortBy, sortOrder, getFirstCharacter])

  // DEBOUNCE FILTERS - Auto apply setelah 500ms
  useEffect(() => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current)
    }

    filterTimeoutRef.current = setTimeout(() => {
      if (hurufFilter || tahunFilter) {
        applyFilters()
      } else {
        // Jika tidak ada filter, tampilkan semua data yang sudah diload
        setVisibleBooks(allLoadedBooks)
        setFiltersApplied(false)
        setHasMore(true) // Aktifkan kembali infinite scroll
      }
    }, 500)

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current)
      }
    }
  }, [hurufFilter, tahunFilter, applyFilters, allLoadedBooks])

  // Reset filters dan reload data asli
  const clearFilters = async () => {
    setHurufFilter('')
    setTahunFilter('')
    setSortBy('judul')
    setSortOrder('asc')
    setFiltersApplied(false)
    
    // Reset ke data awal (100 buku pertama)
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('judul', { ascending: true })
        .range(0, ITEMS_PER_PAGE - 1)

      if (error) throw error
      
      setAllLoadedBooks(data || [])
      setVisibleBooks(data || [])
      setCurrentOffset(ITEMS_PER_PAGE)
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error resetting filters:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate tahun ranges
  const generateYearRanges = () => {
    const ranges = []
    let start = 1547
    const end = 1990
    
    while (start <= end) {
      const rangeEnd = Math.min(start + 29, end)
      ranges.push(`${start}-${rangeEnd}`)
      start = rangeEnd + 1
    }
    
    return ranges
  }

  const yearRanges = generateYearRanges()

  // Komponen BookCard dan BookListItem tetap sama...
  // [KODE UNTUK BOOKCARD DAN BOOKLISTITEM SAMA SEPERTI SEBELUMNYA]

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Jelajahi seluruh koleksi buku langka Perpustakaan Nasional RI" />
      </Head>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: '800',
          marginBottom: '1rem',
          lineHeight: '1.2'
        }}>
          Koleksi Buku Langka
        </h1>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          opacity: 0.9,
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          Jelajahi khazanah literatur langka Indonesia
        </p>
      </section>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '2rem',
        gap: isMobile ? '1rem' : '2rem'
      }}>
        
        {/* Filter Sidebar */}
        <div style={{
          width: isMobile ? '100%' : '300px',
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          height: 'fit-content',
          position: isMobile ? 'static' : 'sticky',
          top: '100px'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#2d3748',
            marginBottom: '1.5rem'
          }}>
            🔍 Filter Koleksi
          </h3>

          {/* Auto-filter notice */}
          <div style={{
            backgroundColor: '#e6fffa',
            border: '1px solid #81e6d9',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            color: '#234e52'
          }}>
            ⚡ Filter diterapkan otomatis
            {filtersApplied && ' • Infinite scroll nonaktif'}
          </div>

          {/* Sort Options */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '1rem'
            }}>
              URUTKAN BERDASARKAN
            </h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                marginBottom: '0.75rem'
              }}
            >
              <option value="judul">Judul Buku</option>
              <option value="pengarang">Nama Pengarang</option>
              <option value="penerbit">Penerbit</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: sortOrder === 'asc' ? '#e6fffa' : '#fed7d7',
                cursor: 'pointer'
              }}
            >
              {sortOrder === 'asc' ? '↑ A-Z (Ascending)' : '↓ Z-A (Descending)'}
            </button>
          </div>

          {/* Filter by Huruf */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '1rem'
            }}>
              FILTER BERDASARKAN ABJAD
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setHurufFilter('')}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: hurufFilter === '' ? '#4299e1' : 'white',
                  color: hurufFilter === '' ? 'white' : '#4a5568',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                All
              </button>
              {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(huruf => (
                <button
                  key={huruf}
                  onClick={() => setHurufFilter(huruf)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    backgroundColor: hurufFilter === huruf ? '#4299e1' : 'white',
                    color: hurufFilter === huruf ? 'white' : '#4a5568',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {huruf}
                </button>
              ))}
              <button
                onClick={() => setHurufFilter('#')}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: hurufFilter === '#' ? '#4299e1' : 'white',
                  color: hurufFilter === '#' ? 'white' : '#4a5568',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
                title="Angka dan Karakter Khusus"
              >
                #
              </button>
            </div>
          </div>

          {/* Filter by Tahun */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '1rem'
            }}>
              FILTER TAHUN
            </h4>
            <select
              value={tahunFilter}
              onChange={(e) => setTahunFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            >
              <option value="">Semua Periode</option>
              {yearRanges.map(range => {
                const [start, end] = range.split('-')
                return (
                  <option key={range} value={range}>
                    {start} - {end}
                  </option>
                )
              })}
            </select>
          </div>

          {/* View Mode */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '1rem'
            }}>
              TAMPILAN
            </h4>
            <div style={{
              display: 'flex',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? '#4299e1' : 'white',
                  color: viewMode === 'list' ? 'white' : '#4a5568',
                  cursor: 'pointer'
                }}
              >
                ☰ List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? '#4299e1' : 'white',
                  color: viewMode === 'grid' ? 'white' : '#4a5568',
                  cursor: 'pointer'
                }}
              >
                ▦ Grid
              </button>
            </div>
          </div>

          {/* Reset Filters */}
          {(filtersApplied || hurufFilter || tahunFilter) && (
            <button
              onClick={clearFilters}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #f56565',
                borderRadius: '8px',
                backgroundColor: '#f56565',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🔄 Reset Semua Filter
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1 }}>
          {/* Results Info */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#2d3748',
                margin: 0
              }}>
                Koleksi Buku Langka
                {filtersApplied && (
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: '400',
                    color: '#718096',
                    marginLeft: '0.5rem'
                  }}>
                    (Hasil Filter)
                  </span>
                )}
              </h3>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#718096',
                backgroundColor: '#f7fafc',
                padding: '0.5rem 1rem',
                borderRadius: '6px'
              }}>
                📊 {visibleBooks.length} buku
                {!filtersApplied && hasMore && ' + scroll untuk lebih banyak'}
                {filtersApplied && ' (semua hasil filter)'}
              </div>
            </div>
          </div>

          {/* Books List/Grid */}
          <div style={{ minHeight: '500px' }}>
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#718096',
                backgroundColor: 'white',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <p>Memuat koleksi buku langka...</p>
              </div>
            ) : (
              <>
                {/* List View */}
                {viewMode === 'list' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginBottom: '2rem'
                  }}>
                    {visibleBooks.map((book) => (
                      <BookListItem key={book.id} book={book} isMobile={isMobile} />
                    ))}
                  </div>
                )}

                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    {visibleBooks.map((book) => (
                      <BookCard key={book.id} book={book} isMobile={isMobile} />
                    ))}
                  </div>
                )}

                {/* No Results */}
                {visibleBooks.length === 0 && !loading && (
                  <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: '#718096',
                    backgroundColor: 'white',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                    <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>Tidak ada buku ditemukan</h3>
                    <p>Silakan coba filter yang berbeda</p>
                    <button
                      onClick={clearFilters}
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#4299e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Tampilkan Semua Buku
                    </button>
                  </div>
                )}

                {/* Loading More - HANYA tampil ketika tidak ada filter */}
                {!filtersApplied && loadingMore && hasMore && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#718096',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    marginTop: '1rem'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid transparent',
                        borderTop: '2px solid #4299e1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span>Memuat lebih banyak buku...</span>
                    </div>
                  </div>
                )}

                {/* End of Results */}
                {!hasMore && visibleBooks.length > 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#718096',
                    marginTop: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '12px'
                  }}>
                    <p>
                      {filtersApplied 
                        ? `🎉 Semua hasil filter telah dimuat (${visibleBooks.length} buku)`
                        : `🎉 Semua buku telah dimuat (${visibleBooks.length} buku)`
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '30px',
            right: isMobile ? '20px' : '30px',
            width: isMobile ? '50px' : '60px',
            height: isMobile ? '50px' : '60px',
            backgroundColor: '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(66, 153, 225, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            zIndex: 1000
          }}
          title="Kembali ke atas"
        >
          ↑
        </button>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  )
}

// Export dengan Error Boundary
export default function KoleksiWithErrorBoundary(props) {
  return (
    <ErrorBoundary>
      <Koleksi {...props} />
    </ErrorBoundary>
  )
}
