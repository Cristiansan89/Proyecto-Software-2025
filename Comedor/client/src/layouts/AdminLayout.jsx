import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const AdminLayout = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="admin-layout">
            <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
            <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Navbar onToggleSidebar={toggleSidebar} />
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
