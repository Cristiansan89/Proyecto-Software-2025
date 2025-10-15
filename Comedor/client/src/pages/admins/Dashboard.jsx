import AdminLayout from '../../layouts/AdminLayout';

const AdminDashboard = () => {
    return (
        <AdminLayout>
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h2>Panel de Administración</h2>
                    <p>Resumen general del sistema de comedor</p>
                </div>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-icon visitors">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-info">
                            <h3>1,247</h3>
                            <p>Usuarios Activos</p>
                            <small className="stat-change positive">
                                <i className="fas fa-arrow-up"></i> +12.5%
                            </small>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon revenue">
                            <i className="fas fa-utensils"></i>
                        </div>
                        <div className="stat-info">
                            <h3>3,456</h3>
                            <p>Comidas Servidas</p>
                            <small className="stat-change positive">
                                <i className="fas fa-arrow-up"></i> +8.2%
                            </small>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon sales">
                            <i className="fas fa-boxes"></i>
                        </div>
                        <div className="stat-info">
                            <h3>89</h3>
                            <p>Insumos en Stock</p>
                            <small className="stat-change negative">
                                <i className="fas fa-arrow-down"></i> -3.1%
                            </small>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon orders">
                            <i className="fas fa-shopping-cart"></i>
                        </div>
                        <div className="stat-info">
                            <h3>156</h3>
                            <p>Pedidos Pendientes</p>
                            <small className="stat-change positive">
                                <i className="fas fa-arrow-up"></i> +5.7%
                            </small>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h4>Actividad Reciente</h4>
                                </div>
                                <div className="card-body">
                                    <div className="activity-list">
                                        <div className="activity-item">
                                            <div className="activity-icon">
                                                <i className="fas fa-user-plus text-success"></i>
                                            </div>
                                            <div className="activity-content">
                                                <p><strong>Nuevo usuario registrado:</strong> María García</p>
                                                <small className="text-muted">Hace 2 minutos</small>
                                            </div>
                                        </div>

                                        <div className="activity-item">
                                            <div className="activity-icon">
                                                <i className="fas fa-shopping-cart text-primary"></i>
                                            </div>
                                            <div className="activity-content">
                                                <p><strong>Nuevo pedido:</strong> Pedido #1234</p>
                                                <small className="text-muted">Hace 15 minutos</small>
                                            </div>
                                        </div>

                                        <div className="activity-item">
                                            <div className="activity-icon">
                                                <i className="fas fa-boxes text-warning"></i>
                                            </div>
                                            <div className="activity-content">
                                                <p><strong>Stock bajo:</strong> Arroz - Quedan 5kg</p>
                                                <small className="text-muted">Hace 1 hora</small>
                                            </div>
                                        </div>

                                        <div className="activity-item">
                                            <div className="activity-icon">
                                                <i className="fas fa-utensils text-info"></i>
                                            </div>
                                            <div className="activity-content">
                                                <p><strong>Menú actualizado:</strong> Almuerzo del día</p>
                                                <small className="text-muted">Hace 2 horas</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h4>Accesos Rápidos</h4>
                                </div>
                                <div className="card-body">
                                    <div className="quick-actions">
                                        <button className="quick-action-btn">
                                            <i className="fas fa-user-plus"></i>
                                            <span>Nuevo Usuario</span>
                                        </button>

                                        <button className="quick-action-btn">
                                            <i className="fas fa-utensils"></i>
                                            <span>Crear Menú</span>
                                        </button>

                                        <button className="quick-action-btn">
                                            <i className="fas fa-shopping-cart"></i>
                                            <span>Nuevo Pedido</span>
                                        </button>

                                        <button className="quick-action-btn">
                                            <i className="fas fa-boxes"></i>
                                            <span>Gestión Inventario</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-card mt-3">
                                <div className="card-header">
                                    <h4>Notificaciones</h4>
                                </div>
                                <div className="card-body">
                                    <div className="notification-list">
                                        <div className="notification-item urgent">
                                            <i className="fas fa-exclamation-circle"></i>
                                            <div>
                                                <p>Stock crítico en varios insumos</p>
                                                <small>3 productos</small>
                                            </div>
                                        </div>

                                        <div className="notification-item warning">
                                            <i className="fas fa-clock"></i>
                                            <div>
                                                <p>Pedidos pendientes de aprobación</p>
                                                <small>12 pedidos</small>
                                            </div>
                                        </div>

                                        <div className="notification-item info">
                                            <i className="fas fa-info-circle"></i>
                                            <div>
                                                <p>Backup programado para hoy</p>
                                                <small>22:00 hrs</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;