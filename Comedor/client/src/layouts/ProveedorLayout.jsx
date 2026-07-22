import { useState } from "react";
import { useLocation } from "react-router-dom";
import ProveedorSidebar from "../components/proveedor/ProveedorSidebar";
import Navbar from "../components/Navbar";
import LayoutStyle from "../styles/Layouts.module.css";

const ProveedorLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Determinar la página actual basada en la URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes("/Dashboard")) return "Dashboard";
    if (path.includes("/GestionProductos")) return "GestionProductos";
    if (path.includes("/GestionPedidos")) return "GestionPedidos";
    return "GestionProductos";
  };

  return (
    <div className={`${LayoutStyle.layout}`}>
      <ProveedorSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentPage={getCurrentPage()}
      />
      <div
        className={`${LayoutStyle.mainContent} ${sidebarCollapsed ? LayoutStyle.mainCollapsed : ""}`}
      >
        <Navbar
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className={`${LayoutStyle.contentArea}`}>{children}</main>
      </div>
    </div>
  );
};

export default ProveedorLayout;
