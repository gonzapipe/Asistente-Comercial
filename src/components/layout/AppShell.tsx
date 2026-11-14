import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CloudOff, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { navigation } from './navigation'

const bottomNavigation = ['/', '/iva', '/calculadora', '/margen', '/comparativos'].flatMap(path => navigation.filter(item => item.path === path))

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const current = navigation.find((item) => item.path === location.pathname) ?? navigation.find(item => item.path !== '/' && location.pathname.startsWith(`${item.path}/`))
  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0) }, [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      setMenuOpen(false)
      menuButton.current?.focus()
    }
    window.addEventListener('keydown', closeOnEscape, true)
    return () => window.removeEventListener('keydown', closeOnEscape, true)
  }, [menuOpen])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <aside className="sidebar" aria-label="Navegación principal">
        <Brand />
        <p className="nav-heading">HERRAMIENTAS DE PRECIOS</p>
        <nav className="sidebar-nav">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot"><CloudOff size={18} /><span>Cálculos disponibles sin conexión</span></div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <div className="topbar-title"><span className="eyebrow">CALCULADORA COMERCIAL</span><strong>{current?.label ?? 'Inicio'}</strong></div>
          <button ref={menuButton} className="menu-button" type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-controls="mobile-nav" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
          <span className="phase-pill">Modo local</span>
        </header>
        {menuOpen && <nav id="mobile-nav" className="mobile-menu" aria-label="Navegación completa">{navigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className="mobile-menu-link"><Icon size={18} aria-hidden="true" />{label}</NavLink>)}</nav>}
        <main id="contenido" className="content"><Outlet /></main>
        <nav className="bottom-nav" aria-label="Navegación inferior">
          {bottomNavigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}><Icon size={21} strokeWidth={1.9} aria-hidden="true" /><span>{label}</span></NavLink>)}
        </nav>
      </div>
    </div>
  )
}

function Brand() {
  return <NavLink to="/" className="brand" aria-label="CALCULADORA COMERCIAL, ir a inicio"><span className="brand-mark">GP</span><span className="brand-copy"><strong>CALCULADORA COMERCIAL</strong><small>Precios, cálculos, márgenes y más...</small></span></NavLink>
}
