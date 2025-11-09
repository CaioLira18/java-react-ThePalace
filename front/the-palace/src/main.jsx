import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './css/RouletteGame.css';
import './css/Header.css';
import './css/Login.css';
import './css/Home.css';
import './css/BlackjackGame.css';





import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './util/AuthContext.jsx';


createRoot(document.getElementById('root')).render(
<BrowserRouter>
    <AuthProvider>
      <StrictMode>
        <App />
      </StrictMode>
  </AuthProvider>
</BrowserRouter>
)