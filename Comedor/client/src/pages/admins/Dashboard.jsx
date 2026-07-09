import { useState, useEffect } from "react";
import usuarioService from "../../services/usuarioService";
import personaService from "../../services/personaService";
import insumoService from "../../services/insumoService";
import proveedorService from "../../services/proveedorService";
import { showError } from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import DashboardStyle from "../../styles/Dashboard.module.css";

const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    usuariosActivos: 0,
    personasActivas: 0,
    alumnosActivos: 0,
    docentesActivos: 0,
    insumosStock: 0,
    proveedoresActivos: 0,
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
        proveedorService.getAll().catch(() => []),
      ]);

      // Calcular estadísticas
      const usuariosActivos = usuarios.filter(
        (u) => u.estado === "Activo",
      ).length;
      const personasActivas = personas.filter(
        (p) => p.estado === "Activo",
      ).length;

      // Obtener alumnos y docentes únicos de personas
      const alumnosActivos = personas.filter(
        (p) => p.nombreRol === "Alumno" && p.estado === "Activo",
      ).length;
      const docentesActivos = personas.filter(
        (p) => p.nombreRol === "Docente" && p.estado === "Activo",
      ).length;

      const insumosStock = insumos.filter((i) => i.estado === "Activo").length;
      const proveedoresActivos = proveedores.filter(
        (p) => p.estado === "Activo",
      ).length;

      setDashboardStats({
        usuariosActivos,
        personasActivas,
        alumnosActivos,
        docentesActivos,
        insumosStock,
        proveedoresActivos,
      });
    } catch (error) {
      //console.error("Error al cargar datos del dashboard:", error);
      showError(
        "Error",
        "No se pudieron cargar las estadísticas del dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Configuración de Alertas...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={DashboardStyle.headerDashboard}>
        <div className={DashboardStyle.headerPage}>
          <div className={DashboardStyle.headerText}>
            <h2>Panel de Administración</h2>
            <p>Resumen general del sistema de comedor</p>
          </div>
          <div className={DashboardStyle.headerActions}>
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
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>
      <div className={DashboardStyle.statsDashboard}>
        <div className={`${DashboardStyle.statCard} ${DashboardStyle.users}`}>
          <div className={DashboardStyle.statIcon}>
            <i className="fas fa-users"></i>
          </div>
          <div className={DashboardStyle.statInfo}>
            <h3>{dashboardStats.usuariosActivos}</h3>
            <p>Usuarios Activos</p>
          </div>
        </div>
        <div
          className={`${DashboardStyle.statCard} ${DashboardStyle.personas}`}
        >
          <div className={DashboardStyle.statIcon}>
            <i className="fas fa-address-book"></i>
          </div>
          <div className={DashboardStyle.statInfo}>
            <h3>{dashboardStats.personasActivas}</h3>
            <p>Personas Activas</p>
          </div>
        </div>
        <div className={`${DashboardStyle.statCard} ${DashboardStyle.insumos}`}>
          <div className={DashboardStyle.statIcon}>
            <i className="fas fa-boxes"></i>
          </div>
          <div className={DashboardStyle.statInfo}>
            <h3>{dashboardStats.insumosStock}</h3>
            <p>Insumos en Stock</p>
          </div>
        </div>
        <div
          className={`${DashboardStyle.statCard} ${DashboardStyle.proveedores}`}
        >
          <div className={DashboardStyle.statIcon}>
            <i className="fas fa-truck"></i>
          </div>
          <div className={DashboardStyle.statInfo}>
            <h3>{dashboardStats.proveedoresActivos}</h3>
            <p>Proveedores Activos</p>
          </div>
        </div>
      </div>

      <div>
        <div className="row">
          <div className="col-lg-8">
            <div className={DashboardStyle.cardDashboard}>
              <div className={`${DashboardStyle.headerCard} mx-4`}>
                <h4>
                  <i className="fas fa-clock mx-1 mt-3"></i>
                  Resumen del Sistema
                </h4>
              </div>
              <div className={DashboardStyle.bodyCard}>
                <div className={DashboardStyle.systemSummary}>
                  <div className={DashboardStyle.itemSummary}>
                    <div className={DashboardStyle.iconSummary}>
                      <i className="fas fa-database text-primary"></i>
                    </div>
                    <div className={DashboardStyle.contentSummary}>
                      <h5>Estado del Sistema</h5>
                      <p className="mt-1 mb-2">
                        Todos los servicios funcionando correctamente
                      </p>
                      <div className={DashboardStyle.indicatorsStatus}>
                        <span
                          className={`${DashboardStyle.badgeStatus} ${DashboardStyle.active}`}
                        >
                          <i className="fas fa-circle"></i> Base de datos
                        </span>
                        <span
                          className={`${DashboardStyle.badgeStatus} ${DashboardStyle.active}`}
                        >
                          <i className="fas fa-circle"></i> API REST
                        </span>
                        <span
                          className={`${DashboardStyle.badgeStatus} ${DashboardStyle.active}`}
                        >
                          <i className="fas fa-circle"></i> Frontend
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={DashboardStyle.itemSummary}>
                    <div className={DashboardStyle.iconSummary}>
                      <i className="fas fa-chart-line text-success"></i>
                    </div>
                    <div className={DashboardStyle.contentSummary}>
                      <h5>Gestión de Recursos</h5>
                      <p className="mt-1 mb-2">
                        Sistema de proveedores e insumos operativo
                      </p>
                      <div className={DashboardStyle.statsResource}>
                        <div className={DashboardStyle.statResource}>
                          <i className="fas fa-truck"></i>
                          <span>Proveedores:</span>
                          <span>{dashboardStats.proveedoresActivos}</span>
                        </div>
                        <div className={DashboardStyle.statResource}>
                          <i className="fas fa-boxes"></i>
                          <span>Insumos:</span>
                          <span>{dashboardStats.insumosStock}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={DashboardStyle.itemSummary}>
                    <div className={DashboardStyle.iconSummary}>
                      <i className="fas fa-users text-dark"></i>
                    </div>
                    <div className={DashboardStyle.contentSummary}>
                      <h5>Comunidad Educativa</h5>
                      <p className="mt-1 mb-2">
                        Personal y estudiantes registrados en el sistema
                      </p>
                      <div className={DashboardStyle.statsCommunity}>
                        <div className={DashboardStyle.statCommunity}>
                          <i className="fas fa-graduation-cap"></i>
                          <span>{dashboardStats.alumnosActivos} Alumnos</span>
                        </div>
                        <div className={DashboardStyle.statCommunity}>
                          <i className="fas fa-chalkboard-teacher"></i>
                          <span>{dashboardStats.docentesActivos} Docentes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={DashboardStyle.itemSummary}>
                    <div className={DashboardStyle.iconSummary}>
                      <i className="fas fa-shield-alt text-danger"></i>
                    </div>
                    <div className={DashboardStyle.contentSummary}>
                      <h5>Seguridad y Acceso</h5>
                      <p className="mt-1 mb-2">
                        Control de usuarios y permisos activo
                      </p>
                      <div className={DashboardStyle.infoSecurity}>
                        <span className={DashboardStyle.badgeSecurity}>
                          <i className="fas fa-lock"></i>
                          Autenticación JWT
                        </span>
                        <span className={DashboardStyle.badgeSecurity}>
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
            <div className={DashboardStyle.cardDashboard}>
              <div className={`${DashboardStyle.headerCard} mx-3`}>
                <h5>
                  <i className="fas fa-info-circle mt-3 mx-1"></i>
                  Información del Sistema
                </h5>
              </div>
              <div className={DashboardStyle.bodyCard}>
                <div className={DashboardStyle.infoSystem}>
                  <div className={DashboardStyle.itemInfo}>
                    <span className={DashboardStyle.infoLabel}>Versión:</span>
                    <span className={DashboardStyle.infoValue}>2.30.33</span>
                  </div>
                  <div className={DashboardStyle.itemInfo}>
                    <span className={DashboardStyle.infoLabel}>
                      Última actualización:
                    </span>
                    <span className={DashboardStyle.infoValue}>Julio 2026</span>
                  </div>
                  <div className={DashboardStyle.itemInfo}>
                    <span className={DashboardStyle.infoLabel}>
                      Base de datos:
                    </span>
                    <span className={DashboardStyle.infoValue}>MySQL 8.x</span>
                  </div>
                  <div className={DashboardStyle.itemInfo}>
                    <span className={DashboardStyle.infoLabel}>Framework:</span>
                    <span className={DashboardStyle.infoValue}>
                      React + Node.js
                    </span>
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
