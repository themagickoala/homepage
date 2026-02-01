import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { BoatRace } from './pages/BoatRace'
import { DeepSeaAdventure } from './pages/DeepSeaAdventure'
import { BeastQuest } from './pages/BeastQuest'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/boat-race" element={<BoatRace />} />
        <Route path="/deep-sea-adventure" element={<DeepSeaAdventure />} />
        <Route path="/beast-quest" element={<BeastQuest />} />
      </Routes>
    </div>
  )
}

export default App
