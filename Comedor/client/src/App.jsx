import { useState } from 'react'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admins/Dashboard'
import ListaPersonas from './pages/admins/ListaPersonas'
import ListaGrados from './pages/admins/ListaGrados'
import ListaUsuarios from './pages/admins/ListaUsuarios'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [currentPage, setCurrentPage] = useState('usuarios') // 'login', 'dashboard', 'personas', 'grados', 'usuarios'

  // Evitar warning del linter - userRole se usará para control de acceso
  console.log('User role:', userRole);

  // Simulación de login exitoso - en un caso real esto vendría del contexto de autenticación
  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true)
    setUserRole(role)
    setCurrentPage('dashboard')
  }

  // Función para navegar entre páginas
  const handleNavigation = (page) => {
    setCurrentPage(page)
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
        return <AdminDashboard onNavigate={handleNavigation} />
      case 'personas':
        return <ListaPersonas onNavigate={handleNavigation} />
      case 'grados':
        return <ListaGrados onNavigate={handleNavigation} />
      case 'usuarios':
        return <ListaUsuarios onNavigate={handleNavigation} />
      default:
        return <ListaPersonas onNavigate={handleNavigation} />
    }
  }

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  )
}

export default App
