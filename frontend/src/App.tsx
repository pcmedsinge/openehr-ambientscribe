import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Worklist from './pages/Worklist'
import PatientDetail from './pages/PatientDetail'
import ViewEncounter from './pages/ViewEncounter'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Worklist />} />
        <Route path="/patient/:ehrId" element={<PatientDetail />} />
        <Route path="/encounter/:compositionId" element={<ViewEncounter />} />
      </Routes>
    </BrowserRouter>
  )
}
