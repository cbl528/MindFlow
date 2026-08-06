import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useChatStore } from './stores/chatStore'
import { initTheme } from './stores/themeStore'
import './styles/globals.css'

initTheme()
useChatStore.getState().init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
