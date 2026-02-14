import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { loadSavedTheme, applyTheme } from './services/themes.service'

// Apply saved theme IMMEDIATELY before React renders (prevents flash)
const savedTheme = loadSavedTheme()
applyTheme(savedTheme)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
