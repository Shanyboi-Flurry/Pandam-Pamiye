import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { StoreProvider } from './store.jsx'
import { ConfirmProvider } from './components/Confirm.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>
)
