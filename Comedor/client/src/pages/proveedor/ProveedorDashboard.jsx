import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
import pedidoService from "../../services/pedidoService.js";
import { proveedorInsumoService } from "../../services/proveedorInsumoService.js";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import DashboardStyle from "../../styles/Dashboard.module.css";

const ProveedorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pedidosPendientes: 0,
    proximasEntregas: 0,
    insumosCatalogo: 0,
  });

  useEffect(() => {
    cargarDashboardProveedor();
  }, [user]);

  const cargarDashboardProveedor = async () => {
    try {
      setLoading(true);

      if (!user?.idProveedor) {
        console.error("Usuario sin proveedorId");
        setStats({
          pedidosPendientes: 0,
          proximasEntregas: 0,
          insumosCatalogo: 0,
        });
        return;
      }

      // Obtener pedidos del proveedor
      const pedidos = await pedidoService.getByProveedor(user.idProveedor);
      const pedidosArray = Array.isArray(pedidos) ? pedidos : [];

      // Obtener insumos del catálogo del proveedor
      const insumos = await proveedorInsumoService.getInsumosByProveedor(
        user.idProveedor,
      );
      const insumosArray = Array.isArray(insumos) ? insumos : [];

      // Calcular pedidos pendientes
      const pedidosPendientes = pedidosArray.filter(
        (pedido) => pedido.estadoPedido?.toLowerCase() === "pendiente",
      ).length;

      // Calcular próximas entregas (confirmados para hoy o mañana)
      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(hoy.getDate() + 1);

      const proximasEntregas = pedidosArray.filter((pedido) => {
        if (pedido.estadoPedido?.toLowerCase() !== "confirmado") return false;

        const fechaEmision = pedido.fechaEmision
          ? new Date(pedido.fechaEmision)
          : null;
        if (!fechaEmision) return false;

        const esHoyOManana =
          fechaEmision.toDateString() === hoy.toDateString() ||
          fechaEmision.toDateString() === mañana.toDateString();

        return esHoyOManana;
      }).length;

      // Contar insumos activos en el catálogo
      const insumosCatalogo = insumosArray.length;

      setStats({
        pedidosPendientes,
        proximasEntregas,
        insumosCatalogo,
      });
    } catch (error) {
      console.error("Error al cargar dashboard del proveedor", error);
      setStats({
        pedidosPendientes: 0,
        proximasEntregas: 0,
        insumosCatalogo: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.pageContent}>
        <div className={ContenidoStyle.loadingContainer}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando dashboard del proveedor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-home"></i>
            Dashboard
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Aquí podrás seguir el estado operativo de tus pedidos y entregas.
          </p>
        </div>
      </div>

      <div className={DashboardStyle.dashboardStats}>
        <div
          className={
            DashboardStyle.statCard +
            " bg-primary text-center justify-content-center"
          }
        >
          <div className={DashboardStyle.statInfo}>
            <h3>{stats.pedidosPendientes}</h3>
            <p>Pedidos Pendientes</p>
          </div>
        </div>
        <div
          className={
            DashboardStyle.statCard +
            " bg-success text-center justify-content-center"
          }
        >
          <div className={DashboardStyle.statInfo}>
            <h3>{stats.proximasEntregas}</h3>
            <p>Próximas Entregas</p>
          </div>
        </div>
        <div
          className={
            DashboardStyle.statCard +
            " bg-warning text-center justify-content-center"
          }
        >
          <div className={DashboardStyle.statInfo}>
            <h3>{stats.insumosCatalogo}</h3>
            <p>Insumos en Catálogo</p>
          </div>
        </div>
      </div>

      <div className={DashboardStyle.cardDashboard}>
        <div className={DashboardStyle.bodyCard}>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="border rounded p-3 h-100">
                <h6 className="fw-bold mb-2">
                  <i className="fas fa-info-circle me-2 text-primary"></i>
                  Flujo de trabajo
                </h6>
                <p className="mb-1">
                  Tus pedidos aparecen aquí en modo lectura para seguimiento.
                </p>
                <p className="mb-0 text-muted">
                  Si el sistema lo requiere, la respuesta se procesa
                  automáticamente en Telegram.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="border rounded p-3 h-100">
                <h6 className="fw-bold mb-2">
                  <i className="fas fa-shield-alt me-2 text-success"></i>
                  Estado operativo
                </h6>
                <p className="mb-1">
                  El acceso a confirmaciones y rechazos es exclusivo del bot
                  oficial.
                </p>
                <p className="mb-0 text-muted">
                  La web se mantiene como canal informativo y de seguimiento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProveedorDashboard;
