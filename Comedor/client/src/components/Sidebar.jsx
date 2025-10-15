import { useState } from 'react';

const Sidebar = ({ collapsed, onToggle, onNavigate }) => {
    const [activeSection, setActiveSection] = useState('usuarios');

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'fas fa-tachometer-alt',
            path: '/admin'
        },
        {
            id: 'usuarios',
            label: 'Usuarios',
            icon: 'fas fa-users',
            path: '/admin/usuarios',
            submenu: [
                { id: 'lista-usuarios', label: 'Lista de Usuarios', path: '/admin/usuarios' },
                { id: 'crear-usuario', label: 'Crear Usuario', path: '/admin/usuarios/crear' },
                { id: 'roles', label: 'Roles y Permisos', path: '/admin/usuarios/roles' }
            ]
        },
        {
            id: 'personas',
            label: 'Personas',
            icon: 'fas fa-user-friends',
            path: '/admin/personas',
            submenu: [
                { id: 'lista-personas', label: 'Lista de Personas', path: '/admin/personas' },
                { id: 'grados', label: 'Grados', path: '/admin/personas/grados' },
                { id: 'asistencias', label: 'Asistencias', path: '/admin/personas/asistencias' }
            ]
        },
        {
            id: 'inventarios',
            label: 'Inventarios',
            icon: 'fas fa-boxes',
            path: '/admin/inventarios',
            submenu: [
                { id: 'insumos', label: 'Insumos', path: '/admin/inventarios/insumos' },
                { id: 'movimientos', label: 'Movimientos', path: '/admin/inventarios/movimientos' },
                { id: 'proveedores', label: 'Proveedores', path: '/admin/inventarios/proveedores' }
            ]
        },
        {
            id: 'menus',
            label: 'Menús',
            icon: 'fas fa-utensils',
            path: '/admin/menus',
            submenu: [
                { id: 'planificacion', label: 'Planificación', path: '/admin/menus/planificacion' },
                { id: 'recetas', label: 'Recetas', path: '/admin/menus/recetas' },
                { id: 'items-recetas', label: 'Items de Recetas', path: '/admin/menus/items' }
            ]
        },
        {
            id: 'pedidos',
            label: 'Pedidos',
            icon: 'fas fa-shopping-cart',
            path: '/admin/pedidos',
            submenu: [
                { id: 'lista-pedidos', label: 'Lista de Pedidos', path: '/admin/pedidos' },
                { id: 'lineas-pedidos', label: 'Líneas de Pedidos', path: '/admin/pedidos/lineas' }
            ]
        },
        {
            id: 'consumos',
            label: 'Consumos',
            icon: 'fas fa-chart-line',
            path: '/admin/consumos'
        },
        {
            id: 'configuracion',
            label: 'Configuración',
            icon: 'fas fa-cog',
            path: '/admin/configuracion',
            submenu: [
                { id: 'parametros', label: 'Parámetros del Sistema', path: '/admin/configuracion/parametros' }
            ]
        }
    ];

    const handleItemClick = (item) => {
        setActiveSection(item.id);
        if (onNavigate) {
            onNavigate(item.id);
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
                                    {item.submenu && (
                                        <i className="fas fa-chevron-down menu-arrow"></i>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Submenu */}
                        {item.submenu && !collapsed && activeSection === item.id && (
                            <div className="submenu">
                                {item.submenu.map((subItem) => (
                                    <div
                                        key={subItem.id}
                                        className="submenu-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onNavigate) {
                                                // Mapear rutas específicas a páginas
                                                if (subItem.id === 'lista-personas') {
                                                    onNavigate('personas');
                                                } else if (subItem.id === 'grados') {
                                                    onNavigate('grados');
                                                } else if (subItem.id === 'lista-usuarios' || subItem.id === 'crear-usuario') {
                                                    onNavigate('usuarios');
                                                } else {
                                                    console.log('Navigating to:', subItem.path);
                                                }
                                            }
                                        }}
                                    >
                                        <span>{subItem.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        <i className="fas fa-user-shield"></i>
                    </div>
                    {!collapsed && (
                        <div className="user-details">
                            <span className="user-name">Administrador</span>
                            <span className="user-role">Admin</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;