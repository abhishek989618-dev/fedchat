import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { JoinGroupPage } from './modules/guest/JoinGroupPage.tsx'

const joinMatch = window.location.pathname.match(/^\/join\/([^/]+)/)

export function Root() {
  if (joinMatch) {
    return <JoinGroupPage token={joinMatch[1]} onJoined={() => { window.history.replaceState({}, '', '/'); window.location.reload() }} />
  }
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
