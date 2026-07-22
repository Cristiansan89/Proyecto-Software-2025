import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PedidoListado from "../../components/proveedor/PedidoListado.jsx";
import API from "../../services/api.js";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import PedidoStyle from "../../styles/Pedido.module.css";

const GestionPedidos = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    cargarPedidosProveedor();
  }, [user]);

  const cargarPedidosProveedor = async () => {
    try {
      setLoading(true);

      // TODO: conectar con el endpoint real de pedidos del proveedor
      // const response = await API.get(`/pedidos/proveedor?idProveedor=${...}`);
      // const data = response.data;

      await new Promise((resolve) => setTimeout(resolve, 450));

      const proveedorId = user?.idPersona || user?.id_persona || 1;

      const pedidosMock = [
        {
          id: 1,
          numeroPedido: "PED-0001",
          fechaSolicitud: "2026-07-21",
          fechaEntregaSolicitada: "2026-07-22",
          estado: "Pendiente",
          proveedorId,
          detalles: [
            {
              nombreInsumo: "Arroz",
              cantidadSolicitada: 20,
              unidadMedida: "kg",
              estado: "Pendiente",
            },
            {
              nombreInsumo: "Aceite",
              cantidadSolicitada: 4,
              unidadMedida: "L",
              estado: "Pendiente",
            },
          ],
        },
        {
          id: 2,
          numeroPedido: "PED-0002",
          fechaSolicitud: "2026-07-20",
          fechaEntregaSolicitada: "2026-07-22",
          estado: "Confirmado",
          proveedorId,
          detalles: [
            {
              nombreInsumo: "Fideos",
              cantidadSolicitada: 15,
              unidadMedida: "kg",
              estado: "Disponible",
            },
          ],
        },
        {
          id: 3,
          numeroPedido: "PED-0003",
          fechaSolicitud: "2026-07-19",
          fechaEntregaSolicitada: "2026-07-21",
          estado: "Rechazado",
          proveedorId,
          detalles: [
            {
              nombreInsumo: "Leche",
              cantidadSolicitada: 10,
              unidadMedida: "L",
              estado: "No Disponible",
            },
          ],
        },
      ];

      const pedidosAsignados = pedidosMock.filter(
        (pedido) => pedido.proveedorId === proveedorId,
      );

      setPedidos(pedidosAsignados);
    } catch (error) {
      console.error("Error al cargar pedidos del proveedor", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetallePedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setMostrarDetalles(true);
  };

  const cerrarDetallePedido = () => {
    setMostrarDetalles(false);
    setPedidoSeleccionado(null);
  };

  const getEstadoClass = (estado) => {
    if (estado === "Confirmado") return PedidoStyle.badgeSuccess;
    if (estado === "Rechazado") return PedidoStyle.badgeDanger;
    return PedidoStyle.badgeWarning;
  };

  const tabs = useMemo(
    () => [
      { label: "Dashboard", path: "/proveedor/dashboard" },
      { label: "Gestión de Productos", path: "/proveedor/gestionproductos" },
      {
        label: "Gestión de Pedidos",
        path: "/proveedor/gestionpedidos",
        active: true,
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className={ContenidoStyle.pageContent}>
        <div className={ContenidoStyle.loadingContainer}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando pedidos del proveedor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-shopping-cart me-2"></i>
            Gestión de Pedidos
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Consulta el estado de tus pedidos asignados y revisa su detalle en
            modo lectura.
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

      <div className={PedidoStyle.tablaContainer}>
        {pedidos.length === 0 ? (
          <div className={PedidoStyle.tablaVacia}>
            No tienes pedidos asignados actualmente.
          </div>
        ) : (
          <div className={PedidoStyle.scrollableTable}>
            <table className={PedidoStyle.tablaData}>
              <thead className={PedidoStyle.tablaHeader}>
                <tr>
                  <th>#</th>
                  <th>Número de Pedido</th>
                  <th>Fecha de Solicitud</th>
                  <th>Fecha de Entrega Solicitada</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido, index) => (
                  <tr key={pedido.id || `${pedido.numeroPedido}-${index}`}>
                    <td>{index + 1}</td>
                    <td className={PedidoStyle.numberPedido}>
                      {pedido.numeroPedido}
                    </td>
                    <td>
                      {new Date(pedido.fechaSolicitud).toLocaleDateString(
                        "es-ES",
                      )}
                    </td>
                    <td>
                      {new Date(
                        pedido.fechaEntregaSolicitada,
                      ).toLocaleDateString("es-ES")}
                    </td>
                    <td>
                      <span className={getEstadoClass(pedido.estado)}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={PedidoStyle.btnDetalles}
                        onClick={() => abrirDetallePedido(pedido)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarDetalles && pedidoSeleccionado && (
        <div className={PedidoStyle.modal}>
          <div className="card shadow-lg" style={{ width: "min(920px, 100%)" }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Detalle del Pedido</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={cerrarDetallePedido}
              >
                <i className="fas fa-times me-1"></i>
                Cerrar
              </button>
            </div>
            <div className="card-body">
              <PedidoListado
                pedido={pedidoSeleccionado}
                onClose={cerrarDetallePedido}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPedidos;
