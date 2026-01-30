import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { BoatRace } from './pages/BoatRace'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/boat-race" element={<BoatRace />} />
      </Routes>
    </div>
  )
}

export default App
