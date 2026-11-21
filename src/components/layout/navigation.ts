import { BookOpen, Calculator, CalendarClock, Columns3, ContactRound, FileClock, Grid2X2, Home, Percent, Settings2, ShoppingBasket, Target, TrendingUp, PackageSearch } from 'lucide-react'

export const navigation = [
  { label: 'Inicio', path: '/', icon: Home },
  { label: 'IVA', path: '/iva', icon: Calculator },
  { label: 'Descuentos', path: '/descuentos', icon: Percent },
  { label: 'Margen', path: '/margen', icon: TrendingUp },
  { label: 'Cantidades', path: '/cantidades', icon: ShoppingBasket },
  { label: 'Comparativos', path: '/comparativos', icon: Columns3 },
  { label: 'Productos', path: '/productos', icon: PackageSearch },
  { label: 'Próximos pedidos', path: '/proximos-pedidos', icon: CalendarClock },
  { label: 'Facturas pendientes', path: '/facturas-pendientes', icon: FileClock },
  { label: 'Precio objetivo', path: '/precio-objetivo', icon: Target },
  { label: 'Calculadora', path: '/calculadora', icon: Grid2X2 },
  { label: 'Notas', path: '/notas', icon: BookOpen },
  { label: 'Agenda', path: '/agenda', icon: ContactRound },
  { label: 'Ajustes', path: '/ajustes', icon: Settings2 },
] as const
