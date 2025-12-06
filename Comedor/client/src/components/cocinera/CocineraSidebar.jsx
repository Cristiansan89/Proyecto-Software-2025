import { Link, useLocation } from "react-router-dom";

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
    <div className={`sidebar cocinera-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="fa-solid fa-kitchen-set"></i>
          {!collapsed && <span>Panel Cocinera</span>}
        </div>
      </div>
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-item-group">
            <Link
              to={item.path}
              className={`menu-item ${isActive(item.path) ? "active" : ""}`}
            >
              <i className={item.icon}></i>
              {!collapsed && <span className="menu-label">{item.label}</span>}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CocineraSidebar;
