const Navbar = ({ onToggleSidebar }) => {
    return (
        <nav className="admin-navbar">
            <div className="navbar-left">
                <button
                    className="sidebar-toggle-btn"
                    onClick={onToggleSidebar}
                >
                    <i className="fas fa-bars"></i>
                </button>
                <h1 className="page-title">Dashboard</h1>
            </div>

            <div className="navbar-right">
                <div className="navbar-actions">
                    <button className="nav-action-btn">
                        <i className="fas fa-bell"></i>
                        <span className="notification-badge">3</span>
                    </button>

                    <button className="nav-action-btn">
                        <i className="fas fa-envelope"></i>
                    </button>

                    <div className="user-menu">
                        <div className="user-avatar">
                            <i className="fas fa-user-circle"></i>
                        </div>
                        <div className="user-info">
                            <span className="user-name">Admin</span>
                            <i className="fas fa-chevron"></i>
                        </div>
                    </div>

                    <button className="logout-btn">
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;