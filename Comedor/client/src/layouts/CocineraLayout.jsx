import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import CocineraSidebar from '../components/CocineraSidebar';
import Navbar from '../components/Navbar';
import '../styles/CocineraLayout.css';

const CocineraLayout = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // Determinar la página actual basada en la URL
    const getCurrentPage = () => {
        const path = location.pathname;
        if (path.includes('/dashboard')) return 'dashboard';
        if (path.includes('/gestion-asistencias')) return 'gestion-asistencias';
        if (path.includes('/recetas')) return 'recetas';
        if (path.includes('/menu')) return 'menu';
        if (path.includes('/inventario')) return 'inventario';
        if (path.includes('/reportes')) return 'reportes';
        return 'dashboard';
    };

    return (
        <div className="cocinera-layout">
            <CocineraSidebar
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

export default CocineraLayout;
