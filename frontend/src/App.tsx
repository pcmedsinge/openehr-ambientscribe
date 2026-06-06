import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Worklist from './pages/Worklist'
import PatientDetail from './pages/PatientDetail'
import ViewEncounter from './pages/ViewEncounter'
import NewEncounter from './pages/NewEncounter'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Worklist />} />
        <Route path="/patient/:ehrId" element={<PatientDetail />} />
        <Route path="/patient/:ehrId/new-encounter" element={<NewEncounter />} />
        <Route path="/encounter/:compositionId" element={<ViewEncounter />} />
      </Routes>
    </BrowserRouter>
  )
}
