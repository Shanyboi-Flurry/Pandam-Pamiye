import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import ResourceDetails from './pages/ResourceDetails'
import AddResource from './pages/AddResource'
import MyBorrowings from './pages/MyBorrowings'
import MyListings from './pages/MyListings'
import Donations from './pages/Donations'
import Exchanges from './pages/Exchanges'
import CalendarPage from './pages/CalendarPage'
import EcoPoints from './pages/EcoPoints'
import Leaderboard from './pages/Leaderboard'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'
import Messages from './pages/Messages'
import Profile from './pages/Profile'

function RequireAuth({ children, role }) {
  const { user } = useStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/resource/:id" element={<ResourceDetails />} />
        <Route path="/add" element={<AddResource />} />
        <Route path="/add/:id" element={<AddResource />} />
        <Route path="/borrowings" element={<MyBorrowings />} />
        <Route path="/listings" element={<MyListings />} />
        <Route path="/donations" element={<Donations />} />
        <Route path="/exchanges" element={<Exchanges />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/ecopoints" element={<EcoPoints />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<RequireAuth role="admin"><Admin /></RequireAuth>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
