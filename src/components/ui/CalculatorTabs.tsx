import { Link } from 'react-router-dom'

const tabs = [
  { path: '/iva', label: 'IVA' },
  { path: '/descuentos', label: 'Descuentos' },
  { path: '/margen', label: 'Margen' },
  { path: '/cantidades', label: 'Cantidades' },
  { path: '/comparativos', label: 'Comparativos' },
  { path: '/precio-objetivo', label: 'Precio objetivo' },
  { path: '/calculadora', label: 'Calculadora' },
  { path: '/productos', label: 'Productos' },
] as const

export function CalculatorTabs({ activePath }: { activePath: string }) {
  return <nav className="tool-tabs" aria-label="Herramientas de cálculo">{tabs.map(tab => <Link key={tab.path} to={tab.path} aria-current={activePath === tab.path ? 'page' : undefined} className={activePath === tab.path ? 'active' : ''}>{tab.label}</Link>)}</nav>
}
