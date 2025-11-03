import { useState } from 'react'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admins/Dashboard'
import ListaPersonas from './pages/admins/ListaPersonas'
import ListaGrados from './pages/admins/ListaGrados'
import GestionRolesPermisos from './pages/admins/GestionRolesPermisos'
import ListaInsumos from './pages/admins/ListaInsumos'
import ListaProveedores from './pages/admins/ListaProveedores'
import Configuracion from './pages/admins/Configuracion'
import AdminLayout from './layouts/AdminLayout'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard') // 'login', 'dashboard', 'personas', 'grados', 'roles', 'insumos', 'proveedores', 'configuracion'

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

  // Renderizar el contenido de la página (sin layout)
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />
      case 'personas':
        return <ListaPersonas />
      case 'grados':
        return <ListaGrados />
      case 'roles':
        return <GestionRolesPermisos />
      case 'insumos':
        return <ListaInsumos />
      case 'proveedores':
        return <ListaProveedores />
      case 'configuracion':
        return <Configuracion />
      default:
        return <AdminDashboard />
    }
  }

  // Renderizar según la página actual
  const renderCurrentPage = () => {
    if (currentPage === 'login') {
      return <Login onLoginSuccess={handleLoginSuccess} />
    }

    // Para todas las demás páginas, usar AdminLayout
    return (
      <AdminLayout onNavigate={handleNavigation} currentPage={currentPage}>
        {renderPageContent()}
      </AdminLayout>
    )
  }

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  )
}

export default App
