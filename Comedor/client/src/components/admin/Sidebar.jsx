import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ collapsed }) => {
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "fas fa-tachometer-alt",
      path: "/admin/dashboard",
    },
    {
      id: "configuracion",
      label: "Configuración",
      icon: "fas fa-cog",
      path: "/admin/configuracion",
    },
    {
      id: "roles",
      label: "Seguridad",
      icon: "fas fa-shield-alt",
      path: "/admin/roles",
    },
    {
      id: "personas",
      label: "Personas",
      icon: "fas fa-user-friends",
      path: "/admin/personas",
    },
    {
      id: "grados",
      label: "Grados",
      icon: "fas fa-layer-group",
      path: "/admin/grados",
    },
    {
      id: "personasgrados",
      label: "Personas a Grados",
      icon: "fas fa-chalkboard-teacher",
      path: "/admin/personasgrados",
    },
    {
      id: "proveedores",
      label: "Proveedores",
      icon: "fas fa-truck",
      path: "/admin/proveedores",
    },
    {
      id: "insumos",
      label: "Insumos",
      icon: "fas fa-boxes",
      path: "/admin/insumos",
    },
    {
      id: "auditoria",
      label: "Auditoría",
      icon: "fa-solid fa-file-shield",
      path: "/admin/auditoria",
    },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path ||
      (path === "/admin/dashboard" && location.pathname === "/admin")
    );
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="fas fa-utensils"></i>
          {!collapsed && <span>Sistema Comedor</span>}
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

export default Sidebar;
