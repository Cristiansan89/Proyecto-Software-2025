import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const AdminLayout = ({ children, onNavigate, currentPage }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="admin-layout">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={toggleSidebar}
                onNavigate={onNavigate}
                currentPage={currentPage}
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

export default AdminLayout;
