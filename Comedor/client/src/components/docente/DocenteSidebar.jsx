import { Link, useLocation } from "react-router-dom";

const DocenteSidebar = ({ collapsed }) => {
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "fas fa-tachometer-alt",
      path: "/docente/dashboard",
    },
    {
      id: "asistencias",
      label: "Asistencias",
      icon: "fas fa-clipboard-check",
      path: "/docente/asistencias",
    },
    {
      id: "registro-asistencias",
      label: "Registrar Asistencias",
      icon: "fas fa-plus-circle",
      path: "/docente/registro-asistencias",
    },
    {
      id: "alumnos",
      label: "Mis Alumnos",
      icon: "fas fa-users",
      path: "/docente/mis-alumnos",
    },
    {
      id: "gestionasistencias",
      label: "Gestión de Asistencias",
      icon: "fas fa-calendar-check",
      path: "/docente/gestionasistencias",
    },
    {
      id: "horarios",
      label: "Horarios",
      icon: "fas fa-clock",
      path: "/docente/horarios",
    },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path ||
      (path === "/docente/dashboard" && location.pathname === "/docente")
    );
  };

  return (
    <div className={`sidebar docente-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="fas fa-chalkboard-teacher"></i>
          {!collapsed && <span>Panel Docente</span>}
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

export default DocenteSidebar;
