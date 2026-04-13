import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Capture PWA install prompt early so we don't miss it.
if (typeof window !== 'undefined') {
  window.__babycareBeforeInstallPrompt = null
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    window.__babycareBeforeInstallPrompt = e
  })
  window.addEventListener('appinstalled', () => {
    window.__babycareBeforeInstallPrompt = null
  })
}

// Register Service Worker for PWA installability/offline-ish behavior.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
