import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Navbar from "../components/Navbar";
// 1. Unificamos la importación con minúscula (buena práctica en JS)
import LayoutStyle from "../styles/Layouts.module.css";

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return "dashboard";
    if (path.includes("/personas")) return "personas";
    if (path.includes("/parametros")) return "parametros";
    if (path.includes("/grados")) return "grados";
    if (path.includes("/roles")) return "roles";
    if (path.includes("/insumos")) return "insumos";
    if (path.includes("/usuarios")) return "usuarios";
    if (path.includes("/proveedores")) return "proveedores";
    if (path.includes("/personasgrados")) return "personasgrados";
    if (path.includes("/configuracion")) return "configuracion";
    return "dashboard";
  };

  return (
    <div className={LayoutStyle.layout}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentPage={getCurrentPage()}
      />

      {/* 2. Corregido: Si está colapsado, aplica LayoutStyle.mainCollapsed tal como está en tu CSS */}
      <div
        className={`${LayoutStyle.mainContent} ${
          sidebarCollapsed ? LayoutStyle.mainCollapsed : ""
        }`}
      >
        <Navbar
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* 3. Ajustado para asegurar que no pierda los márgenes internos que tenías */}
        <main className={LayoutStyle.contentArea}>{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
