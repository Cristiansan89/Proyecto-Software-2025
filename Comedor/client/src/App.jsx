import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admins/Dashboard'
import ListaPersonas from './pages/admins/ListaPersonas'
import ListaGrados from './pages/admins/ListaGrados'
import GestionRolesPermisos from './pages/admins/GestionRolesPermisos'
import ListaInsumos from './pages/admins/ListaInsumos'
import ListaProveedores from './pages/admins/ListaProveedores'
import Configuracion from './pages/admins/Configuracion'
import PersonaGrado from './pages/admins/PersonaGrado'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import './styles/App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Ruta pública de login */}
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas del panel administrativo */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAuth={true}>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/dashboard" element={<AdminDashboard />} />
                      <Route path="/personas" element={<ListaPersonas />} />
                      <Route path="/grados" element={<ListaGrados />} />
                      <Route path="/roles" element={<GestionRolesPermisos />} />
                      <Route path="/insumos" element={<ListaInsumos />} />
                      <Route path="/proveedores" element={<ListaProveedores />} />
                      <Route path="/personasgrados" element={<PersonaGrado />} />
                      <Route path="/configuracion" element={<Configuracion />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Ruta raíz - redirige según autenticación */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* Rutas no encontradas */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
