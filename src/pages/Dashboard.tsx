import { ArrowRight, BookOpen, CalendarClock, ContactRound, FileClock, PackageSearch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { isOrderDueToday, nextReminderToday, orderCutoff, dateAt, localDateString } from '../utils/nextOrders'

export function Dashboard() {
  const orders = useLiveQuery(() => db.nextOrders.toArray(), []) ?? []
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const dueToday = orders.filter(order => isOrderDueToday(order, now)).length
  const nextReminder = nextReminderToday(orders, now)
  const cutoff = dateAt(localDateString(now), orderCutoff.hour, orderCutoff.minute)
  const todayMessage = nextReminder ? `Próximo aviso: ${nextReminder}` : dueToday === 0 ? 'Tus recordatorios de hoy están al día.' : cutoff && now >= cutoff ? 'El plazo de ingreso de hoy ya terminó.' : 'Sin más avisos programados hoy.'
  return <div className="page dashboard dashboard-home">
    <div className="dashboard-home-grid">
      <section className="hero dashboard-home-hero">
        <h1 className="hero-heading">ASISTENTE COMERCIAL</h1>
        <p>Calcula precios, compara productos y organiza tus avisos.</p>
        <Link className="primary-button hero-action dashboard-action" to="/iva">Empezar a calcular <ArrowRight size={20} aria-hidden="true" /></Link>
        <p className="hero-credit">Desarrollado por <strong>GONZACODEX</strong></p>
      </section>
    </div>
    <nav className="dashboard-home-extras" aria-label="Herramientas personales"><Link className="dashboard-shortcut notes-shortcut" to="/notas"><BookOpen size={21} aria-hidden="true" />Notas</Link><Link className="dashboard-shortcut agenda-shortcut" to="/agenda"><ContactRound size={21} aria-hidden="true" />Agenda</Link></nav>
    <Link className="dashboard-centered-access" to="/productos"><PackageSearch aria-hidden="true" /><strong>Lista de Productos</strong><small>Consulta y actualiza tus precios</small></Link>
    <Link className="dashboard-centered-access" to="/proximos-pedidos"><CalendarClock aria-hidden="true" /><strong>Próximos Pedidos</strong><small>Recordatorios de 08:30 a 16:15</small></Link>
    <Link className="dashboard-centered-access" to="/facturas-pendientes"><FileClock aria-hidden="true" /><strong>Aviso Facturas Pendientes</strong><small>Recuerda contactar a tus clientes</small></Link>
    <section className="dashboard-today-summary" aria-labelledby="today-summary-title"><h2 id="today-summary-title">Resumen de hoy</h2><strong>{dueToday === 0 ? 'Sin pedidos pendientes hoy' : `${dueToday} ${dueToday === 1 ? 'pedido por ingresar' : 'pedidos por ingresar'}`}</strong><p>{todayMessage}</p><Link to="/proximos-pedidos">{dueToday > 0 ? 'Ver pedidos de hoy' : 'Ver próximos pedidos'} <ArrowRight size={17} aria-hidden="true" /></Link></section>
  </div>
}
