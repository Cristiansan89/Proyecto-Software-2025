import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DocenteSidebar from '../components/DocenteSidebar';
import Navbar from '../components/Navbar';
import '../styles/DocenteLayout.css';

const DocenteLayout = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // Determinar la página actual basada en la URL
    const getCurrentPage = () => {
        const path = location.pathname;
        if (path.includes('/dashboard')) return 'dashboard';
        if (path.includes('/asistencias')) return 'asistencias';
        if (path.includes('/gestionasistencias')) return 'gestionasistencias';
        if (path.includes('/horarios')) return 'horarios';
        if (path.includes('/mis-alumnos')) return 'alumnos';
        return 'dashboard';
    };

    return (
        <div className="docente-layout">
            <DocenteSidebar
                collapsed={sidebarCollapsed}
                onToggle={toggleSidebar}
                currentPage={getCurrentPage()}
            />
            <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Navbar
                    onToggleSidebar={toggleSidebar}
                    sidebarCollapsed={sidebarCollapsed}
                />
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DocenteLayout;