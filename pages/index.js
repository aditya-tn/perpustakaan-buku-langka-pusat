// pages/index.js - DEBUG VERSION
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
  
  const [liveSearchEnabled, setLiveSearchEnabled] = useState(true)
  const [debugLog, setDebugLog] = useState([])

  // Refs
  const searchTimeoutRef = useRef(null)

  // Debug function
  const addDebugLog = (message) => {
    console.log('🔍 DEBUG:', message)
    setDebugLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // SIMPLE REAL-TIME SEARCH EFFECT
  useEffect(() => {
    addDebugLog(`Effect triggered: searchTerm="${searchTerm}", liveSearchEnabled=${liveSearchEnabled}`)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      addDebugLog('Cleared previous timeout')
    }

    // Skip conditions
    if (!searchTerm.trim()) {
      addDebugLog('Search term empty, skipping')
      if (searchTerm.trim().length === 0) {
        setSearchResults([])
        setShowStats(true)
      }
      return
    }

    if (!liveSearchEnabled) {
      addDebugLog('Live search disabled, skipping')
      return
    }

    addDebugLog(`Setting timeout for search: "${searchTerm}"`)

    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      addDebugLog(`Timeout executed, searching: "${searchTerm}"`)
      await executeSearch(searchTerm)
    }, 1000) // 1 second debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
        addDebugLog('Cleanup: timeout cleared')
      }
    }
  }, [searchTerm, liveSearchEnabled])

  // SIMPLE SEARCH EXECUTION
  const executeSearch = async (searchQuery) => {
    addDebugLog(`executeSearch called: "${searchQuery}"`)
    
    if (!searchQuery.trim()) {
      addDebugLog('Empty search query, returning')
      return
    }

    setLoading(true)
    setCurrentPage(1)
    addDebugLog('Loading state set to true')

    try {
      addDebugLog('Making Supabase query...')
      
      // SIMPLE QUERY - no smart ranking dulu
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`judul.ilike.%${searchQuery}%,pengarang.ilike.%${searchQuery}%,penerbit.ilike.%${searchQuery}%`)
        .limit(50)

      if (error) {
        addDebugLog(`Supabase error: ${error.message}`)
        throw error
      }

      addDebugLog(`Search successful: ${data?.length || 0} results`)
      console.log('📚 Sample results:', data?.slice(0, 3))
      
      setSearchResults(data || [])
      
      if (data && data.length > 0) {
        addDebugLog(`Setting ${data.length} results to state`)
      } else {
        addDebugLog('No results found')
      }

    } catch (err) {
      addDebugLog(`Search error: ${err.message}`)
      setSearchResults([])
    } finally {
      setLoading(false)
      addDebugLog('Loading state set to false')
    }
  }

  // Manual search handler
  const handleManualSearch = async (e) => {
    if (e) e.preventDefault()
    addDebugLog('Manual search triggered')
    
    if (!searchTerm.trim()) return

    // Clear any ongoing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    await executeSearch(searchTerm)
  }

  // Clear search
  const clearSearch = () => {
    addDebugLog('Clear search triggered')
    setSearchTerm('')
    setSearchResults([])
    setShowStats(true)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }

  // Toggle live search
  const toggleLiveSearch = () => {
    setLiveSearchEnabled(prev => {
      addDebugLog(`Live search toggled: ${!prev} -> ${prev}`)
      return !prev
    })
  }

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(searchResults.length / itemsPerPage)
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Temukan khazanah literatur langka Indonesia dari koleksi Perpustakaan Nasional RI" />
      </Head>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '800',
            marginBottom: '1rem'
          }}>
            Koleksi Buku Langka
          </h1>
          
          {/* DEBUG PANEL */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'left',
            fontSize: '0.8rem',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>🔍 Debug Log:</div>
            {debugLog.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '0.25rem',
                fontFamily: 'monospace',
                fontSize: '0.7rem'
              }}>
                {log}
              </div>
            ))}
          </div>

          {/* SEARCH FORM */}
          <form onSubmit={handleManualSearch} style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
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
                  cursor: 'pointer'
                }}
              >
                {liveSearchEnabled ? '🔴 Live' : '⚪ Manual'}
              </button>

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
                    cursor: 'pointer'
                  }}
                >
                  ✕ Clear
                </button>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  console.log('📝 Input changed:', e.target.value)
                  setSearchTerm(e.target.value)
                }}
                placeholder={liveSearchEnabled ? "Ketik untuk live search..." : "Tekan Enter untuk search..."}
                style={{
                  flex: 1,
                  padding: '1rem 1.25rem',
                  border: 'none',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              
              {!liveSearchEnabled && (
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#f56565',
                    color: 'white',
                    padding: '0 1.5rem',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '80px'
                  }}
                >
                  {loading ? '...' : 'Cari'}
                </button>
              )}
            </div>

            {/* STATUS INDICATOR */}
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.8)'
            }}>
              Status: {loading ? '🔄 Searching...' : liveSearchEnabled ? '🔴 Live Ready' : '⚪ Manual Mode'}
              {searchTerm && ` | Typing: "${searchTerm}"`}
            </div>
          </form>

          {/* SEARCH INFO */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              fontSize: '0.8rem'
            }}>
              📚 {searchResults.length} hasil ditemukan
            </div>
          )}
        </div>
      </section>

      {/* STATS SECTION */}
      {showStats && (
        <section style={{
          backgroundColor: 'white',
          padding: isMobile ? '2rem 1rem' : '3rem 2rem'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '2rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4a5568' }}>85K+</div>
              <div style={{ color: '#718096', fontWeight: '500' }}>Koleksi Buku</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4a5568' }}>200+</div>
              <div style={{ color: '#718096', fontWeight: '500' }}>Tahun Sejarah</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4a5568' }}>50+</div>
              <div style={{ color: '#718096', fontWeight: '500' }}>Bahasa</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4a5568' }}>24/7</div>
              <div style={{ color: '#718096', fontWeight: '500' }}>Akses Digital</div>
            </div>
          </div>
        </section>
      )}

      {/* SEARCH RESULTS */}
      {searchResults.length > 0 && (
        <section style={{ 
          maxWidth: '1400px', 
          margin: '2rem auto',
          padding: '0 1rem'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Hasil Pencarian</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {currentItems.map((book) => (
              <div key={book.id} style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0'
              }}>
                <h3 style={{ 
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '0.5rem',
                  fontSize: '1rem'
                }}>
                  {book.judul}
                </h3>
                
                <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                  <div><strong>Pengarang:</strong> {book.pengarang || '-'}</div>
                  <div><strong>Tahun:</strong> {book.tahun_terbit || '-'}</div>
                  <div><strong>Penerbit:</strong> {book.penerbit || '-'}</div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '2rem'
            }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e2e8f0',
                    backgroundColor: currentPage === i + 1 ? '#4299e1' : 'white',
                    color: currentPage === i + 1 ? 'white' : '#4a5568',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </Layout>
  )
}
