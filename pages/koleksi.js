// pages/koleksi.js - FIXED RACE CONDITION + MOBILE OPTIMIZED
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
  const [showFilterSidebar, setShowFilterSidebar] = useState(false)
  
  // Filter states
  const [hurufFilter, setHurufFilter] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [sortBy, setSortBy] = useState('judul')
  const [sortOrder, setSortOrder] = useState('asc')
  const [viewMode, setViewMode] = useState('list')
  const [filtersApplied, setFiltersApplied] = useState(false)

  // Refs untuk track state secara synchronous
  const filterTimeoutRef = useRef(null)
  const isInitialLoad = useRef(true)
  const currentFiltersRef = useRef({
    hurufFilter: '',
    tahunFilter: '',
    sortBy: 'judul',
    sortOrder: 'asc'
  })

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setShowFilterSidebar(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Back to top visibility dengan bounce effect
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

  // Toggle filter sidebar untuk mobile
  const toggleFilterSidebar = () => {
    setShowFilterSidebar(!showFilterSidebar)
  }

  // Build query berdasarkan filter - GUNAKAN REF UNTUK KONSISTENSI
  const buildQuery = (offset = 0) => {
    const { hurufFilter: hf, tahunFilter: tf, sortBy: sb, sortOrder: so } = currentFiltersRef.current
    
    let query = supabase
      .from('books')
      .select('*')

    // Filter berdasarkan huruf
    if (hf && hf !== '#') {
      if (sb === 'pengarang') {
        query = query.ilike('pengarang', `${hf}%`)
      } else if (sb === 'penerbit') {
        query = query.ilike('penerbit', `${hf}%`)
      } else {
        query = query.ilike('judul', `${hf}%`)
      }
    }

    // Filter untuk karakter khusus (#)
    if (hf === '#') {
      if (sb === 'pengarang') {
        query = query.or('pengarang.not.ilike.[A-Za-z]%,pengarang.is.null')
      } else if (sb === 'penerbit') {
        query = query.or('penerbit.not.ilike.[A-Za-z]%,penerbit.is.null')
      } else {
        query = query.or('judul.not.ilike.[A-Za-z]%,judul.is.null')
      }
    }

    // Filter berdasarkan tahun
    if (tf) {
      const [startYear, endYear] = tf.split('-').map(Number)
      query = query.gte('tahun_terbit', startYear).lte('tahun_terbit', endYear)
    }

    // Sorting
    query = query.order(sb, { 
      ascending: so === 'asc',
      nullsFirst: false
    })

    // Pagination
    query = query.range(offset, offset + ITEMS_PER_PAGE - 1)

    return query
  }

  // Load data dengan filter - FIX RACE CONDITION
  const loadBooks = async (offset = 0, append = false) => {
    // Jika bukan append (load baru), reset loading state
    if (offset === 0 && !append) {
      setLoading(true)
      setVisibleBooks([]) // Clear dulu data sebelumnya
      setCurrentOffset(0) // Reset offset
    } else {
      setLoadingMore(true)
    }

    try {
      console.log('🔄 Loading books dengan filter:', { 
        ...currentFiltersRef.current,
        offset,
        append 
      })

      const query = buildQuery(offset)
      const { data, error } = await query

      if (error) throw error

      console.log('✅ Data received:', data?.length || 0, 'books')

      if (append) {
        setVisibleBooks(prev => [...prev, ...data])
      } else {
        setVisibleBooks(data || [])
      }

      setCurrentOffset(offset + ITEMS_PER_PAGE)
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE)
      setFiltersApplied(!!currentFiltersRef.current.hurufFilter || !!currentFiltersRef.current.tahunFilter)

    } catch (error) {
      console.error('Error loading books:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial load - HANYA saat pertama kali
  useEffect(() => {
    if (isInitialLoad.current) {
      loadBooks(0, false)
      isInitialLoad.current = false
    }
  }, [])

  // Load more books - GUNAKAN REF UNTUK KONSISTENSI
  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore) return
    await loadBooks(currentOffset, true)
  }, [loadingMore, hasMore, currentOffset])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        loadMoreBooks()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMoreBooks])

  // FIX RACE CONDITION: Update ref secara synchronous sebelum load data
  const updateFiltersAndLoad = useCallback((newFilters) => {
    // Update ref secara synchronous
    currentFiltersRef.current = { ...newFilters }
    
    // Load data dengan filter baru
    loadBooks(0, false)
    
    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Handler untuk filter huruf - FIX RACE CONDITION
  const handleHurufFilter = (huruf) => {
    console.log('🎯 Setting huruf filter to:', huruf)
    
    // Update state UI
    setHurufFilter(huruf)
    
    // Update ref dan load data secara synchronous
    const newFilters = {
      ...currentFiltersRef.current,
      hurufFilter: huruf
    }
    
    updateFiltersAndLoad(newFilters)
    
    // Di mobile, tutup sidebar setelah pilih filter
    if (isMobile) {
      setTimeout(() => setShowFilterSidebar(false), 500)
    }
  }

  // Handler untuk tahun filter - FIX RACE CONDITION
  const handleTahunFilter = (tahun) => {
    console.log('🎯 Setting tahun filter to:', tahun)
    
    // Update state UI
    setTahunFilter(tahun)
    
    // Update ref dan load data secara synchronous
    const newFilters = {
      ...currentFiltersRef.current,
      tahunFilter: tahun
    }
    
    updateFiltersAndLoad(newFilters)
  }

  // Handler untuk sort - FIX RACE CONDITION
  const handleSortChange = (field) => {
    console.log('🎯 Setting sort to:', field)
    
    // Update state UI
    setSortBy(field)
    
    // Update ref dan load data secara synchronous
    const newFilters = {
      ...currentFiltersRef.current,
      sortBy: field
    }
    
    updateFiltersAndLoad(newFilters)
  }

  const handleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    console.log('🎯 Setting sort order to:', newOrder)
    
    // Update state UI
    setSortOrder(newOrder)
    
    // Update ref dan load data secara synchronous
    const newFilters = {
      ...currentFiltersRef.current,
      sortOrder: newOrder
    }
    
    updateFiltersAndLoad(newFilters)
  }

  // Reset filters - FIX RACE CONDITION
  const clearFilters = () => {
    // Update semua state UI
    setHurufFilter('')
    setTahunFilter('')
    setSortBy('judul')
    setSortOrder('asc')
    
    // Update ref dan load data secara synchronous
    const newFilters = {
      hurufFilter: '',
      tahunFilter: '',
      sortBy: 'judul',
      sortOrder: 'asc'
    }
    
    updateFiltersAndLoad(newFilters)
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

  // Book Card Component dengan optimasi mobile + effects
  const BookCard = ({ book, isMobile }) => (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1rem' : '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
      }
    }}>
      <h4 style={{ 
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '0.75rem',
        fontSize: isMobile ? '0.95rem' : '1.1rem',
        lineHeight: '1.4',
        flex: 1
      }}>
        {book.judul}
      </h4>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ 
          fontSize: isMobile ? '0.75rem' : '0.9rem', 
          color: '#4a5568', 
          marginBottom: '0.25rem',
          lineHeight: '1.4'
        }}>
          <strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}
        </div>
        <div style={{ 
          fontSize: isMobile ? '0.75rem' : '0.9rem', 
          color: '#4a5568', 
          marginBottom: '0.25rem',
          lineHeight: '1.4'
        }}>
          <strong>Tahun:</strong> {book.tahun_terbit || 'Tidak diketahui'}
        </div>
        <div style={{ 
          fontSize: isMobile ? '0.75rem' : '0.9rem', 
          color: '#4a5568',
          lineHeight: '1.4'
        }}>
          <strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}
        </div>
      </div>

      {book.deskripsi_fisik && (
        <p style={{ 
          fontSize: isMobile ? '0.7rem' : '0.85rem', 
          color: '#718096', 
          marginTop: '0.75rem',
          lineHeight: '1.5',
          fontStyle: 'italic',
          flex: 1
        }}>
          {book.deskripsi_fisik.length > (isMobile ? 100 : 150) 
            ? `${book.deskripsi_fisik.substring(0, isMobile ? 100 : 150)}...` 
            : book.deskripsi_fisik
          }
        </p>
      )}

      <div style={{ 
        marginTop: '1.25rem', 
        display: 'flex', 
        gap: '0.5rem',
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
              padding: isMobile ? '0.4rem 0.7rem' : '0.5rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: isMobile ? '0.7rem' : '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              ':hover': {
                backgroundColor: '#3182ce',
                transform: 'scale(1.05)'
              }
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
              padding: isMobile ? '0.4rem 0.7rem' : '0.5rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: isMobile ? '0.7rem' : '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              ':hover': {
                backgroundColor: '#38a169',
                transform: 'scale(1.05)'
              }
            }}
          >
            📥 Pesan Koleksi
          </a>
        )}
      </div>
    </div>
  )

  // Book List Item Component dengan optimasi mobile + effects
  const BookListItem = ({ book, isMobile }) => (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '0.875rem' : '1.5rem',
      borderRadius: '10px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '0.75rem' : '1.5rem',
      alignItems: isMobile ? 'stretch' : 'center',
      transition: 'all 0.3s ease',
      ':hover': {
        transform: 'translateX(5px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }
    }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ 
          fontWeight: '600',
          color: '#2d3748',
          marginBottom: '0.5rem',
          fontSize: isMobile ? '0.95rem' : '1.1rem',
          lineHeight: '1.4'
        }}>
          {book.judul}
        </h4>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.5rem',
          fontSize: isMobile ? '0.75rem' : '0.9rem',
          color: '#4a5568',
          lineHeight: '1.4'
        }}>
          <div><strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}</div>
          <div><strong>Tahun:</strong> {book.tahun_terbit || 'Tidak diketahui'}</div>
          <div><strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}</div>
        </div>

        {book.deskripsi_fisik && (
          <p style={{ 
            fontSize: isMobile ? '0.7rem' : '0.85rem', 
            color: '#718096', 
            marginTop: '0.5rem',
            lineHeight: '1.5',
            fontStyle: 'italic'
          }}>
            {book.deskripsi_fisik.length > (isMobile ? 120 : 200) 
              ? `${book.deskripsi_fisik.substring(0, isMobile ? 120 : 200)}...` 
              : book.deskripsi_fisik
            }
          </p>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: isMobile ? 'center' : 'flex-end'
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
              fontSize: isMobile ? '0.7rem' : '0.85rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              ':hover': {
                backgroundColor: '#3182ce',
                transform: 'scale(1.05)'
              }
            }}
          >
            📖 OPAC
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
              fontSize: isMobile ? '0.7rem' : '0.85rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              ':hover': {
                backgroundColor: '#38a169',
                transform: 'scale(1.05)'
              }
            }}
          >
            📥 Pesan
          </a>
        )}
      </div>
    </div>
  )

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Jelajahi seluruh koleksi buku langka Perpustakaan Nasional RI" />
      </Head>

      {/* Hero Section dengan optimasi mobile */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '1.5rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2.5rem',
          fontWeight: '800',
          marginBottom: '1rem',
          lineHeight: '1.2'
        }}>
          Koleksi Buku Langka
        </h1>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1.2rem',
          opacity: 0.9,
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          Jelajahi khazanah literatur langka Indonesia
        </p>
      </section>

      {/* Mobile Filter Toggle Button */}
      {isMobile && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f7fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <button
            onClick={toggleFilterSidebar}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              backgroundColor: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)',
              transition: 'all 0.3s ease',
              ':hover': {
                backgroundColor: '#3182ce',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(66, 153, 225, 0.4)'
              }
            }}
          >
            🔍 {showFilterSidebar ? 'Tutup Filter' : 'Buka Filter'}
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '0' : '2rem',
        gap: isMobile ? '0' : '2rem',
        minHeight: 'calc(100vh - 200px)'
      }}>
        
        {/* Filter Sidebar - Desktop selalu tampil, Mobile conditional */}
        {(isMobile ? showFilterSidebar : true) && (
          <div style={{
            width: isMobile ? '100%' : '320px',
            backgroundColor: 'white',
            padding: isMobile ? '1.25rem 1rem' : '1.5rem',
            borderRadius: isMobile ? '0' : '12px',
            boxShadow: isMobile ? 'none' : '0 2px 10px rgba(0,0,0,0.1)',
            border: isMobile ? 'none' : '1px solid #e2e8f0',
            height: isMobile ? 'auto' : 'fit-content',
            position: isMobile ? 'static' : 'sticky',
            top: isMobile ? '0' : '100px',
            overflowY: isMobile ? 'auto' : 'visible',
            maxHeight: isMobile ? '80vh' : 'none',
            zIndex: isMobile ? 1000 : 'auto'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '700',
              color: '#2d3748',
              marginBottom: isMobile ? '1rem' : '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🔍 Filter Koleksi
              {isMobile && (
                <button
                  onClick={toggleFilterSidebar}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: '#718096',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      color: '#4299e1',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  ✕
                </button>
              )}
            </h3>

            {/* Auto-filter notice */}
            <div style={{
              backgroundColor: '#e6fffa',
              border: '1px solid #81e6d9',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: '#234e52'
            }}>
              ⚡ Filter diterapkan otomatis
            </div>

            {/* Sort Options dengan optimasi mobile */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4a5568',
                marginBottom: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Urutkan Berdasarkan
              </h4>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem' : '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  fontSize: isMobile ? '0.9rem' : '0.9rem',
                  outline: 'none',
                  marginBottom: '0.75rem',
                  transition: 'all 0.2s ease',
                  ':focus': {
                    borderColor: '#4299e1',
                    boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)'
                  }
                }}
              >
                <option value="judul">Judul Buku</option>
                <option value="pengarang">Nama Pengarang</option>
                <option value="penerbit">Penerbit</option>
              </select>
              
              <button
                onClick={handleSortOrder}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem' : '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: sortOrder === 'asc' ? '#e6fffa' : '#fed7d7',
                  color: '#2d3748',
                  fontSize: isMobile ? '0.9rem' : '0.9rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }
                }}
              >
                {sortOrder === 'asc' ? '↑ A-Z (Ascending)' : '↓ Z-A (Descending)'}
              </button>
            </div>

            {/* Filter by Huruf dengan optimasi mobile + effects */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4a5568',
                marginBottom: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Filter Berdasarkan Abjad
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.2rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => handleHurufFilter('')}
                  style={{
                    padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
                    border: '1px solid #e2e8f0',
                    backgroundColor: hurufFilter === '' ? '#4299e1' : 'white',
                    color: hurufFilter === '' ? 'white' : '#4a5568',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    minWidth: isMobile ? '35px' : '40px',
                    ':hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  All
                </button>
                {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(huruf => (
                  <button
                    key={huruf}
                    onClick={() => handleHurufFilter(huruf)}
                    style={{
                      padding: isMobile ? '0.35rem' : '0.5rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: hurufFilter === huruf ? '#4299e1' : 'white',
                      color: hurufFilter === huruf ? 'white' : '#4a5568',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      minWidth: isMobile ? '28px' : '30px',
                      ':hover': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      },
                      animation: hurufFilter === huruf ? 'bounce 0.5s ease' : 'none'
                    }}
                  >
                    {huruf}
                  </button>
                ))}
                <button
                  onClick={() => handleHurufFilter('#')}
                  style={{
                    padding: isMobile ? '0.35rem' : '0.5rem',
                    border: '1px solid #e2e8f0',
                    backgroundColor: hurufFilter === '#' ? '#4299e1' : 'white',
                    color: hurufFilter === '#' ? 'white' : '#4a5568',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    minWidth: isMobile ? '28px' : '30px',
                    ':hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                  title="Angka dan Karakter Khusus"
                >
                  #
                </button>
              </div>
            </div>

            {/* Filter by Tahun dengan optimasi mobile */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4a5568',
                marginBottom: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Filter Tahun
              </h4>
              <select
                value={tahunFilter}
                onChange={(e) => handleTahunFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem' : '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  fontSize: isMobile ? '0.9rem' : '0.9rem',
                  outline: 'none',
                  marginBottom: '1rem',
                  transition: 'all 0.2s ease',
                  ':focus': {
                    borderColor: '#4299e1',
                    boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)'
                  }
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

            {/* View Mode dengan optimasi mobile */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4a5568',
                marginBottom: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Tampilan
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
                    padding: isMobile ? '0.875rem' : '0.75rem 1rem',
                    border: 'none',
                    backgroundColor: viewMode === 'list' ? '#4299e1' : 'white',
                    color: viewMode === 'list' ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.9rem' : '0.9rem',
                    fontWeight: viewMode === 'list' ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  ☰ List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    flex: 1,
                    padding: isMobile ? '0.875rem' : '0.75rem 1rem',
                    border: 'none',
                    backgroundColor: viewMode === 'grid' ? '#4299e1' : 'white',
                    color: viewMode === 'grid' ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.9rem' : '0.9rem',
                    fontWeight: viewMode === 'grid' ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  ▦ Grid
                </button>
              </div>
            </div>

            {/* Reset Filters dengan effects */}
            {(filtersApplied || hurufFilter || tahunFilter) && (
              <button
                onClick={clearFilters}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem' : '0.75rem 1rem',
                  border: '1px solid #f56565',
                  borderRadius: '8px',
                  backgroundColor: '#f56565',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.9rem' : '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    backgroundColor: '#e53e3e',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(245, 101, 101, 0.4)'
                  }
                }}
              >
                🔄 Reset Semua Filter
              </button>
            )}
          </div>
        )}

        {/* Main Content Area dengan optimasi mobile */}
        <div style={{ 
          flex: 1,
          padding: isMobile ? '1rem' : '0'
        }}>
          {/* Results Info */}
          <div style={{
            backgroundColor: 'white',
            padding: isMobile ? '1rem' : '1.5rem',
            borderRadius: isMobile ? '0' : '12px',
            boxShadow: isMobile ? 'none' : '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: isMobile ? '1rem' : '1.5rem'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '1rem' 
            }}>
              <h3 style={{ 
                fontSize: isMobile ? '1.1rem' : '1.25rem', 
                fontWeight: '700',
                color: '#2d3748',
                margin: 0
              }}>
                Koleksi Buku Langka
                {filtersApplied && (
                  <span style={{
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    fontWeight: '400',
                    color: '#718096',
                    marginLeft: '0.5rem'
                  }}>
                    (Hasil Filter)
                  </span>
                )}
              </h3>
              <div style={{ 
                fontSize: isMobile ? '0.8rem' : '0.9rem', 
                color: '#718096',
                backgroundColor: '#f7fafc',
                padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: '500'
              }}>
                📊 Menampilkan: {visibleBooks.length} buku
                {hasMore && ' + scroll untuk lebih banyak'}
              </div>
            </div>
          </div>

          {/* Books List/Grid dengan optimasi mobile */}
          <div style={{ 
            minHeight: '500px',
            padding: isMobile ? '0' : '0 0.5rem'
          }}>
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: isMobile ? '3rem 1rem' : '4rem 2rem',
                color: '#718096',
                backgroundColor: 'white',
                borderRadius: isMobile ? '0' : '12px',
                boxShadow: isMobile ? 'none' : '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  fontSize: isMobile ? '2.5rem' : '3rem', 
                  marginBottom: '1rem',
                  animation: 'bounce 1s infinite'
                }}>📚</div>
                <p style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Memuat koleksi buku langka...</p>
              </div>
            ) : (
              <>
                {/* List View */}
                {viewMode === 'list' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '0.5rem' : '0.75rem',
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
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: isMobile ? '1rem' : '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    {visibleBooks.map((book) => (
                      <BookCard key={book.id} book={book} isMobile={isMobile} />
                    ))}
                  </div>
                )}

                {/* No Results dengan animasi */}
                {visibleBooks.length === 0 && !loading && (
                  <div style={{
                    textAlign: 'center',
                    padding: isMobile ? '3rem 1rem' : '4rem 2rem',
                    color: '#718096',
                    backgroundColor: 'white',
                    borderRadius: isMobile ? '0' : '12px',
                    boxShadow: isMobile ? 'none' : '0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ 
                      fontSize: isMobile ? '3rem' : '4rem', 
                      marginBottom: '1rem',
                      animation: 'bounce 1s'
                    }}>🔍</div>
                    <h3 style={{ 
                      color: '#4a5568', 
                      marginBottom: '0.5rem',
                      fontSize: isMobile ? '1.1rem' : '1.25rem'
                    }}>
                      Tidak ada buku ditemukan
                    </h3>
                    <p style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
                      Silakan coba filter yang berbeda
                    </p>
                    <button
                      onClick={clearFilters}
                      style={{
                        marginTop: '1rem',
                        padding: isMobile ? '0.75rem 1.25rem' : '0.75rem 1.5rem',
                        backgroundColor: '#4299e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        transition: 'all 0.2s ease',
                        ':hover': {
                          backgroundColor: '#3182ce',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      Tampilkan Semua Buku
                    </button>
                  </div>
                )}

                {/* Loading More */}
                {loadingMore && hasMore && (
                  <div style={{
                    textAlign: 'center',
                    padding: isMobile ? '1.5rem' : '2rem',
                    color: '#718096',
                    backgroundColor: 'white',
                    borderRadius: isMobile ? '0' : '12px',
                    boxShadow: isMobile ? 'none' : '0 2px 10px rgba(0,0,0,0.1)',
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
                      <span style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
                        Memuat lebih banyak buku...
                      </span>
                    </div>
                  </div>
                )}

                {/* End of Results dengan animasi */}
                {!hasMore && visibleBooks.length > 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: isMobile ? '1.5rem' : '2rem',
                    color: '#718096',
                    marginTop: '2rem',
                    backgroundColor: 'white',
                    borderRadius: isMobile ? '0' : '12px',
                    boxShadow: isMobile ? 'none' : '0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    <p style={{ 
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      animation: 'bounce 0.5s'
                    }}>
                      🎉 Semua hasil telah dimuat ({visibleBooks.length} buku)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Back to Top Button dengan bounce effect */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: isMobile ? '70px' : '30px',
            right: isMobile ? '15px' : '30px',
            width: isMobile ? '45px' : '60px',
            height: isMobile ? '45px' : '60px',
            backgroundColor: '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(66, 153, 225, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '1.1rem' : '1.5rem',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            animation: 'bounce 2s infinite',
            ':hover': {
              backgroundColor: '#3182ce',
              transform: 'scale(1.1)'
            }
          }}
          title="Kembali ke atas"
        >
          ↑
        </button>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-5px);
          }
          60% {
            transform: translateY(-3px);
          }
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
