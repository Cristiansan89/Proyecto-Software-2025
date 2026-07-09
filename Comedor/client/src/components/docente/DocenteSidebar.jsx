import { Link, useLocation } from "react-router-dom";
import StylesLayouts from "../../styles/Layouts.module.css";

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
      id: "alumnos",
      label: "Mis Alumnos",
      icon: "fas fa-users",
      path: "/docente/mis-alumnos",
    },
    {
      id: "asistencias",
      label: "Asistencias",
      icon: "fas fa-clipboard-check",
      path: "/docente/asistencias",
    },
    {
      id: "horarios",
      label: "Horarios",
      icon: "fas fa-clock",
      path: "/docente/horarios",
    },
    {
      id: "calendario",
      label: "Calendario",
      icon: "fas fa-calendar",
      path: "/docente/calendario",
    },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path ||
      (path === "/docente/dashboard" && location.pathname === "/docente")
    );
  };

  return (
    <div
      className={`${StylesLayouts.sidebar} ${collapsed ? StylesLayouts.sidebarCollapsed : ""}`}
    >
      <div className={`${StylesLayouts.sidebarHeader}`}>
        <div className={`${StylesLayouts.sidebarLogo}`}>
          <i className="fas fa-chalkboard-teacher"></i>
          {!collapsed && <span>Panel Docente</span>}
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

export default DocenteSidebar;
