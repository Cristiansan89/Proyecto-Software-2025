import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ProveedorLayout.css";

const ProveedorLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <div className="proveedor-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <h2>Proveedor</h2>
          <p className="usuario-info">{user?.nombre || user?.nombreUsuario}</p>
        </div>

        <nav className="menu">
          <a
            href="/proveedor/pedidos"
            className={`menu-item ${isActive("/proveedor/pedidos")}`}
          >
            <span className="icon">📋</span>
            <span>Mis Pedidos</span>
          </a>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <span className="icon">🚪</span>
          Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <h1>Sistema de Gestión de Pedidos</h1>
          <div className="user-section">
            <span className="role-badge">Proveedor</span>
            <button className="logout-btn-sm" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  );
};

export default ProveedorLayout;
