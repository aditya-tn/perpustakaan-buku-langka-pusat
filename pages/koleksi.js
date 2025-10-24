// pages/koleksi.js - FIXED BUILD VERSION
import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import ErrorBoundary from '../components/ErrorBoundary'
import { supabase } from '../lib/supabase'

const ITEMS_PER_PAGE = 100

// Force Update Hook
function useForceUpdate() {
  const [_, forceUpdate] = useState(0);
  return useCallback(() => forceUpdate(prev => prev + 1), []);
}

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
  const [viewMode, setViewMode] = useState('list')

  // Refs & Force Update
  const isInitialLoad = useRef(true)
  const forceUpdate = useForceUpdate()
  const renderKey = useRef(0)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Back to top
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 1000)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Enhanced setVisibleBooks dengan force render
  const setVisibleBooksEnhanced = useCallback((newData) => {
    console.log('🔄 SET VISIBLE BOOKS ENHANCED:', newData?.length || 0)
    
    // Method 1: Clear dulu untuk memastikan perubahan terdeteksi
    setVisibleBooks([]);
    
    // Beri waktu untuk React memproses clear state
    setTimeout(() => {
      // Clone array untuk reference baru
      const clonedData = newData ? [...newData] : [];
      setVisibleBooks(clonedData);
      console.log('✅ Data baru di-set:', clonedData.length);
      
      // Increment render key untuk force re-render
      renderKey.current += 1;
      
      // Force update tambahan
      setTimeout(() => {
        forceUpdate();
        console.log('🎯 Force update executed, renderKey:', renderKey.current);
      }, 50);
    }, 0);
  }, [forceUpdate]);

  // Build query
  const buildQuery = (offset = 0) => {
    console.log('🔧 BUILD QUERY dengan:', { hurufFilter, tahunFilter, sortBy, sortOrder, offset })
    
    let query = supabase.from('books').select('*')

    if (hurufFilter && hurufFilter !== '#') {
      console.log('🎯 Menerapkan filter huruf:', hurufFilter, 'pada field:', sortBy)
      if (sortBy === 'pengarang') {
        query = query.ilike('pengarang', `${hurufFilter}%`)
      } else if (sortBy === 'penerbit') {
        query = query.ilike('penerbit', `${hurufFilter}%`)
      } else {
        query = query.ilike('judul', `${hurufFilter}%`)
      }
    }

    if (hurufFilter === '#') {
      console.log('🎯 Menerapkan filter karakter khusus')
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
      console.log('🎯 Menerapkan filter tahun:', startYear, '-', endYear)
      query = query.gte('tahun_terbit', startYear).lte('tahun_terbit', endYear)
    }

    console.log('🎯 Sorting by:', sortBy, 'order:', sortOrder)
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    console.log('🎯 Pagination offset:', offset, 'limit:', ITEMS_PER_PAGE)
    return query.range(offset, offset + ITEMS_PER_PAGE - 1)
  }

  // Load data - ENHANCED VERSION
  const loadBooks = async (offset = 0, append = false) => {
    console.log('🚀 LOAD BOOKS dipanggil dengan:', { offset, append, hurufFilter, tahunFilter })
    
    if (offset === 0 && !append) {
      console.log('🔄 RESET loading state')
      setLoading(true)
      setVisibleBooksEnhanced([]) // Pakai enhanced version
      setCurrentOffset(0)
    } else {
      setLoadingMore(true)
    }

    try {
      const query = buildQuery(offset)
      console.log('📡 Executing Supabase query...')
      
      const { data, error } = await query

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('✅ DATA DITERIMA:', data?.length || 0, 'buku')
      if (data && data.length > 0) {
        console.log('📖 Contoh buku pertama:', data[0].judul)
      }

      if (append) {
        console.log('📥 Append data ke existing')
        setVisibleBooks(prev => {
          const newData = [...prev, ...data]
          console.log('📊 Total data setelah append:', newData.length)
          return newData
        })
      } else {
        console.log('🆕 Set data baru dengan enhanced handler')
        setVisibleBooksEnhanced(data || []) // Pakai enhanced version
      }

      setCurrentOffset(offset + ITEMS_PER_PAGE)
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE)

    } catch (error) {
      console.error('❌ Error loading books:', error)
    } finally {
      console.log('🏁 Loading selesai')
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial load
  useEffect(() => {
    console.log('🎬 INITIAL LOAD effect')
    if (isInitialLoad.current) {
      console.log('🆕 First load, memanggil loadBooks...')
      loadBooks(0, false)
      isInitialLoad.current = false
    }
  }, [])

  // Load more
  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore) return
    console.log('⬇️ Load more books...')
    await loadBooks(currentOffset, true)
  }, [loadingMore, hasMore, currentOffset, loadBooks])

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

  // EFFECT UTAMA: Handle perubahan filter - ENHANCED
  useEffect(() => {
    console.log('🔄 FILTER EFFECT triggered')
    console.log('📊 Current state:', { hurufFilter, tahunFilter, sortBy, sortOrder })
    console.log('🏷️ isInitialLoad:', isInitialLoad.current)
    
    if (isInitialLoad.current) {
      console.log('⏩ Skip initial load')
      return
    }

    console.log('🎯 Filter berubah, memanggil loadBooks...')
    
    // Reset dan load dengan delay untuk memastikan state ter-update
    setLoading(true)
    setTimeout(() => {
      loadBooks(0, false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
    
  }, [hurufFilter, tahunFilter, sortBy, sortOrder, loadBooks])

  // Enhanced Handlers dengan debug
  const handleHurufFilter = (huruf) => {
    console.log('=========================================')
    console.log('🎯 HANDLE HURUF FILTER:', huruf)
    console.log('📝 Sebelum setHurufFilter:', hurufFilter)
    setHurufFilter(huruf)
    console.log('📝 Setelah setHurufFilter - state akan diupdate')
    
    // Force update setelah state change
    setTimeout(() => {
      console.log('🔄 Force update setelah filter huruf')
      forceUpdate()
    }, 50)
  }

  const handleTahunFilter = (tahun) => {
    console.log('=========================================')
    console.log('🎯 HANDLE TAHUN FILTER:', tahun)
    console.log('📝 Sebelum setTahunFilter:', tahunFilter)
    setTahunFilter(tahun)
    console.log('📝 Setelah setTahunFilter - state akan diupdate')
    
    setTimeout(() => {
      console.log('🔄 Force update setelah filter tahun')
      forceUpdate()
    }, 50)
  }

  const handleSortChange = (field) => {
    console.log('=========================================')
    console.log('🎯 HANDLE SORT CHANGE:', field)
    setSortBy(field)
    setTimeout(() => forceUpdate(), 50)
  }

  const handleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    console.log('=========================================')
    console.log('🎯 HANDLE SORT ORDER:', newOrder)
    setSortOrder(newOrder)
    setTimeout(() => forceUpdate(), 50)
  }

  const clearFilters = () => {
    console.log('=========================================')
    console.log('🔄 CLEAR ALL FILTERS')
    setHurufFilter('')
    setTahunFilter('')
    setSortBy('judul')
    setSortOrder('asc')
    setTimeout(() => {
      forceUpdate()
      console.log('✅ Filters cleared, force update executed')
    }, 100)
  }

  // Debug effect untuk monitor state changes
  useEffect(() => {
    console.log('📊 VISIBLE BOOKS STATE UPDATED:', {
      length: visibleBooks.length,
      firstItem: visibleBooks[0]?.judul,
      renderKey: renderKey.current,
      timestamp: new Date().toISOString()
    })
  }, [visibleBooks])

  useEffect(() => {
    console.log('🔄 COMPONENT RE-RENDERED')
  })

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

  // Simple Components
  const BookCard = ({ book, isMobile }) => (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1rem' : '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h4 style={{ 
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '0.75rem',
        fontSize: isMobile ? '1rem' : '1.1rem',
        lineHeight: '1.4',
        flex: 1
      }}>
        {book.judul}
      </h4>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#4a5568', marginBottom: '0.25rem' }}>
          <strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}
        </div>
        <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#4a5568', marginBottom: '0.25rem' }}>
          <strong>Tahun:</strong> {book.tahun_terbit || 'Tidak diketahui'}
        </div>
        <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#4a5568' }}>
          <strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}
        </div>
      </div>

      {book.deskripsi_fisik && (
        <p style={{ 
          fontSize: isMobile ? '0.75rem' : '0.85rem', 
          color: '#718096', 
          marginTop: '0.75rem',
          lineHeight: '1.5',
          fontStyle: 'italic',
          flex: 1
        }}>
          {book.deskripsi_fisik.length > 150 ? `${book.deskripsi_fisik.substring(0, 150)}...` : book.deskripsi_fisik}
        </p>
      )}

      <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {book.lihat_opac && book.lihat_opac !== 'null' && (
          <a href={book.lihat_opac} target="_blank" rel="noopener noreferrer" style={{
            backgroundColor: '#4299e1', 
            color: 'white', 
            padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
            borderRadius: '6px', 
            textDecoration: 'none', 
            fontSize: isMobile ? '0.75rem' : '0.85rem', 
            fontWeight: '500'
          }}>
            📖 Lihat OPAC
          </a>
        )}
        {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
          <a href={book.link_pesan_koleksi} target="_blank" rel="noopener noreferrer" style={{
            backgroundColor: '#48bb78', 
            color: 'white', 
            padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
            borderRadius: '6px', 
            textDecoration: 'none', 
            fontSize: isMobile ? '0.75rem' : '0.85rem', 
            fontWeight: '500'
          }}>
            📥 Pesan Koleksi
          </a>
        )}
      </div>
    </div>
  )

  const BookListItem = ({ book, isMobile }) => (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1rem' : '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '1rem' : '2rem',
      alignItems: isMobile ? 'stretch' : 'center'
    }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ 
          fontWeight: '600', 
          color: '#2d3748', 
          marginBottom: '0.5rem', 
          fontSize: isMobile ? '1rem' : '1.1rem' 
        }}>
          {book.judul}
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '0.5rem', 
          fontSize: isMobile ? '0.8rem' : '0.9rem', 
          color: '#4a5568' 
        }}>
          <div><strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}</div>
          <div><strong>Tahun:</strong> {book.tahun_terbit || 'Tidak diketahui'}</div>
          <div><strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}</div>
        </div>
        {book.deskripsi_fisik && (
          <p style={{ 
            fontSize: isMobile ? '0.75rem' : '0.85rem', 
            color: '#718096', 
            marginTop: '0.5rem', 
            lineHeight: '1.5', 
            fontStyle: 'italic' 
          }}>
            {book.deskripsi_fisik.length > 200 ? `${book.deskripsi_fisik.substring(0, 200)}...` : book.deskripsi_fisik}
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
          <a href={book.lihat_opac} target="_blank" rel="noopener noreferrer" style={{
            backgroundColor: '#4299e1', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '6px',
            textDecoration: 'none', 
            fontSize: '0.85rem', 
            fontWeight: '500', 
            whiteSpace: 'nowrap'
          }}>
            📖 OPAC
          </a>
        )}
        {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
          <a href={book.link_pesan_koleksi} target="_blank" rel="noopener noreferrer" style={{
            backgroundColor: '#48bb78', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '6px',
            textDecoration: 'none', 
            fontSize: '0.85rem', 
            fontWeight: '500', 
            whiteSpace: 'nowrap'
          }}>
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

      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.75rem' : '2.5rem', 
          fontWeight: '800', 
          marginBottom: '1rem' 
        }}>
          Koleksi Buku Langka
        </h1>
        <p style={{ 
          fontSize: isMobile ? '1rem' : '1.2rem', 
          opacity: 0.9, 
          maxWidth: '600px', 
          margin: '0 auto' 
        }}>
          Jelajahi khazanah literatur langka Indonesia
        </p>
      </section>

      {/* MAIN CONTAINER dengan key */}
      <div 
        key={`main-container-${renderKey.current}`} 
        style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: isMobile ? '1rem' : '2rem', 
          gap: isMobile ? '1rem' : '2rem' 
        }}
      >
        
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

          {/* Enhanced Debug Info */}
          <div style={{ 
            backgroundColor: '#e6fffa', 
            border: '1px solid #81e6d9', 
            borderRadius: '8px', 
            padding: '0.75rem', 
            marginBottom: '1.5rem', 
            fontSize: '0.8rem', 
            color: '#234e52' 
          }}>
            🔧 <strong>DEBUG ACTIVE:</strong> 
            <div>Filter: {hurufFilter || 'All'}</div>
            <div>Tahun: {tahunFilter || 'All'}</div>
            <div>Sort: {sortBy} ({sortOrder})</div>
            <div>Render Key: {renderKey.current}</div>
            <div>Items: {visibleBooks.length}</div>
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
              onChange={(e) => handleSortChange(e.target.value)} 
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
              onClick={handleSortOrder} 
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
                onClick={() => handleHurufFilter('')} 
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
                  onClick={() => handleHurufFilter(huruf)} 
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
                onClick={() => handleHurufFilter('#')} 
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
              onChange={(e) => handleTahunFilter(e.target.value)} 
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
                return <option key={range} value={range}>{start} - {end}</option>
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
          {(hurufFilter || tahunFilter) && (
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

        {/* Main Content dengan key */}
        <div key={`content-${renderKey.current}`} style={{ flex: 1 }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '1rem' 
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#2d3748', 
                margin: 0 
              }}>
                Koleksi Buku Langka {hurufFilter && `(Filter: ${hurufFilter})`}
              </h3>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#718096', 
                backgroundColor: '#f7fafc', 
                padding: '0.5rem 1rem', 
                borderRadius: '6px' 
              }}>
                📊 Total: {visibleBooks.length} buku{hasMore && ' + scroll untuk lebih banyak'}
                {loading && ' (Loading...)'}
              </div>
            </div>
          </div>

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
                {viewMode === 'list' && (
                  <div 
                    key={`list-${renderKey.current}`} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.75rem', 
                      marginBottom: '2rem' 
                    }}
                  >
                    {visibleBooks.map((book, index) => (
                      <BookListItem 
                        key={`${book.id}-${renderKey.current}-${index}`} 
                        book={book} 
                        isMobile={isMobile} 
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'grid' && (
                  <div 
                    key={`grid-${renderKey.current}`} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', 
                      gap: '1.5rem', 
                      marginBottom: '2rem' 
                    }}
                  >
                    {visibleBooks.map((book, index) => (
                      <BookCard 
                        key={`${book.id}-${renderKey.current}-${index}`} 
                        book={book} 
                        isMobile={isMobile} 
                      />
                    ))}
                  </div>
                )}

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

                {loadingMore && hasMore && (
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

                {!hasMore && visibleBooks.length > 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#718096', 
                    marginTop: '2rem', 
                    backgroundColor: 'white', 
                    borderRadius: '12px' 
                  }}>
                    <p>🎉 Semua hasil telah dimuat ({visibleBooks.length} buku)</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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

export default function KoleksiWithErrorBoundary(props) {
  return (
    <ErrorBoundary>
      <Koleksi {...props} />
    </ErrorBoundary>
  )
}
