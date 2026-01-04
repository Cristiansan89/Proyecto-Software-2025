import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { ChangePassword } from "./auth/ChangePassword";
import { showConfirm } from "../utils/alertService";

const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  const { logout, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    // Agregamos 'await' para esperar la decisión del usuario
    const confirmed = await showConfirm(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      "Sí, cerrar sesión",
      "Cancelar"
    );

    if (confirmed) {
      logout();
    }
    // No hace falta un 'else', si es falso, simplemente no entra al bloque
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleChangePassword = () => {
    setShowUserMenu(false);
    setShowChangePassword(true);
  };

  return (
    <>
      <nav
        className={`admin-navbar ${
          sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <div className="navbar-left">
          <button className="sidebar-toggle-btn" onClick={onToggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
        </div>

        <div className="navbar-right">
          <div className="navbar-actions">
            <div className="user-menu-container" ref={dropdownRef}>
              <button className="user-menu-button" onClick={toggleUserMenu}>
                <div className="user-avatar">
                  <i className="fas fa-user-circle"></i>
                </div>
                <div className="user-info">
                  <span className="user-name">
                    {user?.nombres || user?.nombre || "Usuario"}
                  </span>
                  <i
                    className={`fas fa-chevron-down ${
                      showUserMenu ? "rotate" : ""
                    }`}
                  ></i>
                </div>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-item">
                    <i className="fas fa-user me-2"></i>
                    {user?.nombreUsuario}
                  </div>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item dropdown-button"
                    onClick={handleChangePassword}
                  >
                    <i className="fas fa-key me-2"></i>
                    Cambiar Contraseña
                  </button>
                  <button
                    className="dropdown-item dropdown-button logout"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal de Cambiar Contraseña */}
      {showChangePassword && (
        <ChangePassword
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            setShowChangePassword(false);
          }}
        />
      )}
    </>
  );
};

export default Navbar;
