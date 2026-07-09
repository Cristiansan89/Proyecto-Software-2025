import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { ChangePassword } from "./auth/ChangePassword";
import { showConfirm } from "../utils/alertService";
import StylesLayouts from "../styles/Layouts.module.css";

const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  const { logout, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef(null);

  // Obtener nombre de usuario según el rol
  const getUserDisplayName = () => {
    const userRole = user?.rol || user?.nombre_rol;
    if (userRole === "Proveedor") {
      return user?.nombreUsuario.toUpperCase() || "Usuario";
    } else {
      // Para Administrador, Docente, Cocinera: mostrar nombre completo
      const nombre = user?.nombres || user?.nombre || "";
      const apellido = user?.apellidos || "";
      return apellido ? `${nombre} ${apellido}` : nombre || "Usuario";
    }
  };

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
      "Cancelar",
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
        className={`${StylesLayouts.navbar} ${
          StylesLayouts.sidebarCollapsed ? StylesLayouts.navbarShifted : ""
        }`}
      >
        <div className={`${StylesLayouts.navbarLeft}`}>
          <button
            className={`${StylesLayouts.toggleBtn}`}
            onClick={onToggleSidebar}
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>

        <div className={`${StylesLayouts.navbarRight}`}>
          <div className={`${StylesLayouts.navbarActions}`}>
            <div
              className={`${StylesLayouts.userMenuContainer}`}
              ref={dropdownRef}
            >
              <button
                className={`${StylesLayouts.userMenuButton}`}
                onClick={toggleUserMenu}
              >
                <div className={`${StylesLayouts.userDetails}`}>
                  <span className={`${StylesLayouts.userName}`}>
                    {getUserDisplayName()}
                  </span>
                </div>
                <i
                  className={`fas fa-chevron-down ${
                    showUserMenu ? StylesLayouts.rotateArrow : ""
                  }`}
                ></i>
              </button>

              {showUserMenu && (
                <div className={`${StylesLayouts.userDropdown}`}>
                  <div className={`${StylesLayouts.dropdownDivider}`}></div>
                  <button
                    className={`${StylesLayouts.dropdownItem} ${StylesLayouts.dropdownButton} ${StylesLayouts.cambiarContraseña}`}
                    onClick={handleChangePassword}
                  >
                    <i className="fas fa-key me-2"></i>
                    Cambiar Contraseña
                  </button>
                  <button
                    className={`${StylesLayouts.dropdownItem} ${StylesLayouts.dropdownButton} ${StylesLayouts.logout}`}
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
