import { useState, useEffect } from 'react';

const Sidebar = ({ collapsed, onNavigate, currentPage }) => {
    const [activeSection, setActiveSection] = useState('dashboard');

    // Sincronizar el estado del sidebar con la página actual
    useEffect(() => {
        if (currentPage) {
            // Mapear páginas a secciones del sidebar
            switch (currentPage) {
                case 'dashboard':
                    setActiveSection('dashboard');
                    break;
                case 'personas':
                    setActiveSection('personas');
                    break;
                case 'grados':
                    setActiveSection('grados');
                    break;
                case 'insumos':
                    setActiveSection('insumos');
                    break;
                case 'proveedores':
                    setActiveSection('proveedores');
                    break;
                case 'roles':
                    setActiveSection('seguridad');
                    break;
                case 'configuracion':
                    setActiveSection('configuracion');
                    break;
                default:
                    setActiveSection('dashboard');
            }
        }
    }, [currentPage]);

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'fas fa-tachometer-alt',
            path: '/admin'
        },
        {
            id: 'seguridad',
            label: 'Seguridad',
            icon: 'fas fa-shield-alt',
            path: '/admin/seguridad/roles-permisos'
        },
        {
            id: 'personas',
            label: 'Personas',
            icon: 'fas fa-user-friends',
            path: '/admin/personas',
        },
        {
            id: 'grados',
            label: 'Grados',
            icon: 'fas fa-layer-group',
            path: '/admin/personas/grados'
        },
        {
            id: 'insumos',
            label: 'Insumos',
            icon: 'fas fa-boxes',
            path: '/admin/insumos',
        },
        {
            id: 'proveedores',
            label: 'Proveedores',
            icon: 'fas fa-truck',
            path: '/admin/proveedores',
        },
        {
            id: 'configuracion',
            label: 'Configuración',
            icon: 'fas fa-cog',
            path: '/admin/configuracion',
        }
    ];

    const handleItemClick = (item) => {
        setActiveSection(item.id);
        if (onNavigate) {
            // Mapear 'seguridad' a 'roles' para la navegación
            if (item.id === 'seguridad') {
                onNavigate('roles');
            } else {
                onNavigate(item.id);
            }
        }
    };

    return (
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <i className="fas fa-utensils"></i>
                    {!collapsed && <span>Sistema Comedor</span>}
                </div>
            </div>
            <div className="sidebar-menu">
                {menuItems.map((item) => (
                    <div key={item.id} className="menu-item-group">
                        <div
                            className={`menu-item ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => handleItemClick(item)}
                        >
                            <i className={item.icon}></i>
                            {!collapsed && (
                                <>
                                    <span className="menu-label">{item.label}</span>
                                </>
                            )}
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;