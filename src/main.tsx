import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './pwa'

// Keep the PWA at a stable viewport on iPhone without installing a blocking
// document-level touchmove listener. The latter makes Safari delay taps.
const preventGesture = (event: Event) => event.preventDefault()
document.addEventListener('gesturestart', preventGesture, { passive: false })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
