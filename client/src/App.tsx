import { Routes, Route, Navigate } from 'react-router-dom'
import CarePingPage from './pages/CarePingPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CarePingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
