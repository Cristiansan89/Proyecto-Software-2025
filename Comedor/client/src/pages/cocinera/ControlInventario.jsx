import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CocineraInventario from "./CocineraInventario";
import CocineraMovimiento from "./CocineraMovimiento";
import MovimientosForm from "../../components/cocinera/MovimientosForm";
import API from "../../services/api";
import "../../styles/ControlInventario.css";

const ControlInventario = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventario");
  const [modalMovimiento, setModalMovimiento] = useState(false);
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
      console.error("Error al cargar datos:", error);
    }
  };

  const cargarAlertas = async () => {
    try {
      const response = await API.get("/alertas-inventario/no-vistas/listar");
      // Ya vienen solo alertas no vistas del servidor
      setAlertas(response.data || []);
    } catch (error) {
      console.error("Error al cargar alertas:", error);
    }
  };

  const marcarAlertaComoVista = async (id_alerta) => {
    try {
      await API.put(`/alertas-inventario/${id_alerta}/visto`);
      setAlertas(alertas.filter((alerta) => alerta.id_alerta !== id_alerta));
    } catch (error) {
      console.error("Error al marcar alerta como vista:", error);
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

  // Si no está autenticado, no renderizar
  if (!isAuthenticated) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="control-inventario">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-warehouse me-2"></i>
            Control de Inventario
          </h1>
          <p>Gestión completa de inventario y movimientos</p>
        </div>
        <div className="header-actions">
          <div className="btn-group">
            <button
              className="btn btn-success w-100"
              onClick={() => setModalMovimiento(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Movimiento Inventario
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
              className="alert alert-warning alert-dismissible fade show"
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
                      {Math.round(parseFloat(alerta.cantidadActual || 0))}
                    </strong>{" "}
                    {alerta.unidadMedida}
                    <br />
                    Nivel mínimo: <strong>{alerta.stockMinimo}</strong>{" "}
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
          <div className="modal-overlay">
            <div className="modal-content movimiento-modal">
              <div className="modal-header">
                <h3 className="modal-title">
                  <i className="fas fa-plus-circle me-2"></i>
                  Registrar Movimiento de Inventario
                </h3>
                <button
                  className="modal-close text-white"
                  onClick={() => setModalMovimiento(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <MovimientosForm
                  isOpen={modalMovimiento}
                  onClose={() => setModalMovimiento(false)}
                  inventarios={inventarios}
                  tiposMerma={tiposMerma}
                  onMovimientoRegistrado={manejarMovimientoRegistrado}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Pestañas de navegación */}
      <div className="navigation-tabs mb-4">
        <div className="tabs-header d-flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${
                activeTab === tab.id ? "active" : ""
              } btn`}
              onClick={() => handleTabChange(tab.id)}
            >
              <i className={`${tab.icon} me-1`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default ControlInventario;
