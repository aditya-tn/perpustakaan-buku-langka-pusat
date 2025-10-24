// components/Header.js - VERSION WITH ACTIVE MENU
import { useRouter } from 'next/router'
import { useState } from 'react'
import Link from 'next/link'

export default function Header({ isMobile }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const currentPath = router.pathname

  // Function untuk cek active menu - TAMBAHAN INI SAJA
  const getLinkStyle = (path) => {
    const isActive = currentPath === path
    return {
      textDecoration: 'none',
      color: isActive ? '#4299e1' : '#4a5568',
      fontWeight: isActive ? '600' : '400',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      backgroundColor: isActive ? '#ebf8ff' : 'transparent',
      transition: 'all 0.2s',
      display: 'block'
    }
  }

  return (
    <header style={{
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo - TIDAK BERUBAH */}
        <Link href="/" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '800',
            color: '#4299e1'
          }}>
            📚
          </div>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: '700',
            color: '#2d3748'
          }}>
            Perpustakaan Nasional
          </div>
        </Link>

        {/* Desktop Navigation - HANYA UBAH STYLE MENJADI getLinkStyle() */}
        {!isMobile && (
          <nav style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <Link href="/" style={getLinkStyle('/')}>
              Beranda
            </Link>
            <Link href="/koleksi" style={getLinkStyle('/koleksi')}>
              Koleksi Buku
            </Link>
            <Link href="/layanan" style={getLinkStyle('/layanan')}>
              Layanan
            </Link>
            <Link href="/profil" style={getLinkStyle('/profil')}>
              Profil
            </Link>
            <Link href="/kritik-saran" style={getLinkStyle('/kritik-saran')}>
              Kritik & Saran
            </Link>
          </nav>
        )}

        {/* Mobile Menu Button - TIDAK BERUBAH */}
        {isMobile && (
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#4a5568'
            }}
          >
            ☰
          </button>
        )}
      </div>

      {/* Mobile Navigation Menu - HANYA UBAH STYLE MENJADI getLinkStyle() */}
      {isMobile && isMenuOpen && (
        <div style={{
          backgroundColor: 'white',
          borderTop: '1px solid #e2e8f0',
          padding: '1rem'
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <Link 
              href="/" 
              onClick={() => setIsMenuOpen(false)}
              style={getLinkStyle('/')}
            >
              Beranda
            </Link>
            <Link 
              href="/koleksi" 
              onClick={() => setIsMenuOpen(false)}
              style={getLinkStyle('/koleksi')}
            >
              Koleksi Buku
            </Link>
            <Link 
              href="/layanan" 
              onClick={() => setIsMenuOpen(false)}
              style={getLinkStyle('/layanan')}
            >
              Layanan
            </Link>
            <Link 
              href="/profil" 
              onClick={() => setIsMenuOpen(false)}
              style={getLinkStyle('/profil')}
            >
              Profil
            </Link>
            <Link 
              href="/kritik-saran" 
              onClick={() => setIsMenuOpen(false)}
              style={getLinkStyle('/kritik-saran')}
            >
              Kritik & Saran
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
