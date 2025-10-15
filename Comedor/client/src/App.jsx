import { useState } from 'react'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admins/Dashboard'
import ListaPersonas from './pages/admins/ListaPersonas'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [currentPage, setCurrentPage] = useState('personas') // 'login', 'dashboard', 'personas'

  // Simulación de login exitoso - en un caso real esto vendría del contexto de autenticación
  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true)
    setUserRole(role)
    setCurrentPage('dashboard')
  }

  // Para propósitos de demostración
  const showDemo = true // Cambiar a false para ver el login

  if (!isAuthenticated && !showDemo) {
    return (
      <div className="App">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  // Renderizar según la página actual
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />
      case 'dashboard':
        return <AdminDashboard />
      case 'personas':
        return <ListaPersonas />
      default:
        return <ListaPersonas />
    }
  }

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  )
}

export default App
