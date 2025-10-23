// components/Layout.js
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children, isMobile }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Header isMobile={isMobile} />
      <main>{children}</main>
      <Footer isMobile={isMobile} />
    </div>
  )
}
