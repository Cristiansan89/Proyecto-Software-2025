
import { useState, useEffect } from 'react';
import usuarioService from '../../services/usuarioService';
import personaService from '../../services/personaService';
import insumoService from '../../services/insumoService';
import proveedorService from '../../services/proveedorService';
import '../../styles/Dashboard.css';

const AdminDashboard = () => {
    const [dashboardStats, setDashboardStats] = useState({
        usuariosActivos: 0,
        personasActivas: 0,
        alumnosActivos: 0,
        docentesActivos: 0,
        insumosStock: 0,
        proveedoresActivos: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Cargar datos en paralelo para mejor rendimiento
            const [usuarios, personas, insumos, proveedores] = await Promise.all([
                usuarioService.getAll().catch(() => []),
                personaService.getAll().catch(() => []),
                insumoService.getAll().catch(() => []),
                proveedorService.getAll().catch(() => [])
            ]);

            // Calcular estadísticas
            const usuariosActivos = usuarios.filter(u => u.estado === 'Activo').length;
            const personasActivas = personas.filter(p => p.estado === 'Activo').length;

            // Obtener alumnos y docentes únicos de personas
            const alumnosActivos = personas.filter(p => p.rol === 'Alumno' && p.estado === 'Activo').length;
            const docentesActivos = personas.filter(p => p.rol === 'Docente' && p.estado === 'Activo').length;

            const insumosStock = insumos.filter(i => i.estado === 'Activo').length;
            const proveedoresActivos = proveedores.filter(p => p.estado === 'Activo').length;


            setDashboardStats({
                usuariosActivos,
                personasActivas,
                alumnosActivos,
                docentesActivos,
                insumosStock,
                proveedoresActivos
            });

        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <div className="page-header">
                    <div className="header-text">
                        <h2>Panel de Administración</h2>
                        <p>Resumen general del sistema de comedor</p>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn btn-outline-primary"
                            onClick={loadDashboardData}
                            disabled={loading}
                            title="Actualizar estadísticas"
                        >
                            {loading ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fas fa-sync-alt"></i>
                            )}
                            <span className="ms-2">Actualizar</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="dashboard-stats">
                <div className="stat-card users">
                    <div className="stat-icon">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{dashboardStats.usuariosActivos}</h3>
                        <p>Usuarios Activos</p>
                    </div>
                </div>
                <div className="stat-card personas">
                    <div className="stat-icon">
                        <i className="fas fa-address-book"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{dashboardStats.personasActivas}</h3>
                        <p>Personas Activas</p>
                    </div>
                </div>
                <div className="stat-card insumos">
                    <div className="stat-icon">
                        <i className="fas fa-boxes"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{dashboardStats.insumosStock}</h3>
                        <p>Insumos en Stock</p>
                    </div>
                </div>
                <div className="stat-card proveedores">
                    <div className="stat-icon">
                        <i className="fas fa-truck"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{dashboardStats.proveedoresActivos}</h3>
                        <p>Proveedores Activos</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="row">
                    <div className="col-lg-8">
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h4>
                                    <i className="fas fa-clock me-2"></i>
                                    Resumen del Sistema
                                </h4>
                            </div>
                            <div className="card-body">
                                <div className="system-summary">
                                    <div className="summary-item">
                                        <div className="summary-icon">
                                            <i className="fas fa-database text-primary"></i>
                                        </div>
                                        <div className="summary-content">
                                            <h5>Estado del Sistema</h5>
                                            <p>Todos los servicios funcionando correctamente</p>
                                            <div className="status-indicators">
                                                <span className="status-badge active">
                                                    <i className="fas fa-circle"></i> Base de datos
                                                </span>
                                                <span className="status-badge active">
                                                    <i className="fas fa-circle"></i> API REST
                                                </span>
                                                <span className="status-badge active">
                                                    <i className="fas fa-circle"></i> Frontend
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-item">
                                        <div className="summary-icon">
                                            <i className="fas fa-chart-line text-success"></i>
                                        </div>
                                        <div className="summary-content">
                                            <h5>Gestión de Recursos</h5>
                                            <p>Sistema de proveedores e insumos operativo</p>
                                            <div className="resource-stats">
                                                <div className="resource-stat">
                                                    <i className="fas fa-truck"></i>
                                                    <span>Proveedores:</span>
                                                    <span>{dashboardStats.proveedoresActivos}</span>
                                                </div>
                                                <div className="resource-stat">
                                                    <i className="fas fa-boxes"></i>
                                                    <span>Insumos:</span>
                                                    <span>{dashboardStats.insumosStock}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-item">
                                        <div className="summary-icon">
                                            <i className="fas fa-users text-info"></i>
                                        </div>
                                        <div className="summary-content">
                                            <h5>Comunidad Educativa</h5>
                                            <p>Personal y estudiantes registrados en el sistema</p>
                                            <div className="community-stats">
                                                <div className="community-stat">
                                                    <i className="fas fa-graduation-cap"></i>
                                                    <span>{dashboardStats.alumnosActivos} Alumnos</span>
                                                </div>
                                                <div className="community-stat">
                                                    <i className="fas fa-chalkboard-teacher"></i>
                                                    <span>{dashboardStats.docentesActivos} Docentes</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-item">
                                        <div className="summary-icon">
                                            <i className="fas fa-shield-alt text-warning"></i>
                                        </div>
                                        <div className="summary-content">
                                            <h5>Seguridad y Acceso</h5>
                                            <p>Control de usuarios y permisos activo</p>
                                            <div className="security-info">
                                                <span className="security-badge">
                                                    <i className="fas fa-lock"></i>
                                                    Autenticación JWT
                                                </span>
                                                <span className="security-badge">
                                                    <i className="fas fa-key"></i>
                                                    {dashboardStats.usuariosActivos} Usuarios activos
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h5>
                                    <i className="fas fa-info-circle me-2"></i>
                                    Información del Sistema
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="system-info">
                                    <div className="info-item">
                                        <span className="info-label">Versión:</span>
                                        <span className="info-value">1.0.0</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Última actualización:</span>
                                        <span className="info-value">Noviembre 2025</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Base de datos:</span>
                                        <span className="info-value">MySQL 8.x</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Framework:</span>
                                        <span className="info-value">React + Node.js</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;