import { createContext, useContext } from 'react'
import { defaultSettings } from '../db/database'

export const SettingsContext = createContext(defaultSettings)
export const useAppSettings = () => useContext(SettingsContext)
