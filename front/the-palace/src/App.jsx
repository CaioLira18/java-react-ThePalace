import Home from './pages/Home'
import { Route, Routes } from 'react-router-dom'
import RouletteGame from './pages/RouletteGame'
import Header from './components/Header'
import Login from './pages/Login'
import Register from './pages/Register'



function App() {

  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/roulettegame" element={<RouletteGame />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

      </Routes>
    </div>
  )
}

export default App