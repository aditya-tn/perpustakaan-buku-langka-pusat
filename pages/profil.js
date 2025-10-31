// pages/profil.js - ADD SCROLL MARGIN
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import HeroProfil from '../components/profil/HeroProfil'
import TabNavigation from '../components/profil/TabNavigation'
import TentangKami from '../components/profil/TentangKami'
import VisiMisi from '../components/profil/VisiMisi'
import TimKami from '../components/profil/TimKami'
import KontakJam from '../components/profil/KontakJam'
import QuickActions from '../components/profil/QuickActions'

export default function Profil() {
  const [activeTab, setActiveTab] = useState('tentang')
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Add scroll margin for sticky navigation
    const style = document.createElement('style')
    style.textContent = `
      .scroll-margin-target {
        scroll-margin-top: 80px;
      }
      @media (max-width: 768px) {
        .scroll-margin-target {
          scroll-margin-top: 70px;
        }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      document.head.removeChild(style)
    }
  }, [])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tentang':
        return <TentangKami isMobile={isMobile} />
      case 'visi-misi':
        return <VisiMisi isMobile={isMobile} />
      case 'pegawai':
        return <TimKami isMobile={isMobile} />
      case 'kontak':
        return <KontakJam isMobile={isMobile} />
      default:
        return <TentangKami isMobile={isMobile} />
    }
  }

  if (!isClient) {
    return (
      <Layout>
        <Head>
          <title>Profil Layanan - Koleksi Buku Langka Perpustakaan Nasional RI</title>
          <meta name="description" content="Profil Layanan Koleksi Buku Langka Perpustakaan Nasional RI" />
        </Head>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Loading...
        </div>
      </Layout>
    )
  }

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Profil Layanan - Koleksi Buku Langka Perpustakaan Nasional RI</title>
        <meta name="description" content="Profil Layanan Koleksi Buku Langka Perpustakaan Nasional RI - Visi, Misi, Tim, dan Kontak" />
      </Head>

      <HeroProfil isMobile={isMobile} />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} />
      
      {/* Add scroll margin target */}
      <div className="scroll-margin-target">
        {renderTabContent()}
      </div>
      
      <QuickActions isMobile={isMobile} />
    </Layout>
  )
}
