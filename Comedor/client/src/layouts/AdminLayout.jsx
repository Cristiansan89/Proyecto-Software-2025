import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Navbar from "../components/Navbar";

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Determinar la página actual basada en la URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return "dashboard";
    if (path.includes("/personas")) return "personas";
    if (path.includes("/grados")) return "grados";
    if (path.includes("/roles")) return "roles";
    if (path.includes("/insumos")) return "insumos";
    if (path.includes("/proveedores")) return "proveedores";
    if (path.includes("/personasgrados")) return "personasgrados";
    if (path.includes("/configuracion")) return "configuracion";
    return "dashboard";
  };

  return (
    <div className="admin-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentPage={getCurrentPage()}
      />
      <div
        className={`main-content ${
          sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <Navbar
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
