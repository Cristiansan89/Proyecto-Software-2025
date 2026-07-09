import { Link, useLocation } from "react-router-dom";
import StylesLayouts from "../../styles/Layouts.module.css";

const CocineraSidebar = ({ collapsed }) => {
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "fas fa-tachometer-alt",
      path: "/cocinera/dashboard",
    },
    {
      id: "recetas",
      label: "Gestión de Recetas",
      icon: "fas fa-book-open",
      path: "/cocinera/recetas",
    },
    {
      id: "menu",
      label: "Planificación de Menús",
      icon: "fas fa-utensils",
      path: "/cocinera/menu",
    },
    {
      id: "gestion-asistencias",
      label: "Gestión de Asistencias",
      icon: "fas fa-clipboard-check",
      path: "/cocinera/gestion-asistencias",
    },
    {
      id: "menu-diaria",
      label: "Menú del Día",
      icon: "fas fa-calendar-day",
      path: "/cocinera/menu-diaria",
    },
    {
      id: "consumos",
      label: "Gestión de Consumos",
      path: "/cocinera/consumos",
      icon: "fas fa-receipt",
    },
    {
      id: "inventario",
      label: "Control de Inventario",
      icon: "fas fa-boxes",
      path: "/cocinera/inventario",
    },
    {
      id: "pedidos",
      label: "Gestión de Pedidos",
      icon: "fas fa-shopping-cart",
      path: "/cocinera/pedidos",
    },
    {
      id: "reportes",
      label: "Reportes",
      icon: "fas fa-file-alt",
      path: "/cocinera/reportes",
    },
    {
      id: "estadisticas",
      label: "Estadísticas",
      icon: "fas fa-chart-bar",
      path: "/cocinera/estadisticas",
    },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path ||
      (path === "/cocinera/dashboard" && location.pathname === "/cocinera")
    );
  };

  return (
    <div
      className={`${StylesLayouts.sidebar} ${collapsed ? StylesLayouts.sidebarCollapsed : ""}`}
    >
      <div className={`${StylesLayouts.sidebarHeader}`}>
        <div className={`${StylesLayouts.sidebarLogo}`}>
          <i className="fa-solid fa-kitchen-set"></i>
          {!collapsed && <span>Panel Cocinera</span>}
        </div>
      </div>
      <div className={`${StylesLayouts.sidebarMenu}`}>
        {menuItems.map((item) => (
          <div key={item.id} className={`${StylesLayouts.menuGroup}`}>
            <Link
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

export default CocineraSidebar;
