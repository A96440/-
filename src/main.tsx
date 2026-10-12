import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Keep the PWA at a stable viewport on iPhone. Single-finger scrolling remains
// available, while accidental two-finger pinch/gesture zoom is ignored.
const preventPinch = (event: TouchEvent) => {
  if (event.touches.length > 1) event.preventDefault()
}
const preventGesture = (event: Event) => event.preventDefault()
document.addEventListener('touchmove', preventPinch, { passive: false })
document.addEventListener('gesturestart', preventGesture, { passive: false })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
