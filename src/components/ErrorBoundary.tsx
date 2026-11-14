import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <main className="content"><section className="panel" role="alert"><h1>No se pudo mostrar la pantalla</h1><p>Tus datos guardados no se han borrado. Recarga la aplicación para intentarlo de nuevo.</p><button type="button" className="primary-button" onClick={() => window.location.reload()}>Recargar aplicación</button><a className="secondary-button" href="/">Volver al inicio</a></section></main>
  }
}
