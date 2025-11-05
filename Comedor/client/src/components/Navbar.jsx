import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleSidebar, sidebarCollapsed }) => {
    const { logout, user } = useAuth();

    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            logout();
        }
    };

    return (
        <nav className={`admin-navbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="navbar-left">
                <button
                    className="sidebar-toggle-btn"
                    onClick={onToggleSidebar}
                >
                    <i className="fas fa-bars"></i>
                </button>

            </div>

            <div className="navbar-right">
                <div className="navbar-actions">
                    <div className="user-menu">
                        <div className="user-avatar">
                            <i className="fas fa-user-circle"></i>
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.nombres || 'Usuario'}</span>
                            <i className="fas fa-chevron"></i>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;