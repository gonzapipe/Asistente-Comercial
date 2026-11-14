import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, Trash2 } from 'lucide-react'
import { db } from '../db/database'
import { Field, PageTitle } from '../components/ui/Fields'
import { CopyButton } from '../components/ui/CopyButton'
import { agendaDetails, matchesSearch } from '../utils/textSearch'
import type { AgendaEntry } from '../types/domain'
import { emptyAgendaDraft, loadAgendaDraft, saveAgendaDraft, type AgendaDraft } from '../utils/recordDraft'

type ContactForm = Pick<AgendaDraft, 'name' | 'phone' | 'address' | 'email' | 'company' | 'notes'>

export function AgendaPage() {
  const contacts = useLiveQuery(() => db.agendaEntries.orderBy('updatedAt').reverse().toArray(), [])
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState(loadAgendaDraft)
  const { editingId } = draft
  const [error, setError] = useState('')
  const saving = useRef(false)
  const filtered = contacts?.filter(contact => matchesSearch(query, [contact.name, contact.phone, contact.address, contact.email, contact.company, contact.notes])) ?? []
  useEffect(() => { saveAgendaDraft(draft) }, [draft])

  function update(field: keyof ContactForm, value: string) { setDraft(current => ({ ...current, [field]: value })) }
  function resetForm() { setDraft(emptyAgendaDraft()); setError('') }
  function edit(contact: AgendaEntry) { setDraft({ editingId: contact.id, name: contact.name, phone: contact.phone, address: contact.address, email: contact.email, company: contact.company, notes: contact.notes }); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function save() {
    if (saving.current) return
    saving.current = true
    try {
      const now = new Date().toISOString()
      const existing = editingId ? await db.agendaEntries.get(editingId) : undefined
      const details: ContactForm = {
        name: draft.name.trim(), phone: draft.phone.trim(), address: draft.address.trim(),
        email: draft.email.trim(), company: draft.company.trim(), notes: draft.notes.trim(),
      }
      if (!Object.values(details).some(value => value)) { setError('Ingresa al menos un dato del contacto.'); return }
      await db.agendaEntries.put({ id: existing?.id ?? crypto.randomUUID(), ...details, createdAt: existing?.createdAt ?? now, updatedAt: now })
      resetForm()
    } catch { setError('No se pudo guardar el contacto. Inténtalo de nuevo.') }
    finally { saving.current = false }
  }
  async function remove(contact: AgendaEntry) {
    if (!window.confirm(`¿Eliminar el contacto «${contact.name || 'Sin nombre'}»?`)) return
    try { await db.agendaEntries.delete(contact.id); if (editingId === contact.id) resetForm() }
    catch { setError('No se pudo eliminar el contacto.') }
  }

  return <div className="page records-page">
    <PageTitle eyebrow="GUARDADO EN ESTE DISPOSITIVO" title="Agenda" />
    <div className="records-layout">
      <section className="panel record-form"><div className="panel-title"><span className="eyebrow">{editingId ? 'EDITAR CONTACTO' : 'NUEVO CONTACTO'}</span><h2>{editingId ? 'Modificar contacto' : 'Agregar contacto'}</h2></div>
        <p className="helper">Todos los campos son opcionales.</p>
        <Field label="Nombre" value={draft.name} maxLength={120} placeholder="Nombre del cliente" onChange={event => update('name', event.target.value)} />
        <Field label="Teléfono" type="tel" inputMode="tel" value={draft.phone} maxLength={40} placeholder="Ej.: +56 9 1234 5678" onChange={event => update('phone', event.target.value)} />
        <Field label="Dirección" value={draft.address} maxLength={240} placeholder="Calle, número y comuna" onChange={event => update('address', event.target.value)} />
        <Field label="Correo" type="email" value={draft.email} maxLength={160} placeholder="correo@ejemplo.cl" onChange={event => update('email', event.target.value)} />
        <Field label="Empresa" value={draft.company} maxLength={120} placeholder="Nombre de la empresa" onChange={event => update('company', event.target.value)} />
        <label className="field"><span>Otros datos</span><textarea rows={4} value={draft.notes} placeholder="Horarios, referencias u otros datos…" onChange={event => update('notes', event.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="record-actions"><button type="button" className="primary-button" onClick={save}>{editingId ? 'Guardar cambios' : 'Guardar contacto'}</button>{(editingId || Object.values(draft).some(value => value)) && <button type="button" className="secondary-button" onClick={resetForm}>{editingId ? 'Cancelar' : 'Limpiar borrador'}</button>}</div>
      </section>
      <section className="panel records-list"><div className="panel-title"><span className="eyebrow">TUS CONTACTOS</span><h2>Contactos guardados</h2></div>
        <Field label="Buscar en agenda" type="search" value={query} placeholder="Nombre, teléfono, dirección, correo…" onChange={event => setQuery(event.target.value)} />
        <p className="helper">Los resultados se actualizan mientras escribes.</p>
        {contacts === undefined ? <p className="empty-result">Cargando contactos…</p> : filtered.length === 0 ? <p className="empty-result">{query ? 'No hay contactos que coincidan con la búsqueda.' : 'Todavía no hay contactos guardados.'}</p> : <div className="record-cards">{filtered.map(contact => <article className="record-card" key={contact.id}><h3>{contact.name || 'Contacto sin nombre'}</h3><p className="record-content">{agendaDetails(contact)}</p><div className="record-card-actions"><CopyButton text={agendaDetails(contact)} label="Copiar detalles" /><button type="button" className="secondary-button" onClick={() => edit(contact)}><Pencil size={17} /> Editar</button><button type="button" className="secondary-button record-delete" onClick={() => remove(contact)}><Trash2 size={17} /> Eliminar</button></div></article>)}</div>}
      </section>
    </div>
  </div>
}
