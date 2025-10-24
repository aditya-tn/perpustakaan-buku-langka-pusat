import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children, isMobile }) {
  const [currentPath, setCurrentPath] = useState('')
  const router = useRouter()

  useEffect(() => {
    setCurrentPath(router.pathname)
  }, [router.pathname])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header isMobile={isMobile} currentPath={currentPath} />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer isMobile={isMobile} />
    </div>
  )
}
