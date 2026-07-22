import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
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

      // TODO: conectar con el endpoint real del proveedor
      // const response = await API.get(`/proveedor/dashboard?proveedorId=${...}`);
      // const data = response.data;

      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockPedidos = [
        {
          id: 1,
          numeroPedido: "PED-0001",
          estado: "Pendiente",
          fechaSolicitud: "2026-07-21",
          fechaEntregaSolicitada: "2026-07-22",
          proveedorId: user?.idPersona || user?.id_persona || 1,
          detalles: [
            {
              nombreInsumo: "Arroz",
              cantidadSolicitada: 20,
              unidadMedida: "kg",
            },
            {
              nombreInsumo: "Aceite",
              cantidadSolicitada: 4,
              unidadMedida: "L",
            },
          ],
        },
        {
          id: 2,
          numeroPedido: "PED-0002",
          estado: "Confirmado",
          fechaSolicitud: "2026-07-20",
          fechaEntregaSolicitada: "2026-07-22",
          proveedorId: user?.idPersona || user?.id_persona || 1,
          detalles: [
            {
              nombreInsumo: "Fideos",
              cantidadSolicitada: 15,
              unidadMedida: "kg",
            },
          ],
        },
        {
          id: 3,
          numeroPedido: "PED-0003",
          estado: "Rechazado",
          fechaSolicitud: "2026-07-19",
          fechaEntregaSolicitada: "2026-07-21",
          proveedorId: user?.idPersona || user?.id_persona || 1,
          detalles: [
            {
              nombreInsumo: "Leche",
              cantidadSolicitada: 10,
              unidadMedida: "L",
            },
          ],
        },
        {
          id: 4,
          numeroPedido: "PED-0004",
          estado: "Pendiente",
          fechaSolicitud: "2026-07-22",
          fechaEntregaSolicitada: "2026-07-23",
          proveedorId: user?.idPersona || user?.id_persona || 1,
          detalles: [
            {
              nombreInsumo: "Harina",
              cantidadSolicitada: 12,
              unidadMedida: "kg",
            },
          ],
        },
      ];

      const mockCatalogo = [
        { id: 1, nombre: "Arroz", estado: "Activo" },
        { id: 2, nombre: "Aceite", estado: "Activo" },
        { id: 3, nombre: "Fideos", estado: "Activo" },
        { id: 4, nombre: "Harina", estado: "Activo" },
        { id: 5, nombre: "Leche", estado: "Activo" },
        { id: 6, nombre: "Azúcar", estado: "Inactivo" },
      ];

      const pedidosPendientes = mockPedidos.filter(
        (pedido) => pedido.estado === "Pendiente",
      ).length;

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(hoy.getDate() + 1);

      const proximasEntregas = mockPedidos.filter((pedido) => {
        if (pedido.estado !== "Confirmado") return false;

        const fechaEntrega = new Date(pedido.fechaEntregaSolicitada);
        const esHoyOManana =
          fechaEntrega.toDateString() === hoy.toDateString() ||
          fechaEntrega.toDateString() === mañana.toDateString();

        return esHoyOManana;
      }).length;

      setStats({
        pedidosPendientes,
        proximasEntregas,
        insumosCatalogo: mockCatalogo.filter((item) => item.estado === "Activo")
          .length,
      });
    } catch (error) {
      console.error("Error al cargar dashboard del proveedor", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = useMemo(
    () => [
      { label: "Dashboard", path: "/proveedor/dashboard", active: true },
      { label: "Gestión de Productos", path: "/proveedor/gestionproductos" },
      { label: "Gestión de Pedidos", path: "/proveedor/gestionpedidos" },
    ],
    [],
  );

  const resumenCards = [
    {
      icon: "fas fa-clock",
      title: "Pedidos Pendientes",
      value: stats.pedidosPendientes,
      tone: "warning",
      subtitle: "Esperando respuesta vía Telegram",
    },
    {
      icon: "fas fa-truck",
      title: "Próximas Entregas",
      value: stats.proximasEntregas,
      tone: "info",
      subtitle: "Pedidos confirmados para hoy o mañana",
    },
    {
      icon: "fas fa-boxes",
      title: "Insumos en Catálogo",
      value: stats.insumosCatalogo,
      tone: "success",
      subtitle: "Productos activos ofrecidos a la institución",
    },
  ];

  const getCardStyle = (tone) => {
    const map = {
      warning: "#ffb703",
      info: "#3b82f6",
      success: "#10b981",
    };

    return {
      background: `linear-gradient(135deg, ${map[tone] || "#667eea"}, #ffffff)`,
      color: "#0f172a",
    };
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
            <i className="fas fa-home me-2"></i>
            Dashboard del Proveedor
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Bienvenido, {user?.nombres || user?.nombre || "Proveedor"}. Aquí
            podrás seguir el estado operativo de tus pedidos y entregas.
          </p>
        </div>
      </div>

      <div className={ContenidoStyle.navigationTabs}>
        <div className={ContenidoStyle.tabsHeader}>
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              to={tab.path}
              className={`${ContenidoStyle.tabsButton} ${tab.active ? ContenidoStyle.active : ""}`}
            >
              <i
                className={
                  tab.path === "/proveedor/dashboard"
                    ? "fas fa-chart-line"
                    : tab.path === "/proveedor/gestionproductos"
                      ? "fas fa-boxes"
                      : "fas fa-shopping-cart"
                }
              ></i>
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className={DashboardStyle.dashboardStats}>
        {resumenCards.map((card) => (
          <div
            key={card.title}
            className={DashboardStyle.statCard}
            style={getCardStyle(card.tone)}
          >
            <div className="me-3">
              <i className={card.icon}></i>
            </div>
            <div>
              <h3>{card.value}</h3>
              <p>{card.title}</p>
              <small>{card.subtitle}</small>
            </div>
          </div>
        ))}
      </div>

      <div className={DashboardStyle.cardDashboard}>
        <div
          className={`${DashboardStyle.headerCard} ${DashboardStyle.cardDashboard}`}
        >
          <h5>
            <i className="fas fa-telegram me-2"></i>
            Confirmaciones y rechazos
          </h5>
        </div>
        <div className={DashboardStyle.bodyCard}>
          <div className="alert alert-info mb-0" role="alert">
            Las confirmaciones y rechazos de pedidos se realizan únicamente a
            través de nuestro bot oficial de Telegram.
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
