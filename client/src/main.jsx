import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store, persistor } from './store'
import './index.css'
import App from './App.jsx'

// Google OAuth Client ID (from .env or hardcoded fallback)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '144932328528-pt437uppkbiqdp7blb898gk7en2lsppn.apps.googleusercontent.com'
const hasValidGoogleClient = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your-google-client-id')

const AppWrapper = (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistGate>
  </Provider>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {hasValidGoogleClient ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {AppWrapper}
      </GoogleOAuthProvider>
    ) : (
      AppWrapper
    )}
  </StrictMode>,
)
