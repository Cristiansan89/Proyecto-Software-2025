import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import CocineraLayout from "../layouts/CocineraLayout";
import DocenteLayout from "../layouts/DocenteLayout";
import ProveedorLayout from "../layouts/ProveedorLayout";

// Componente de carga simple con estilos de prevención FOUC
const LoadingFallback = () => (
  <div
    className="loading-container"
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      fontSize: "18px",
      color: "#666",
      backgroundColor: "#f8f9fa",
      flexDirection: "column",
      gap: "1rem",
    }}
  >
    <div
      style={{
        width: "50px",
        height: "50px",
        border: "4px solid #e9ecef",
        borderTop: "4px solid #667eea",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
    <div>Cargando aplicación...</div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// ===== PÁGINAS PÚBLICAS (LAZY LOADING) =====
const Login = lazy(() => import("../pages/auth/Login"));
const RegistroAsistenciasMovil = lazy(
  () => import("../pages/movil/RegistroAsistenciasMovil"),
);
const RegistroExitoso = lazy(() => import("../pages/movil/RegistroExitoso"));
const ConfirmacionProveedor = lazy(
  () => import("../pages/proveedor/confirmacionProveedor"),
);
const ConfirmacionExitosa = lazy(
  () => import("../pages/proveedor/ConfirmacionExitosa"),
);
const CocineraTelegram = lazy(
  () => import("../pages/cocinera/CocineraTelegram"),
);
const CocineraTelegramExitoso = lazy(
  () => import("../pages/cocinera/CocineraTelegramExitoso"),
);

// ===== PÁGINAS ADMIN (LAZY LOADING) =====
const AdminDashboard = lazy(() => import("../pages/admins/Dashboard"));
const ListaGrados = lazy(() => import("../pages/admins/ListaGrados"));
const GestionRolesPermisos = lazy(
  () => import("../pages/admins/GestionRolesPermisos"),
);
const ListaInsumos = lazy(() => import("../pages/admins/ListaInsumos"));
const Proveedores = lazy(() => import("../pages/admins/Proveedores"));
const Configuracion = lazy(() => import("../pages/admins/Configuracion"));
const ParametrosSistema = lazy(
  () => import("../pages/admins/ParametrosSistema"),
);
const Persona = lazy(() => import("../pages/admins/Personas"));
const Usuarios = lazy(() => import("../pages/admins/Usuarios"));
const PersonaGrado = lazy(() => import("../pages/admins/PersonaGrado"));
const Auditoria = lazy(() => import("../pages/admins/Auditoria"));

// ===== PÁGINAS DOCENTE (LAZY LOADING) =====
const DocenteDashboard = lazy(
  () => import("../pages/docente/DocenteDashboard"),
);
const DocenteAsistencias = lazy(
  () => import("../pages/docente/DocenteAsistencias"),
);
const AsistenciaAlumno = lazy(
  () => import("../pages/docente/AsistenciaAlumno"),
);
const MisAlumnos = lazy(() => import("../pages/docente/MisAlumnos"));
const Horarios = lazy(() => import("../pages/docente/Horarios"));
const Calendario = lazy(() => import("../pages/docente/Calendario"));

// ===== PÁGINAS COCINERA (LAZY LOADING) =====
const CocineraDashboard = lazy(
  () => import("../pages/cocinera/CocineraDashboard"),
);
const CocineraGestionAsistencias = lazy(
  () => import("../pages/cocinera/GestionAsistencias"),
);
const CocineraRecetas = lazy(() => import("../pages/cocinera/CocineraRecetas"));
const CocineraMenu = lazy(() => import("../pages/cocinera/CocineraMenu"));
const ControlInventario = lazy(
  () => import("../pages/cocinera/ControlInventario"),
);
const MenuesDiaria = lazy(() => import("../pages/cocinera/MenuesDiaria"));
const Pedidos = lazy(() => import("../pages/cocinera/Pedidos"));
const Consumos = lazy(() => import("../pages/cocinera/Consumos"));
const InsumosSemanal = lazy(() => import("../pages/cocinera/InsumosSemanal"));
const Estadistica = lazy(() => import("../pages/cocinera/Estadistica"));
const Reportes = lazy(() => import("../pages/cocinera/Reportes"));

// ===== PÁGINAS PROVEEDOR (LAZY LOADING) =====
const ProveedorPedidos = lazy(
  () => import("../pages/proveedor/GestionProductos"),
);

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
        <Route
          path="/asistencias/registro/:token"
          element={<RegistroAsistenciasMovil />}
        />
        <Route path="/registro-exitoso" element={<RegistroExitoso />} />
        {/* Rutas públicas para confirmación de proveedores */}
        <Route
          path="/proveedor/confirmacion/:token"
          element={<ConfirmacionProveedor />}
        />
        <Route path="/confirmacion-exitosa" element={<ConfirmacionExitosa />} />
        {/* Rutas públicas para alertas de cocinera */}
        <Route
          path="/cocinera/alertas-insumos"
          element={<CocineraTelegram />}
        />
        <Route
          path="/cocinera-telegram-exitoso"
          element={<CocineraTelegramExitoso />}
        />
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
        ===== RUTAS PROTEGIDAS DOCENTE =====
        <Route
          path="/docente/*"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={["Docente"]}>
              <DocenteLayout>
                <Routes>
                  <Route index element={<DocenteDashboard />} />
                  <Route path="/dashboard" element={<DocenteDashboard />} />
                  <Route path="/asistencias" element={<DocenteAsistencias />} />
                  <Route
                    path="/asistencia-alumno/:idAlumno"
                    element={<AsistenciaAlumno />}
                  />

                  <Route path="/mis-alumnos" element={<MisAlumnos />} />
                  <Route path="/horarios" element={<Horarios />} />
                  <Route path="/calendario" element={<Calendario />} />
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
                  <Route
                    path="/gestion-asistencias"
                    element={<CocineraGestionAsistencias />}
                  />
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
                  <Route
                    path="/gestionproductos"
                    element={<ProveedorPedidos />}
                  />
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
