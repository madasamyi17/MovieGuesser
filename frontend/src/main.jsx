import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { API_BASE_URL } from './utils/apiConfig'

// Configure axios to always send cookies with requests
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
