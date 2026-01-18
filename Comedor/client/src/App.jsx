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
import Proveedores from "./pages/admins/Proveedores";
import Configuracion from "./pages/admins/Configuracion";
import ParametrosSistema from "./pages/admins/ParametrosSistema";
import Persona from "./pages/admins/Personas";
import Usuarios from "./pages/admins/Usuarios";
import PersonaGrado from "./pages/admins/PersonaGrado";
import Auditoria from "./pages/admins/Auditoria";
import RegistroAsistenciasMovil from "./pages/movil/RegistroAsistenciasMovil.jsx";
import LoginAsistencia from "./pages/movil/LoginAsistencia.jsx";
import RegistroExitoso from "./pages/movil/RegistroExitoso.jsx";
import ConfirmacionProveedor from "./pages/proveedor/confirmacionProveedor.jsx";
import ConfirmacionExitosa from "./pages/proveedor/ConfirmacionExitosa.jsx";
import ProveedorPedidos from "./pages/proveedor/ProveedorPedidos.jsx";
import GestionAsistencias from "./pages/docente/GestionAsistencias";
import DocenteDashboard from "./pages/docente/DocenteDashboard";
import DocenteAsistencias from "./pages/docente/DocenteAsistencias";
import RegistroAsistenciasDocente from "./pages/docente/RegistroAsistenciasDocente";
import MisAlumnos from "./pages/docente/MisAlumnos";
import Horarios from "./pages/docente/Horarios";
import AsistenciaFinalizado from "./pages/docente/AsistenciaFinalizado";
import AdminLayout from "./layouts/AdminLayout";
import DocenteLayout from "./layouts/DocenteLayout";
import CocineraLayout from "./layouts/CocineraLayout";
import ProveedorLayout from "./layouts/ProveedorLayout.jsx";
import CocineraDashboard from "./pages/cocinera/CocineraDashboard";
import CocineraGestionAsistencias from "./pages/cocinera/GestionAsistencias";
import CocineraMenu from "./pages/cocinera/CocineraMenu";
import ControlInventario from "./pages/cocinera/ControlInventario";
import MenuesDiaria from "./pages/cocinera/MenuesDiaria";
import CocineraRecetas from "./pages/cocinera/CocineraRecetas";
import Consumos from "./pages/cocinera/Consumos";
import Pedidos from "./pages/cocinera/Pedidos";
import PedidoInsumo from "./pages/cocinera/PedidoInsumo";
import InsumosSemanal from "./pages/cocinera/InsumosSemanal";
import Estadistica from "./pages/cocinera/Estadistica";
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
  } else if (userRole === "Proveedor") {
    return <Navigate to="/proveedor/pedidos" replace />;
  } else {
    // Para otros roles, redirigir a login por defecto
    return <Navigate to="/login" replace />;
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

            {/* Ruta pública para login de asistencias */}
            <Route
              path="/asistencias/login/:token"
              element={<LoginAsistencia />}
            />

            {/* Ruta pública para registro de asistencias móvil */}
            <Route
              path="/asistencias/registro/:token"
              element={<RegistroAsistenciasMovil />}
            />

            {/* Ruta pública para registro exitoso */}
            <Route path="/registro-exitoso" element={<RegistroExitoso />} />

            {/* Rutas públicas para confirmación de proveedores */}
            <Route
              path="/proveedor/confirmacion/:token"
              element={<ConfirmacionProveedor />}
            />
            <Route
              path="/confirmacion-exitosa"
              element={<ConfirmacionExitosa />}
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
                      <Route path="/usuarios" element={<Usuarios />} />
                      <Route path="/grados" element={<ListaGrados />} />
                      <Route path="/roles" element={<GestionRolesPermisos />} />
                      <Route path="/insumos" element={<ListaInsumos />} />
                      <Route path="/proveedores" element={<Proveedores />} />
                      <Route
                        path="/personasgrados"
                        element={<PersonaGrado />}
                      />
                      <Route
                        path="/parametros"
                        element={<ParametrosSistema />}
                      />
                      <Route path="/auditoria" element={<Auditoria />} />
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
                        path="/asistencias/finalizado"
                        element={<AsistenciaFinalizado />}
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
                        element={<ControlInventario />}
                      />
                      <Route path="/menu-diaria" element={<MenuesDiaria />} />
                      <Route path="/pedidos" element={<Pedidos />} />
                      <Route path="/consumos" element={<Consumos />} />
                      <Route
                        path="/insumos-semanal"
                        element={<InsumosSemanal />}
                      />
                      <Route path="/estadisticas" element={<Estadistica />} />
                    </Routes>
                  </CocineraLayout>
                </ProtectedRoute>
              }
            />

            {/* Rutas protegidas del panel proveedor */}
            <Route
              path="/proveedor/*"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={["Proveedor"]}>
                  <ProveedorLayout>
                    <Routes>
                      <Route path="/" element={<ProveedorPedidos />} />
                      <Route path="/pedidos" element={<ProveedorPedidos />} />
                    </Routes>
                  </ProveedorLayout>
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
