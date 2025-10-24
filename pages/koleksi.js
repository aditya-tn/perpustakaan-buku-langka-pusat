// pages/koleksi.js - PRODUCTION OPTIMIZED VERSION
import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import ErrorBoundary from '../components/ErrorBoundary'
import { supabase } from '../lib/supabase'

const ITEMS_PER_PAGE = 100

function Koleksi() {
  const [visibleBooks, setVisibleBooks] = useState([])
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
  const [viewMode, setViewMode] = useState('grid')

  // Refs
  const isInitialLoad = useRef(true)
  const dataVersion = useRef(0)

  // Optimized mobile detection dengan debounce
  useEffect(() => {
    let timeoutId
    const checkMobile = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768)
      }, 100)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      window.removeEventListener('resize', checkMobile)
      clearTimeout(timeoutId)
    }
  }, [])

  // Optimized scroll handler
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowBackToTop(window.scrollY > 1000)
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Optimized query builder
  const buildQuery = (offset = 0) => {
    let query = supabase.from('books').select('*')

    if (hurufFilter && hurufFilter !== '#') {
      if (sortBy === 'pengarang') {
        query = query.ilike('pengarang', `${hurufFilter}%`)
      } else if (sortBy === 'penerbit') {
        query = query.ilike('penerbit', `${hurufFilter}%`)
      } else {
        query = query.ilike('judul', `${hurufFilter}%`)
      }
    }

    if (hurufFilter === '#') {
      if (sortBy === 'pengarang') {
        query = query.or('pengarang.not.ilike.[A-Za-z]%,pengarang.is.null')
      } else if (sortBy === 'penerbit') {
        query = query.or('penerbit.not.ilike.[A-Za-z]%,penerbit.is.null')
      } else {
        query = query.or('judul.not.ilike.[A-Za-z]%,judul.is.null')
      }
    }

    if (tahunFilter) {
      const [startYear, endYear] = tahunFilter.split('-').map(Number)
      query = query.gte('tahun_terbit', startYear).lte('tahun_terbit', endYear)
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    return query.range(offset, offset + ITEMS_PER_PAGE - 1)
  }

  // Optimized load function
  const loadBooks = useCallback(async (offset = 0, append = false) => {
    if (offset === 0 && !append) {
      setLoading(true)
      setVisibleBooks([])
      setCurrentOffset(0)
    } else {
      setLoadingMore(true)
    }

    try {
      const query = buildQuery(offset)
      const { data, error } = await query

      if (error) throw error

      if (append) {
        setVisibleBooks(prev => [...prev, ...data])
      } else {
        setVisibleBooks(data || [])
        dataVersion.current += 1
      }

      setCurrentOffset(offset + ITEMS_PER_PAGE)
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE)

    } catch (error) {
      console.error('Error loading books:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [hurufFilter, tahunFilter, sortBy, sortOrder])

  // Initial load
  useEffect(() => {
    if (isInitialLoad.current) {
      loadBooks(0, false)
      isInitialLoad.current = false
    }
  }, [loadBooks])

  // Optimized infinite scroll dengan throttle
  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore) return
    await loadBooks(currentOffset, true)
  }, [loadingMore, hasMore, currentOffset, loadBooks])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
            loadMoreBooks()
          }
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMoreBooks])

  // Filter effect
  useEffect(() => {
    if (isInitialLoad.current) return
    
    setLoading(true)
    const timer = setTimeout(() => {
      loadBooks(0, false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 150)
    
    return () => clearTimeout(timer)
  }, [hurufFilter, tahunFilter, sortBy, sortOrder, loadBooks])

  // Handlers
  const handleHurufFilter = (huruf) => {
    setHurufFilter(huruf)
  }

  const handleTahunFilter = (tahun) => {
    setTahunFilter(tahun)
  }

  const handleSortChange = (field) => {
    setSortBy(field)
  }

  const handleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const clearFilters = () => {
    setHurufFilter('')
    setTahunFilter('')
    setSortBy('judul')
    setSortOrder('asc')
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

  // Optimized Components dengan better styling
  const BookCard = ({ book, isMobile }) => (
    <div className="book-card">
      <h4 className="book-title">
        {book.judul}
      </h4>
      
      <div className="book-meta">
        <div className="meta-item">
          <span className="meta-label">Pengarang:</span>
          <span className="meta-value">{book.pengarang || 'Tidak diketahui'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Tahun:</span>
          <span className="meta-value">{book.tahun_terbit || 'Tidak diketahui'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Penerbit:</span>
          <span className="meta-value">{book.penerbit || 'Tidak diketahui'}</span>
        </div>
      </div>

      {book.deskripsi_fisik && (
        <p className="book-description">
          {book.deskripsi_fisik.length > 120 ? `${book.deskripsi_fisik.substring(0, 120)}...` : book.deskripsi_fisik}
        </p>
      )}

      <div className="book-actions">
        {book.lihat_opac && book.lihat_opac !== 'null' && (
          <a href={book.lihat_opac} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <span className="btn-icon">📖</span>
            Lihat OPAC
          </a>
        )}
        {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
          <a href={book.link_pesan_koleksi} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <span className="btn-icon">📥</span>
            Pesan Koleksi
          </a>
        )}
      </div>

      <style jsx>{`
        .book-card {
          background: white;
          padding: ${isMobile ? '1rem' : '1.25rem'};
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid #f0f0f0;
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .book-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }
        
        .book-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.75rem;
          font-size: ${isMobile ? '0.95rem' : '1.05rem'};
          line-height: 1.4;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .book-meta {
          margin-bottom: 1rem;
        }
        
        .meta-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.375rem;
          font-size: ${isMobile ? '0.8rem' : '0.85rem'};
        }
        
        .meta-label {
          font-weight: 600;
          color: #4a5568;
          min-width: 60px;
          flex-shrink: 0;
        }
        
        .meta-value {
          color: #718096;
          flex: 1;
        }
        
        .book-description {
          font-size: ${isMobile ? '0.75rem' : '0.8rem'};
          color: #718096;
          margin-top: 0.75rem;
          line-height: 1.5;
          font-style: italic;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .book-actions {
          margin-top: 1.25rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: ${isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem'};
          border-radius: 8px;
          text-decoration: none;
          font-size: ${isMobile ? '0.75rem' : '0.8rem'};
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          transition: all 0.2s ease;
          flex: 1;
          justify-content: center;
          min-width: fit-content;
        }
        
        .btn-primary {
          background: #4299e1;
          color: white;
        }
        
        .btn-primary:hover {
          background: #3182ce;
          transform: translateY(-1px);
        }
        
        .btn-secondary {
          background: #48bb78;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #38a169;
          transform: translateY(-1px);
        }
        
        .btn-icon {
          font-size: 0.9em;
        }
      `}</style>
    </div>
  )

  const BookListItem = ({ book, isMobile }) => (
    <div className="book-list-item">
      <div className="book-content">
        <h4 className="book-title">
          {book.judul}
        </h4>
        <div className="book-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Pengarang:</span>
            <span className="meta-value">{book.pengarang || 'Tidak diketahui'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Tahun:</span>
            <span className="meta-value">{book.tahun_terbit || 'Tidak diketahui'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Penerbit:</span>
            <span className="meta-value">{book.penerbit || 'Tidak diketahui'}</span>
          </div>
        </div>
        {book.deskripsi_fisik && (
          <p className="book-description">
            {book.deskripsi_fisik.length > 150 ? `${book.deskripsi_fisik.substring(0, 150)}...` : book.deskripsi_fisik}
          </p>
        )}
      </div>
      <div className="book-actions">
        {book.lihat_opac && book.lihat_opac !== 'null' && (
          <a href={book.lihat_opac} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <span className="btn-icon">📖</span>
            OPAC
          </a>
        )}
        {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
          <a href={book.link_pesan_koleksi} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <span className="btn-icon">📥</span>
            Pesan
          </a>
        )}
      </div>

      <style jsx>{`
        .book-list-item {
          background: white;
          padding: ${isMobile ? '1rem' : '1.25rem'};
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: ${isMobile ? 'column' : 'row'};
          gap: ${isMobile ? '1rem' : '1.5rem'};
          align-items: ${isMobile ? 'stretch' : 'center'};
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .book-list-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .book-content {
          flex: 1;
        }
        
        .book-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-size: ${isMobile ? '0.95rem' : '1.05rem'};
          line-height: 1.4;
        }
        
        .book-meta-grid {
          display: grid;
          grid-template-columns: ${isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))'};
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .meta-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: ${isMobile ? '0.8rem' : '0.85rem'};
        }
        
        .meta-label {
          font-weight: 600;
          color: #4a5568;
          min-width: 70px;
          flex-shrink: 0;
        }
        
        .meta-value {
          color: #718096;
        }
        
        .book-description {
          font-size: ${isMobile ? '0.75rem' : '0.8rem'};
          color: #718096;
          margin-top: 0.5rem;
          line-height: 1.5;
          font-style: italic;
        }
        
        .book-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: ${isMobile ? 'center' : 'flex-end'};
        }
        
        .btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .btn-primary {
          background: #4299e1;
          color: white;
        }
        
        .btn-primary:hover {
          background: #3182ce;
        }
        
        .btn-secondary {
          background: #48bb78;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #38a169;
        }
        
        .btn-icon {
          font-size: 0.9em;
        }
      `}</style>
    </div>
  )

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Jelajahi seluruh koleksi buku langka Perpustakaan Nasional RI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Koleksi Buku Langka
          </h1>
          <p className="hero-subtitle">
            Jelajahi khazanah literatur langka Indonesia
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div 
        key={`main-${dataVersion.current}`}
        className="main-container"
      >
        
        {/* Filter Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3 className="sidebar-title">
              🔍 Filter Koleksi
            </h3>
          </div>

          {/* Sort Options */}
          <div className="filter-group">
            <h4 className="filter-label">
              URUTKAN BERDASARKAN
            </h4>
            <select 
              value={sortBy} 
              onChange={(e) => handleSortChange(e.target.value)} 
              className="filter-select"
            >
              <option value="judul">Judul Buku</option>
              <option value="pengarang">Nama Pengarang</option>
              <option value="penerbit">Penerbit</option>
            </select>
            <button 
              onClick={handleSortOrder} 
              className={`sort-order-btn ${sortOrder === 'asc' ? 'asc' : 'desc'}`}
            >
              {sortOrder === 'asc' ? '↑ A-Z (Ascending)' : '↓ Z-A (Descending)'}
            </button>
          </div>

          {/* Filter by Huruf */}
          <div className="filter-group">
            <h4 className="filter-label">
              FILTER BERDASARKAN ABJAD
            </h4>
            <div className="huruf-filter-grid">
              <button 
                onClick={() => handleHurufFilter('')} 
                className={`huruf-btn ${hurufFilter === '' ? 'active' : ''}`}
              >
                All
              </button>
              {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(huruf => (
                <button 
                  key={huruf} 
                  onClick={() => handleHurufFilter(huruf)} 
                  className={`huruf-btn ${hurufFilter === huruf ? 'active' : ''}`}
                >
                  {huruf}
                </button>
              ))}
              <button 
                onClick={() => handleHurufFilter('#')} 
                className={`huruf-btn ${hurufFilter === '#' ? 'active' : ''}`}
                title="Angka dan Karakter Khusus"
              >
                #
              </button>
            </div>
          </div>

          {/* Filter by Tahun */}
          <div className="filter-group">
            <h4 className="filter-label">
              FILTER TAHUN
            </h4>
            <select 
              value={tahunFilter} 
              onChange={(e) => handleTahunFilter(e.target.value)} 
              className="filter-select"
            >
              <option value="">Semua Periode</option>
              {yearRanges.map(range => {
                const [start, end] = range.split('-')
                return <option key={range} value={range}>{start} - {end}</option>
              })}
            </select>
          </div>

          {/* View Mode */}
          <div className="filter-group">
            <h4 className="filter-label">
              TAMPILAN
            </h4>
            <div className="view-mode-toggle">
              <button 
                onClick={() => setViewMode('list')} 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                ☰ List
              </button>
              <button 
                onClick={() => setViewMode('grid')} 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              >
                ▦ Grid
              </button>
            </div>
          </div>

          {/* Reset Filters */}
          {(hurufFilter || tahunFilter) && (
            <button 
              onClick={clearFilters} 
              className="reset-filters-btn"
            >
              🔄 Reset Semua Filter
            </button>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="content-area">
          <div className="content-header">
            <div className="header-content">
              <h3 className="content-title">
                Koleksi Buku Langka {hurufFilter && `(Filter: ${hurufFilter})`}
              </h3>
              <div className="results-count">
                📊 Total: {visibleBooks.length} buku{hasMore && ' + scroll untuk lebih banyak'}
                {loading && ' (Loading...)'}
              </div>
            </div>
          </div>

          <div className="books-container">
            {loading ? (
              <div className="loading-state">
                <div className="loading-icon">📚</div>
                <p>Memuat koleksi buku langka...</p>
              </div>
            ) : (
              <>
                {viewMode === 'list' && (
                  <div className="books-list">
                    {visibleBooks.map((book, index) => (
                      <BookListItem 
                        key={`${book.id}-${dataVersion.current}-${index}`}
                        book={book} 
                        isMobile={isMobile} 
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'grid' && (
                  <div className="books-grid">
                    {visibleBooks.map((book, index) => (
                      <BookCard 
                        key={`${book.id}-${dataVersion.current}-${index}`}
                        book={book} 
                        isMobile={isMobile} 
                      />
                    ))}
                  </div>
                )}

                {visibleBooks.length === 0 && !loading && (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>Tidak ada buku ditemukan</h3>
                    <p>Silakan coba filter yang berbeda</p>
                    <button 
                      onClick={clearFilters} 
                      className="show-all-btn"
                    >
                      Tampilkan Semua Buku
                    </button>
                  </div>
                )}

                {loadingMore && hasMore && (
                  <div className="loading-more">
                    <div className="spinner"></div>
                    <span>Memuat lebih banyak buku...</span>
                  </div>
                )}

                {!hasMore && visibleBooks.length > 0 && (
                  <div className="end-results">
                    <p>🎉 Semua hasil telah dimuat ({visibleBooks.length} buku)</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button 
          onClick={scrollToTop} 
          className="back-to-top"
          aria-label="Kembali ke atas"
        >
          ↑
        </button>
      )}

      <style jsx>{`
        /* Global Styles */
        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: ${isMobile ? '2rem 1rem' : '3rem 2rem'};
          text-align: center;
        }
        
        .hero-content {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .hero-title {
          font-size: ${isMobile ? '1.75rem' : '2.5rem'};
          font-weight: 800;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        
        .hero-subtitle {
          font-size: ${isMobile ? '1rem' : '1.2rem'};
          opacity: 0.9;
          line-height: 1.5;
        }
        
        .main-container {
          display: flex;
          flex-direction: ${isMobile ? 'column' : 'row'};
          max-width: 1400px;
          margin: 0 auto;
          padding: ${isMobile ? '1rem' : '2rem'};
          gap: ${isMobile ? '1rem' : '2rem'};
          min-height: 80vh;
        }
        
        /* Sidebar Styles */
        .sidebar {
          width: ${isMobile ? '100%' : '300px'};
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
          position: ${isMobile ? 'static' : 'sticky'};
          top: 100px;
        }
        
        .sidebar-header {
          margin-bottom: 1.5rem;
        }
        
        .sidebar-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }
        
        .filter-group {
          margin-bottom: 2rem;
        }
        
        .filter-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .filter-select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          background: white;
          transition: border-color 0.2s ease;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }
        
        .sort-order-btn {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        
        .sort-order-btn.asc {
          background: #e6fffa;
          color: #234e52;
        }
        
        .sort-order-btn.desc {
          background: #fed7d7;
          color: #742a2a;
        }
        
        .sort-order-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .huruf-filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(35px, 1fr));
          gap: 0.375rem;
        }
        
        .huruf-btn {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          background: white;
          color: #4a5568;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.2s ease;
          min-height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .huruf-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        
        .huruf-btn.active {
          background: #4299e1;
          color: white;
          border-color: #4299e1;
        }
        
        .view-mode-toggle {
          display: flex;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .view-btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          background: white;
          color: #4a5568;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        
        .view-btn.active {
          background: #4299e1;
          color: white;
        }
        
        .view-btn:hover:not(.active) {
          background: #f7fafc;
        }
        
        .reset-filters-btn {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #f56565;
          border-radius: 8px;
          background: #f56565;
          color: white;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .reset-filters-btn:hover {
          background: #e53e3e;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(245, 101, 101, 0.3);
        }
        
        /* Content Area Styles */
        .content-area {
          flex: 1;
          min-width: 0; /* Untuk mencegah overflow */
        }
        
        .content-header {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .content-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }
        
        .results-count {
          font-size: 0.9rem;
          color: #718096;
          background: #f7fafc;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
        }
        
        .books-container {
          min-height: 500px;
        }
        
        .books-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        
        .books-grid {
          display: grid;
          grid-template-columns: ${isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))'};
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        /* Loading States */
        .loading-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #718096;
          background: white;
          border-radius: 12px;
        }
        
        .loading-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          animation: bounce 2s infinite;
        }
        
        .loading-more {
          text-align: center;
          padding: 2rem;
          color: #718096;
          background: white;
          border-radius: 12px;
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid #4299e1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #718096;
          background: white;
          border-radius: 12px;
        }
        
        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        
        .empty-state h3 {
          color: #4a5568;
          margin-bottom: 0.5rem;
        }
        
        .show-all-btn {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .show-all-btn:hover {
          background: #3182ce;
          transform: translateY(-1px);
        }
        
        .end-results {
          text-align: center;
          padding: 2rem;
          color: #718096;
          margin-top: 2rem;
          background: white;
          border-radius: 12px;
        }
        
        /* Back to Top Button */
        .back-to-top {
          position: fixed;
          bottom: ${isMobile ? '80px' : '30px'};
          right: ${isMobile ? '20px' : '30px'};
          width: ${isMobile ? '50px' : '60px'};
          height: ${isMobile ? '50px' : '60px'};
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isMobile ? '1.2rem' : '1.5rem'};
          z-index: 1000;
          transition: all 0.3s ease;
        }
        
        .back-to-top:hover {
          background: #3182ce;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(66, 153, 225, 0.5);
        }
        
        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .huruf-filter-grid {
            grid-template-columns: repeat(auto-fit, minmax(32px, 1fr));
            gap: 0.25rem;
          }
          
          .huruf-btn {
            padding: 0.4rem;
            font-size: 0.75rem;
            min-height: 32px;
          }
          
          .books-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        
        @media (max-width: 480px) {
          .hero-section {
            padding: 1.5rem 1rem;
          }
          
          .hero-title {
            font-size: 1.5rem;
          }
          
          .hero-subtitle {
            font-size: 0.9rem;
          }
          
          .main-container {
            padding: 0.75rem;
          }
          
          .sidebar {
            padding: 1rem;
          }
        }
      `}</style>
    </Layout>
  )
}

export default function KoleksiWithErrorBoundary(props) {
  return (
    <ErrorBoundary>
      <Koleksi {...props} />
    </ErrorBoundary>
  )
}
