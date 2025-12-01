import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/admins/Dashboard";
import ListaGrados from "./pages/admins/ListaGrados";
import GestionRolesPermisos from "./pages/admins/GestionRolesPermisos";
import ListaInsumos from "./pages/admins/ListaInsumos";
import ListaProveedores from "./pages/admins/ListaProveedores";
import Configuracion from "./pages/admins/Configuracion";
import ParametrosSistema from "./pages/admins/ParametrosSistema";
import Persona from "./pages/admins/Personas";
import PersonaGrado from "./pages/admins/PersonaGrado";
import RegistroAsistenciasMovil from "./pages/movil/RegistroAsistenciasMovil.jsx";
import TestAsistencias from "./pages/movil/TestAsistencias.jsx";
import GestionAsistencias from "./pages/docente/GestionAsistencias";
import DocenteDashboard from "./pages/docente/DocenteDashboard";
import DocenteAsistencias from "./pages/docente/DocenteAsistencias";
import RegistroAsistenciasDocente from "./pages/docente/RegistroAsistenciasDocente";
import MisAlumnos from "./pages/docente/MisAlumnos";
import Horarios from "./pages/docente/Horarios";
import AdminLayout from "./layouts/AdminLayout";
import DocenteLayout from "./layouts/DocenteLayout";
import CocineraLayout from "./layouts/CocineraLayout";
import CocineraDashboard from "./pages/cocinera/CocineraDashboard";
import CocineraGestionAsistencias from "./pages/cocinera/GestionAsistencias";
import CocineraMenu from "./pages/cocinera/CocineraMenu";
import CocineraInventario from "./pages/cocinera/CocineraInventario";
import CocineraMenuesDiaria from "./pages/cocinera/CocineraMenuesDiaria";
import CocineraReportes from "./pages/cocinera/CocineraReportes";
import CocineraRecetas from "./pages/cocinera/CocineraRecetas";
import Consumos from "./pages/cocinera/Consumos";
import PedidoInsumo from "./pages/cocinera/PedidoInsumo";
import InsumosSemanal from "./pages/cocinera/InsumosSemanal";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/App.css";

// Componente para redireccionar según el rol del usuario
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redireccionar según el rol del usuario
  const userRole = user.rol || user.nombre_rol;
  if (userRole === "Administrador") {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (userRole === "Docente") {
    return <Navigate to="/docente/dashboard" replace />;
  } else if (userRole === "Cocinera") {
    return <Navigate to="/cocinera/dashboard" replace />;
  } else {
    // Para otros roles, redirigir a admin por defecto
    return <Navigate to="/admin/dashboard" replace />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Ruta pública de login */}
            <Route path="/login" element={<Login />} />

            {/* Ruta pública para registro de asistencias móvil */}
            <Route
              path="/asistencias/registro/:token"
              element={<RegistroAsistenciasMovil />}
            />

            {/* Ruta de prueba para debuggear asistencias */}
            <Route
              path="/test/asistencias/:token"
              element={<TestAsistencias />}
            />

            {/* Rutas protegidas del panel administrativo */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute
                  requireAuth={true}
                  allowedRoles={["Administrador"]}
                >
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/dashboard" element={<AdminDashboard />} />
                      <Route path="/personas" element={<Persona />} />
                      <Route path="/grados" element={<ListaGrados />} />
                      <Route path="/roles" element={<GestionRolesPermisos />} />
                      <Route path="/insumos" element={<ListaInsumos />} />
                      <Route
                        path="/proveedores"
                        element={<ListaProveedores />}
                      />
                      <Route
                        path="/personasgrados"
                        element={<PersonaGrado />}
                      />
                      <Route
                        path="/parametros"
                        element={<ParametrosSistema />}
                      />
                      <Route
                        path="/configuracion"
                        element={<Configuracion />}
                      />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Rutas protegidas del panel docente */}
            <Route
              path="/docente/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={["Docente"]}>
                  <DocenteLayout>
                    <Routes>
                      <Route path="/" element={<DocenteDashboard />} />
                      <Route path="/dashboard" element={<DocenteDashboard />} />
                      <Route
                        path="/asistencias"
                        element={<DocenteAsistencias />}
                      />
                      <Route
                        path="/registro-asistencias"
                        element={<RegistroAsistenciasDocente />}
                      />
                      <Route
                        path="/gestionasistencias"
                        element={<GestionAsistencias />}
                      />
                      <Route path="/mis-alumnos" element={<MisAlumnos />} />
                      <Route path="/horarios" element={<Horarios />} />
                    </Routes>
                  </DocenteLayout>
                </ProtectedRoute>
              }
            />

            {/* Rutas protegidas del panel cocinera */}
            <Route
              path="/cocinera/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={["Cocinera"]}>
                  <CocineraLayout>
                    <Routes>
                      <Route path="/" element={<CocineraDashboard />} />
                      <Route
                        path="/dashboard"
                        element={<CocineraDashboard />}
                      />
                      <Route
                        path="/gestion-asistencias"
                        element={<CocineraGestionAsistencias />}
                      />
                      <Route path="/recetas" element={<CocineraRecetas />} />
                      <Route path="/menu" element={<CocineraMenu />} />
                      <Route
                        path="/inventario"
                        element={<CocineraInventario />}
                      />
                      <Route path="/reportes" element={<CocineraReportes />} />
                      <Route
                        path="/menu-diaria"
                        element={<CocineraMenuesDiaria />}
                      />
                      <Route path="/pedidos" element={<PedidoInsumo />} />
                      <Route path="/consumos" element={<Consumos />} />
                      <Route
                        path="/insumos-semanal"
                        element={<InsumosSemanal />}
                      />
                    </Routes>
                  </CocineraLayout>
                </ProtectedRoute>
              }
            />

            {/* Ruta raíz - redirige según autenticación y rol */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* Ruta dashboard - redirige según rol del usuario */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireAuth={true}>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />

            {/* Rutas no encontradas */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
