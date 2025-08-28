import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from './contexts/auth-context.tsx'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')!).render(
        <StrictMode>
                <BrowserRouter>
                        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                                <AuthProvider >
                                        <App />
                                        <Toaster />
                                </AuthProvider >
                        </ThemeProvider>
                </BrowserRouter>
        </StrictMode>,
)
