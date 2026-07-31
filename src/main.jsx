import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DashboardPasien from './DashboardPasien'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DashboardPasien />
  </StrictMode>,
)
