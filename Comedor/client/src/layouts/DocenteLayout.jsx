import { useState } from "react";
import { useLocation } from "react-router-dom";
import DocenteSidebar from "../components/docente/DocenteSidebar";
import Navbar from "../components/Navbar";
import LayoutStyle from "../styles/Layouts.module.css";

const DocenteLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Determinar la página actual basada en la URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return "dashboard";
    if (path.includes("/registro-asistencias")) return "registro-asistencias";
    if (path.includes("/asistencias")) return "asistencias";
    if (path.includes("/gestionasistencias")) return "gestionasistencias";
    if (path.includes("/horarios")) return "horarios";
    if (path.includes("/mis-alumnos")) return "alumnos";
    if (path.includes("/calendario")) return "calendario";
    return "dashboard";
  };

  return (
    <div className={`${LayoutStyle.layout}`}>
      <DocenteSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentPage={getCurrentPage()}
      />
      <div
        className={`${LayoutStyle.mainContent} ${LayoutStyle.sidebarCollapsed} ? ${LayoutStyle.sidebarCollapsed}   : ""}`}
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

export default DocenteLayout;
