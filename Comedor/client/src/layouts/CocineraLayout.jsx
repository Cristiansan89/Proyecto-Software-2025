import { useState } from "react";
import { useLocation } from "react-router-dom";
import CocineraSidebar from "../components/cocinera/CocineraSidebar";
import Navbar from "../components/Navbar";
import LayoutStyle from "../styles/Layouts.module.css";

const CocineraLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Determinar la página actual basada en la URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return "dashboard";
    if (path.includes("/gestion-asistencias")) return "gestion-asistencias";
    if (path.includes("/recetas")) return "recetas";
    if (path.includes("/menu")) return "menu";
    if (path.includes("/inventario")) return "inventario";
    if (path.includes("/pedidos")) return "pedidos";
    if (path.includes("/reportes")) return "reportes";
    if (path.includes("/estadisticas")) return "estadisticas";
    return "dashboard";
  };

  return (
    <div className={LayoutStyle.layout}>
      <CocineraSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentPage={getCurrentPage()}
      />
      <div
        className={`${LayoutStyle.mainContent} ${
          sidebarCollapsed ? LayoutStyle.mainCollapsed : ""
        }`}
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

export default CocineraLayout;
