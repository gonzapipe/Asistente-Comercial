import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, FileUp, Pencil, Plus, Search, X } from 'lucide-react'
import { readSheet } from 'read-excel-file/browser'
import { useAppSettings } from '../components/SettingsContext'
import { PageTitle } from '../components/ui/Fields'
import { db } from '../db/database'
import { formatMoney, netFromTotal } from '../utils/money'
import { numericInput, numericValue } from '../utils/numericInput'
import { applyPriceSheet } from '../utils/priceCatalogDb'
import { catalogKey, normalizeCatalogText, parsePriceSheet, planPriceImport, type PriceSheetRow } from '../utils/priceCatalog'

export function PriceCatalog() {
  const settings = useAppSettings()
  const products = useLiveQuery(() => db.priceCatalog.toArray(), []) ?? []
  const categories = useLiveQuery(() => db.priceCatalogCategories.toArray(), []) ?? []
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [categoryName, setCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importRows, setImportRows] = useState<PriceSheetRow[] | null>(null)
  const [importName, setImportName] = useState('')
  const [replaceManual, setReplaceManual] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name, 'es-CL')), [categories])
  const visible = useMemo(() => products.filter(item => (category === 'all' || item.categoryId === category) && normalizeCatalogText(item.name).includes(normalizeCatalogText(query))).sort((a, b) => a.name.localeCompare(b.name, 'es-CL')), [products, query, category])
  const plan = importRows ? planPriceImport(importRows, products) : null

  async function createCategory(event: React.FormEvent) {
    event.preventDefault()
    const name = categoryName.trim().replace(/\s+/g, ' ')
    if (!name || name.length > 50) { setError('Escribe un nombre de categoría de hasta 50 caracteres.'); return }
    const id = catalogKey(name)
    if (categories.some(item => item.id === id)) { setError('Esa categoría ya existe.'); return }
    try {
      await db.priceCatalogCategories.add({ id, name, createdAt: new Date().toISOString() })
      setCategoryName(''); setCreatingCategory(false); setCategory(id); setError(''); setMessage(`Categoría ${name} creada. Puedes asignarle productos desde sus tarjetas.`)
    } catch { setError('No se pudo crear la categoría.') }
  }

  async function savePrice(id: string) {
    const value = numericValue(priceInput)
    if (value === null || !Number.isSafeInteger(value) || value < 1 || value > 100_000_000_000) { setError('Ingresa un precio total con IVA válido, mayor que cero.'); return }
    try {
      await db.priceCatalog.update(id, { priceGross: value, manualPrice: true, updatedAt: new Date().toISOString() })
      setEditingId(null); setPriceInput(''); setError(''); setMessage('Precio guardado en este dispositivo.')
    } catch { setError('No se pudo guardar el precio.') }
  }

  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return
    setError(''); setMessage(''); setImportRows(null)
    if (!file.name.toLowerCase().endsWith('.xlsx') || file.size > 5_000_000) { setError('Elige un archivo .xlsx de hasta 5 MB.'); return }
    setBusy(true)
    try {
      const rows = await readSheet(file)
      setImportRows(parsePriceSheet(rows))
      setImportName(file.name)
      setReplaceManual(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo leer el archivo Excel.') }
    finally { setBusy(false) }
  }

  async function confirmImport() {
    if (!importRows || busy) return
    setBusy(true); setError('')
    try {
      const result = await applyPriceSheet(importRows, replaceManual)
      setImportRows(null); setMessage(`Lista actualizada: ${result.added} productos nuevos, ${result.updated} actualizados${result.protected ? ` y ${result.protected} precios manuales conservados` : ''}.`)
    } catch { setError('No se pudo aplicar la actualización. Los precios anteriores se conservaron.') }
    finally { setBusy(false) }
  }

  return <div className="page price-catalog-page">
    <PageTitle eyebrow="CATÁLOGO DE PRECIOS" title="Productos" />
    <div className="price-catalog-toolbar">
      <label className="catalog-search"><Search size={19} aria-hidden="true" /><span className="visually-hidden">Buscar productos</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nombre del producto" autoComplete="off" /></label>
      <div className="catalog-categories" aria-label="Filtrar por categoría">
        <button type="button" className={category === 'all' ? 'active' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Todos</button>
        {sortedCategories.map(item => <button type="button" key={item.id} className={category === item.id ? 'active' : ''} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.name}</button>)}
      </div>
      {creatingCategory && <form className="catalog-category-form" onSubmit={event => void createCategory(event)}><label htmlFor="new-category-name">Nombre de la categoría</label><div><input id="new-category-name" value={categoryName} maxLength={50} onChange={event => setCategoryName(event.target.value)} autoFocus placeholder="Ej.: Bebidas" /><button type="submit" className="primary-button">Crear</button></div></form>}
      <div className="catalog-meta"><div className="catalog-count">{query || category !== 'all' ? `${visible.length} de ${products.length} productos` : `${products.length} productos`}</div><button type="button" className="new-category" onClick={() => { setCreatingCategory(!creatingCategory); setError('') }}><Plus size={15} aria-hidden="true" /> Nueva categoría</button></div>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="form-success" role="status">{message}</p>}
    <div className="catalog-grid">
      {visible.map(item => {
        const { net, tax } = netFromTotal(item.priceGross, settings.taxRateBps)
        return <article className="catalog-card" key={item.id}>
          <h2>{item.name}</h2>
          <div className="catalog-total"><strong>{formatMoney(item.priceGross)}</strong><span>Total con IVA</span></div>
          <div className="catalog-breakdown"><span>Neto</span><strong>{formatMoney(net)}</strong></div>
          <div className="catalog-breakdown"><span>IVA {settings.taxRateBps / 100}%</span><strong>{formatMoney(tax)}</strong></div>
          <div className={`catalog-card-actions${editingId === item.id ? ' is-editing' : ''}`}>{editingId === item.id ? <form className="catalog-price-form" onSubmit={event => { event.preventDefault(); void savePrice(item.id) }}><label htmlFor={`price-${item.id}`}>Nuevo total con IVA ($)</label><input id={`price-${item.id}`} type="text" inputMode="numeric" value={priceInput} onChange={event => { const next = numericInput(event.target.value, 0, 100_000_000_000); if (next !== null) setPriceInput(next) }} /><div><button type="submit" className="secondary-button"><Check size={15} /> Guardar</button><button type="button" className="secondary-button" onClick={() => setEditingId(null)}><X size={15} /> Cancelar</button></div></form> : <button type="button" className="catalog-edit" onClick={() => { setEditingId(item.id); setPriceInput(String(item.priceGross)); setError('') }}><Pencil size={14} aria-hidden="true" /> Editar precio</button>}
          <label className="catalog-assign"><span className="visually-hidden">Categoría de {item.name}</span><select aria-label={`Categoría de ${item.name}`} value={item.categoryId} onChange={event => { void db.priceCatalog.update(item.id, { categoryId: event.target.value, updatedAt: new Date().toISOString() }).catch(() => setError('No se pudo cambiar la categoría.')) }}><option value="">Sin categoría</option>{sortedCategories.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label></div>
        </article>
      })}
    </div>
    {!visible.length && <p className="panel catalog-empty">No hay productos para esta búsqueda o categoría.</p>}
    <section className="panel catalog-import"><h2>Actualizar precios desde Excel</h2><p>Selecciona un archivo .xlsx con las columnas <strong>Producto</strong> y <strong>Precio nuevo</strong>. Los precios nuevos deben incluir IVA. Revisarás los cambios antes de guardarlos.</p><input ref={fileInput} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => void chooseFile(event)} className="visually-hidden" aria-label="Seleccionar archivo Excel" /><button type="button" className="secondary-button" disabled={busy} onClick={() => fileInput.current?.click()}><FileUp size={18} aria-hidden="true" /> {busy ? 'Leyendo archivo…' : 'Seleccionar Excel'}</button>
      {plan && <div className="catalog-import-preview"><h3>Revisar actualización: {importName}</h3><p>{plan.rows.length} productos en el archivo · {plan.newCount} nuevos · {plan.changedCount} precios por cambiar · {plan.unchangedCount} sin cambios · {plan.protectedCount} editados manualmente · {plan.missingCount} ausentes del archivo.</p><p>Los productos ausentes se conservan. Los precios editados manualmente se conservan salvo que elijas reemplazarlos.</p>{plan.protectedCount > 0 && <label className="catalog-override"><input type="checkbox" checked={replaceManual} onChange={event => setReplaceManual(event.target.checked)} /> Reemplazar también precios editados manualmente</label>}<div className="catalog-import-actions"><button type="button" className="primary-button" disabled={busy} onClick={() => void confirmImport()}>Aplicar actualización</button><button type="button" className="secondary-button" onClick={() => setImportRows(null)}>Cancelar</button></div></div>}
    </section>
  </div>
}
