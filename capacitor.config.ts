import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'cl.ventafacil.calculadora',
  appName: 'Venta Fácil Precios',
  webDir: 'dist',
  android: { backgroundColor: '#0b1424' },
  plugins: {
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'auto',
      style: 'DARK',
      hidden: false,
    },
  },
}

export default config
