import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CocineraInventario from "./CocineraInventario";
import CocineraMovimiento from "./CocineraMovimiento";
import "../../styles/ControlInventario.css";

const ControlInventario = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventario");
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
              onClick={() => {
                setModalMovimiento(true);
              }}
            >
              <i className="fas fa-plus"></i>
              Movimiento Inventario
            </button>
          </div>
        </div>
      </div>

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
