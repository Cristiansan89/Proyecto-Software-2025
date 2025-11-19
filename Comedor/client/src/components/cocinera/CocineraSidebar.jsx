import { Link, useLocation } from 'react-router-dom';

const CocineraSidebar = ({ collapsed }) => {
    const location = useLocation();

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'fas fa-tachometer-alt',
            path: '/cocinera/dashboard'
        },
        {
            id: 'gestion-asistencias',
            label: 'Gestión de Asistencias',
            icon: 'fas fa-clipboard-check',
            path: '/cocinera/gestion-asistencias'
        },
        {
            id: 'recetas',
            label: 'Gestión de Recetas',
            icon: 'fas fa-book-open',
            path: '/cocinera/recetas'
        },
        {
            id: 'menu',
            label: 'Planificación de Menús',
            icon: 'fas fa-utensils',
            path: '/cocinera/menu'
        },
        {
            id: 'inventario',
            label: 'Control de Inventario',
            icon: 'fas fa-boxes',
            path: '/cocinera/inventario'
        },
        {
            id: 'reportes',
            label: 'Reportes',
            icon: 'fas fa-chart-line',
            path: '/cocinera/reportes'
        }
    ];

    const isActive = (path) => {
        return location.pathname === path || (path === '/cocinera/dashboard' && location.pathname === '/cocinera');
    };

    return (
        <div className={`sidebar cocinera-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <i className="fa-solid fa-kitchen-set"></i>
                    {!collapsed && <span>Panel Cocinera</span>}
                </div>
            </div>
            <div className="sidebar-menu">
                {menuItems.map((item) => (
                    <div key={item.id} className="menu-item-group">
                        <Link
                            to={item.path}
                            className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <i className={item.icon}></i>
                            {!collapsed && (
                                <span className="menu-label">{item.label}</span>
                            )}
                        </Link>
                    </div>
                ))}
            </div>

            {/* Información de ayuda */}
            {!collapsed && (
                <div className="sidebar-info">
                    <div className="info-card">
                        <div className="info-icon">
                            <i className="fas fa-lightbulb"></i>
                        </div>
                        <div className="info-content">
                            <h6>Centro de Ayuda</h6>
                            <p>Gestiona asistencias y planifica menús de forma eficiente</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CocineraSidebar;

