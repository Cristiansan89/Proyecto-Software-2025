import { Link, useLocation } from "react-router-dom";
import StylesLayouts from "../../styles/Layouts.module.css";

const ProveedorSidebar = ({ collapsed }) => {
  const location = useLocation();
  const menuItems = [
    {
      id: "gestionproductos",
      label: "Gestión de Productos",
      icon: "fas fa-boxes",
      path: "/proveedor/gestionproductos",
    },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path ||
      (path === "/dashboard" && location.pathname === "/")
    );
  };

  return (
    <div
      className={`${StylesLayouts.sidebar} ${collapsed ? StylesLayouts.sidebarCollapsed : ""}`}
    >
      <div className={`${StylesLayouts.sidebarHeader}`}>
        <div className={`${StylesLayouts.sidebarLogo}`}>
          <i className="fas fa-truck"></i>
          {!collapsed && <span>Panel Proveedor</span>}
        </div>
      </div>
      <div className={`${StylesLayouts.sidebarMenu}`}>
        {menuItems.map((item) => (
          <div key={item.id} className={`${StylesLayouts.menuGroup}`}>
            <Link
              key={item.id}
              to={item.path}
              className={`${StylesLayouts.menuItem} ${isActive(item.path) ? StylesLayouts.active : ""}`}
            >
              <i className={item.icon}></i>
              {!collapsed && (
                <span className={`${StylesLayouts.menuLabel}`}>
                  {item.label}
                </span>
              )}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProveedorSidebar;
