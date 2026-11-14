import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, Trash2 } from 'lucide-react'
import { db } from '../db/database'
import { Field, PageTitle } from '../components/ui/Fields'
import { CopyButton } from '../components/ui/CopyButton'
import { matchesSearch } from '../utils/textSearch'
import type { NoteEntry } from '../types/domain'
import { emptyNoteDraft, loadNoteDraft, saveNoteDraft } from '../utils/recordDraft'

export function NotesPage() {
  const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), [])
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState(loadNoteDraft)
  const { editingId, title, content } = draft
  const [error, setError] = useState('')
  const saving = useRef(false)
  const filtered = notes?.filter(note => matchesSearch(query, [note.title, note.content])) ?? []
  useEffect(() => { saveNoteDraft(draft) }, [draft])

  function resetForm() { setDraft(emptyNoteDraft()); setError('') }
  function edit(note: NoteEntry) { setDraft({ editingId: note.id, title: note.title, content: note.content }); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function save() {
    if (saving.current) return
    if (!title.trim() && !content.trim()) { setError('Escribe un título o el contenido de la nota.'); return }
    saving.current = true
    try {
      const now = new Date().toISOString()
      const existing = editingId ? await db.notes.get(editingId) : undefined
      await db.notes.put({ id: existing?.id ?? crypto.randomUUID(), title: title.trim(), content: content.trim(), createdAt: existing?.createdAt ?? now, updatedAt: now })
      resetForm()
    } catch { setError('No se pudo guardar la nota. Inténtalo de nuevo.') }
    finally { saving.current = false }
  }
  async function remove(note: NoteEntry) {
    if (!window.confirm(`¿Eliminar la nota «${note.title || 'Sin título'}»?`)) return
    try { await db.notes.delete(note.id); if (editingId === note.id) resetForm() }
    catch { setError('No se pudo eliminar la nota.') }
  }

  return <div className="page records-page">
    <PageTitle eyebrow="GUARDADO EN ESTE DISPOSITIVO" title="Notas" />
    <div className="records-layout">
      <section className="panel record-form"><div className="panel-title"><span className="eyebrow">{editingId ? 'EDITAR NOTA' : 'NUEVA NOTA'}</span><h2>{editingId ? 'Modificar nota' : 'Escribir una nota'}</h2></div>
        <Field label="Título (opcional)" value={title} maxLength={120} placeholder="Ej.: Precio de referencia" onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} />
        <label className="field"><span>Contenido</span><textarea rows={8} value={content} placeholder="Escribe aquí cualquier dato que quieras recordar…" onChange={event => setDraft(current => ({ ...current, content: event.target.value }))} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="record-actions"><button type="button" className="primary-button" onClick={save}>{editingId ? 'Guardar cambios' : 'Guardar nota'}</button>{(editingId || title || content) && <button type="button" className="secondary-button" onClick={resetForm}>{editingId ? 'Cancelar' : 'Limpiar borrador'}</button>}</div>
      </section>
      <section className="panel records-list"><div className="panel-title"><span className="eyebrow">TUS APUNTES</span><h2>Notas guardadas</h2></div>
        <Field label="Buscar notas" type="search" value={query} placeholder="Busca por título o contenido" onChange={event => setQuery(event.target.value)} />
        <p className="helper">Los resultados se actualizan mientras escribes.</p>
        {notes === undefined ? <p className="empty-result">Cargando notas…</p> : filtered.length === 0 ? <p className="empty-result">{query ? 'No hay notas que coincidan con la búsqueda.' : 'Todavía no hay notas guardadas.'}</p> : <div className="record-cards">{filtered.map(note => <article className="record-card" key={note.id}><h3>{note.title || 'Nota sin título'}</h3>{note.content && <p className="record-content">{note.content}</p>}<div className="record-card-actions"><CopyButton text={note.content || note.title} label="Copiar Nota" /><button type="button" className="secondary-button" onClick={() => edit(note)}><Pencil size={17} /> Editar</button><button type="button" className="secondary-button record-delete" onClick={() => remove(note)}><Trash2 size={17} /> Eliminar</button></div></article>)}</div>}
      </section>
    </div>
  </div>
}
