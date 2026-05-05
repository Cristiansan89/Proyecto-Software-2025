import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import DocenteLayout from "../layouts/DocenteLayout";
import CocineraLayout from "../layouts/CocineraLayout";
import ProveedorLayout from "../layouts/ProveedorLayout";

// Componente de carga simple
const LoadingFallback = () => (
  <div className="loading-container" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    <div>Cargando...</div>
  </div>
);

// ===== PÁGINAS PÚBLICAS (LAZY LOADING) =====
const Login = lazy(() => import("../pages/auth/Login"));
const LoginAsistencia = lazy(() => import("../pages/movil/LoginAsistencia"));
const RegistroAsistenciasMovil = lazy(() => import("../pages/movil/RegistroAsistenciasMovil"));
const RegistroExitoso = lazy(() => import("../pages/movil/RegistroExitoso"));
const ConfirmacionProveedor = lazy(() => import("../pages/proveedor/confirmacionProveedor"));
const ConfirmacionExitosa = lazy(() => import("../pages/proveedor/ConfirmacionExitosa"));
const CocineraTelegram = lazy(() => import("../pages/cocinera/CocineraTelegram"));
const CocineraTelegramExitoso = lazy(() => import("../pages/cocinera/CocineraTelegramExitoso"));
const RegistroAsistenciasDocentePublico = lazy(() => import("../pages/docente/RegistroAsistenciasDocente"));

// ===== PÁGINAS ADMIN (LAZY LOADING) =====
const AdminDashboard = lazy(() => import("../pages/admins/Dashboard"));
const ListaGrados = lazy(() => import("../pages/admins/ListaGrados"));
const GestionRolesPermisos = lazy(() => import("../pages/admins/GestionRolesPermisos"));
const ListaInsumos = lazy(() => import("../pages/admins/ListaInsumos"));
const Proveedores = lazy(() => import("../pages/admins/Proveedores"));
const Configuracion = lazy(() => import("../pages/admins/Configuracion"));
const ParametrosSistema = lazy(() => import("../pages/admins/ParametrosSistema"));
const Persona = lazy(() => import("../pages/admins/Personas"));
const Usuarios = lazy(() => import("../pages/admins/Usuarios"));
const PersonaGrado = lazy(() => import("../pages/admins/PersonaGrado"));
const Auditoria = lazy(() => import("../pages/admins/Auditoria"));

// ===== PÁGINAS DOCENTE (LAZY LOADING) =====
const DocenteDashboard = lazy(() => import("../pages/docente/DocenteDashboard"));
const DocenteAsistencias = lazy(() => import("../pages/docente/DocenteAsistencias"));
const RegistroAsistenciasDocente = lazy(() => import("../pages/docente/RegistroAsistenciasDocente"));
const AsistenciaFinalizado = lazy(() => import("../pages/docente/AsistenciaFinalizado"));
const GestionAsistenciasDocente = lazy(() => import("../pages/docente/GestionAsistencias"));
const MisAlumnos = lazy(() => import("../pages/docente/MisAlumnos"));
const Horarios = lazy(() => import("../pages/docente/Horarios"));

// ===== PÁGINAS COCINERA (LAZY LOADING) =====
const CocineraDashboard = lazy(() => import("../pages/cocinera/CocineraDashboard"));
const CocineraGestionAsistencias = lazy(() => import("../pages/cocinera/GestionAsistencias"));
const CocineraRecetas = lazy(() => import("../pages/cocinera/CocineraRecetas"));
const CocineraMenu = lazy(() => import("../pages/cocinera/CocineraMenu"));
const ControlInventario = lazy(() => import("../pages/cocinera/ControlInventario"));
const MenuesDiaria = lazy(() => import("../pages/cocinera/MenuesDiaria"));
const Pedidos = lazy(() => import("../pages/cocinera/Pedidos"));
const Consumos = lazy(() => import("../pages/cocinera/Consumos"));
const InsumosSemanal = lazy(() => import("../pages/cocinera/InsumosSemanal"));
const Estadistica = lazy(() => import("../pages/cocinera/Estadistica"));
const Reportes = lazy(() => import("../pages/cocinera/Reportes"));

// ===== PÁGINAS PROVEEDOR (LAZY LOADING) =====
const ProveedorPedidos = lazy(() => import("../pages/proveedor/ProveedorPedidos"));

// Componente para redireccionar según el rol del usuario
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

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
    return <Navigate to="/login" replace />;
  }
};

export const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* ===== RUTAS PÚBLICAS ===== */}
        <Route path="/login" element={<Login />} />

        {/* Rutas públicas para asistencias móvil */}
        <Route path="/asistencias/login/:token" element={<LoginAsistencia />} />
        <Route path="/asistencias/registro/:token" element={<RegistroAsistenciasMovil />} />
        <Route path="/registro-exitoso" element={<RegistroExitoso />} />

        {/* Rutas públicas para confirmación de proveedores */}
        <Route path="/proveedor/confirmacion/:token" element={<ConfirmacionProveedor />} />
        <Route path="/confirmacion-exitosa" element={<ConfirmacionExitosa />} />

        {/* Rutas públicas para alertas de cocinera */}
        <Route path="/cocinera/alertas-insumos" element={<CocineraTelegram />} />
        <Route path="/cocinera-telegram-exitoso" element={<CocineraTelegramExitoso />} />

        {/* Rutas públicas para registro de asistencias del docente */}
        <Route path="/docente/registro-asistencias-publico" element={<RegistroAsistenciasDocentePublico />} />

        {/* ===== RUTAS PROTEGIDAS ADMIN ===== */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={["Administrador"]}>
              <AdminLayout>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/personas" element={<Persona />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                  <Route path="/grados" element={<ListaGrados />} />
                  <Route path="/roles" element={<GestionRolesPermisos />} />
                  <Route path="/insumos" element={<ListaInsumos />} />
                  <Route path="/proveedores" element={<Proveedores />} />
                  <Route path="/personasgrados" element={<PersonaGrado />} />
                  <Route path="/parametros" element={<ParametrosSistema />} />
                  <Route path="/auditoria" element={<Auditoria />} />
                  <Route path="/configuracion" element={<Configuracion />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ===== RUTAS PROTEGIDAS DOCENTE ===== */}
        <Route
          path="/docente/*"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={["Docente"]}>
              <DocenteLayout>
                <Routes>
                  <Route index element={<DocenteDashboard />} />
                  <Route path="/dashboard" element={<DocenteDashboard />} />
                  <Route path="/asistencias" element={<DocenteAsistencias />} />
                  <Route path="/registro-asistencias" element={<RegistroAsistenciasDocente />} />
                  <Route path="/asistencias/finalizado" element={<AsistenciaFinalizado />} />
                  <Route path="/gestionasistencias" element={<GestionAsistenciasDocente />} />
                  <Route path="/mis-alumnos" element={<MisAlumnos />} />
                  <Route path="/horarios" element={<Horarios />} />
                </Routes>
              </DocenteLayout>
            </ProtectedRoute>
          }
        />

        {/* ===== RUTAS PROTEGIDAS COCINERA ===== */}
        <Route
          path="/cocinera/*"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={["Cocinera"]}>
              <CocineraLayout>
                <Routes>
                  <Route index element={<CocineraDashboard />} />
                  <Route path="/dashboard" element={<CocineraDashboard />} />
                  <Route path="/gestion-asistencias" element={<CocineraGestionAsistencias />} />
                  <Route path="/recetas" element={<CocineraRecetas />} />
                  <Route path="/menu" element={<CocineraMenu />} />
                  <Route path="/inventario" element={<ControlInventario />} />
                  <Route path="/menu-diaria" element={<MenuesDiaria />} />
                  <Route path="/pedidos" element={<Pedidos />} />
                  <Route path="/consumos" element={<Consumos />} />
                  <Route path="/insumos-semanal" element={<InsumosSemanal />} />
                  <Route path="/estadisticas" element={<Estadistica />} />
                  <Route path="/reportes" element={<Reportes />} />
                </Routes>
              </CocineraLayout>
            </ProtectedRoute>
          }
        />

        {/* ===== RUTAS PROTEGIDAS PROVEEDOR ===== */}
        <Route
          path="/proveedor/*"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={["Proveedor"]}>
              <ProveedorLayout>
                <Routes>
                  <Route index element={<ProveedorPedidos />} />
                  <Route path="/pedidos" element={<ProveedorPedidos />} />
                </Routes>
              </ProveedorLayout>
            </ProtectedRoute>
          }
        />

        {/* ===== RUTAS DE REDIRECCIÓN ===== */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireAuth={true}>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 - No encontrada */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
