// Dalam komponen Koleksi, ganti seluruh Controls Section dengan:

{/* Professional Filter Sidebar */}
<div style={{
  display: 'flex',
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
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      🔍 Filter Koleksi
    </h3>

    {/* Filter by Huruf A-Z */}
    <div style={{ marginBottom: '2rem' }}>
      <h4 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        FILTER HURUF
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
            fontSize: '0.8rem',
            fontWeight: '500',
            transition: 'all 0.2s',
            minWidth: '40px'
          }}
          title="Semua Huruf"
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
              fontSize: '0.8rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              minWidth: '30px'
            }}
          >
            {huruf}
          </button>
        ))}
      </div>
    </div>

    {/* Filter by Tahun (30-year ranges) */}
    <div style={{ marginBottom: '2rem' }}>
      <h4 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        FILTER TAHUN
      </h4>
      <select
        value={tahunFilter}
        onChange={(e) => setTahunFilter(e.target.value)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: 'white',
          fontSize: '0.9rem',
          outline: 'none'
        }}
      >
        <option value="">Semua Periode</option>
        <option value="1800-1830">1800 - 1830</option>
        <option value="1831-1860">1831 - 1860</option>
        <option value="1861-1890">1861 - 1890</option>
        <option value="1891-1920">1891 - 1920</option>
        <option value="1921-1950">1921 - 1950</option>
        <option value="1951-1980">1951 - 1980</option>
        <option value="1981-2010">1981 - 2010</option>
        <option value="2011-2024">2011 - Sekarang</option>
      </select>
    </div>

    {/* Sort Options */}
    <div style={{ marginBottom: '2rem' }}>
      <h4 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        URUTKAN BERDASARKAN
      </h4>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: 'white',
          fontSize: '0.9rem',
          outline: 'none',
          marginBottom: '0.75rem'
        }}
      >
        <option value="judul">Judul Buku</option>
        <option value="tahun_terbit">Tahun Terbit</option>
        <option value="pengarang">Nama Pengarang</option>
        <option value="penerbit">Penerbit</option>
      </select>
      
      <button
        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: sortOrder === 'asc' ? '#e6fffa' : '#fed7d7',
          color: '#2d3748',
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {sortOrder === 'asc' ? '↑ A-Z (Ascending)' : '↓ Z-A (Descending)'}
      </button>
    </div>

    {/* View Mode Toggle */}
    <div style={{ marginBottom: '2rem' }}>
      <h4 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
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
            padding: '0.75rem 1rem',
            border: 'none',
            backgroundColor: viewMode === 'list' ? '#4299e1' : 'white',
            color: viewMode === 'list' ? 'white' : '#4a5568',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: viewMode === 'list' ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          ☰ List
        </button>
        <button
          onClick={() => setViewMode('grid')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: 'none',
            backgroundColor: viewMode === 'grid' ? '#4299e1' : 'white',
            color: viewMode === 'grid' ? 'white' : '#4a5568',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: viewMode === 'grid' ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          ▦ Grid
        </button>
      </div>
    </div>

    {/* Reset Filters */}
    {(hurufFilter || tahunFilter || sortBy !== 'judul' || sortOrder !== 'asc') && (
      <button
        onClick={clearFilters}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: '1px solid #f56565',
          borderRadius: '8px',
          backgroundColor: '#f56565',
          color: 'white',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s'
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
      border: '1px solid #e2e8f0',
      marginBottom: '1.5rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700',
            color: '#2d3748',
            margin: 0
          }}>
            Koleksi Buku Langka
          </h3>
          <p style={{ 
            color: '#718096',
            margin: '0.5rem 0 0 0',
            fontSize: '0.9rem'
          }}>
            {loading ? (
              'Memuat...'
            ) : (
              <span>
                <strong>{visibleBooks.length}</strong> buku ditemukan
                {hurufFilter && ` • Huruf ${hurufFilter}`}
                {tahunFilter && ` • Periode ${tahunFilter}`}
                {hasMore && ' • Scroll untuk load lebih banyak'}
              </span>
            )}
          </p>
        </div>
        
        {!loading && (
          <div style={{
            fontSize: '0.9rem',
            color: '#718096',
            padding: '0.5rem 1rem',
            backgroundColor: '#f7fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            Loaded: <strong>{allLoadedBooks.length}</strong> buku
          </div>
        )}
      </div>
    </div>

    {/* Books List/Grid */}
    <div style={{ 
      minHeight: '500px'
    }}>
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#718096',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p>Memuat koleksi buku langka...</p>
        </div>
      ) : (
        <>
          {/* List/Grid View components tetap sama */}
          {/* ... */}
        </>
      )}
    </div>
  </div>
</div>
