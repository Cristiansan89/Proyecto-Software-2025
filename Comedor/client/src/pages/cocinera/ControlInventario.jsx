import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { showError } from "../../utils/alertService";
import CocineraInventario from "./CocineraInventario";
import CocineraMovimiento from "./CocineraMovimiento";
import MovimientosForm from "../../components/cocinera/MovimientosForm";
import RecepcionInsumo from "../../components/cocinera/RecepcionInsumo";
import API from "../../services/api";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";

const ControlInventario = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventario");
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalRecepcion, setModalRecepcion] = useState(false);
  const [inventarios, setInventarios] = useState([]);
  const [tiposMerma, setTiposMerma] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const tabs = [
    {
      id: "inventario",
      label: "Inventario",
      icon: "fas fa-warehouse",
      component: <CocineraInventario />,
    },
    {
      id: "movimientos",
      label: "Movimientos",
      icon: "fas fa-history",
      component: <CocineraMovimiento />,
    },
  ];

  const handleTabChange = (id) => setActiveTab(id);

  // Cargar inventarios y tipos de merma
  useEffect(() => {
    cargarDatos();
    cargarAlertas();
    // Recargar alertas cada 30 segundos
    const interval = setInterval(cargarAlertas, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      const [inventariosRes, mermaRes] = await Promise.all([
        API.get("/inventarios"),
        API.get("/tipos-merma"),
      ]);
      setInventarios(inventariosRes.data || []);
      setTiposMerma(mermaRes.data || []);
    } catch (error) {
      //console.error("Error al cargar datos:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar los datos de inventario. Por favor, intente nuevamente más tarde.",
      );
    }
  };

  const cargarAlertas = async () => {
    try {
      const response = await API.get("/alertas-inventario/no-vistas/listar");
      // Ya vienen solo alertas no vistas del servidor
      setAlertas(response.data || []);
    } catch (error) {
      //console.error("Error al cargar alertas:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar las alertas de inventario. Por favor, intente nuevamente más tarde.",
      );
    }
  };

  const marcarAlertaComoVista = async (id_alerta) => {
    try {
      await API.put(`/alertas-inventario/${id_alerta}/visto`);
      setAlertas(alertas.filter((alerta) => alerta.id_alerta !== id_alerta));
    } catch (error) {
      //console.error("Error al marcar alerta como vista:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al marcar la alerta como vista. Por favor, intente nuevamente más tarde.",
      );
    }
  };

  const manejarMovimientoRegistrado = async () => {
    // Recargar datos cuando se registra un movimiento
    cargarDatos();
  };

  // Verificación de autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando el Control de Inventario...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-warehouse"></i>
            Control y Movimientos de Inventario
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Gestión completa de inventario y movimientos
          </p>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <div className="d-flex gap-2">
            <button
              className={`${ContenidoStyle.btn} btn-success`}
              onClick={() => setModalMovimiento(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Registrar Movimiento
            </button>
            <button
              className={`${ContenidoStyle.btn} btn-primary`}
              onClick={() => setModalRecepcion(true)}
            >
              <i className="fas fa-truck-loading me-2"></i>
              Registrar Recepción
            </button>
          </div>
        </div>
      </div>

      {/* Alertas de Inventario */}
      {alertas.length > 0 && (
        <div className="alertas-container mb-4">
          {alertas.map((alerta) => (
            <div
              key={alerta.id_alerta}
              className={`${ComponenteStyle.alert} ${alertWarning} alert-dismissible fade show`}
              role="alert"
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <strong>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {alerta.nombreInsumo}
                  </strong>
                  <p className="mb-0 mt-2">
                    Stock actual:{" "}
                    <strong>
                      {parseFloat(alerta.cantidadActual || 0).toFixed(3)}
                    </strong>{" "}
                    {alerta.unidadMedida}
                    <br />
                    Nivel mínimo:{" "}
                    <strong>
                      {parseFloat(alerta.stockMinimo || 0).toFixed(3)}
                    </strong>{" "}
                    {alerta.unidadMedida}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning"
                  onClick={() => marcarAlertaComoVista(alerta.id_alerta)}
                  title="Marcar como visto"
                >
                  <i className="fas fa-check me-1"></i>
                  Visto
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Movimiento */}
      {modalMovimiento &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-plus-circle me-2"></i>
                    Registrar Movimiento de Inventario
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={() => setModalMovimiento(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <MovimientosForm
                    isOpen={modalMovimiento}
                    onClose={() => setModalMovimiento(false)}
                    inventarios={inventarios}
                    tiposMerma={tiposMerma}
                    onMovimientoRegistrado={manejarMovimientoRegistrado}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Recepción de Insumos */}
      {modalRecepcion &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-truck-loading me-2"></i>
                    Registrar Recepción de Pedido
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={() => setModalRecepcion(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <RecepcionInsumo
                    isOpen={modalRecepcion}
                    onClose={() => setModalRecepcion(false)}
                    onRecepcionRegistrada={manejarMovimientoRegistrado}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {modalMovimiento &&
        modalRecepcion &&
        createPortal(
          <div
            className={`${FormularioStyle.modalBackdrop}`}
            style={{ zIndex: 1040, pointerEvents: "all" }}
          ></div>,
          document.body,
        )}

      {/* Pestañas de navegación */}
      <div className={ContenidoStyle.navigationTabs}>
        <div className={ContenidoStyle.tabsHeader}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${ContenidoStyle.tabsButton} ${
                activeTab === tab.id ? ContenidoStyle.active : ""
              }`}
              onClick={() => handleTabChange(tab.id)}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={ContenidoStyle.tabContent}>
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default ControlInventario;
