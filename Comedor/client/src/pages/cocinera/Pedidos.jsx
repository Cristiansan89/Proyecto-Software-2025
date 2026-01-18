import { useState } from "react";
import PedidoInsumo from "./PedidoInsumo";
import PedidoConfirmado from "./PedidoConfirmado";

const Pedidos = () => {
  const [activeTab, setActiveTab] = useState("pedido-insumo");

  const tabs = [
    {
      id: "pedido-insumo",
      label: "Pedido de Insumos",
      icon: "fas fa-boxes",
      component: <PedidoInsumo />,
    },
    {
      id: "pedido-confirmado",
      label: "Pedidos Confirmados",
      icon: "fas fa-check-circle",
      component: <PedidoConfirmado />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-clipboard-list me-2"></i>
            Gestión de Pedidos
          </h1>
          <p>Administra los pedidos de insumos y confirma recepciones</p>
        </div>
      </div>
      {/* Pestañas de navegación */}
      <div className="navigation-tabs">
        <div className="tabs-header mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${tab.id === activeTab ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i> {tab.label}
            </button>
          ))}
        </div>
        <div className="tabs-content">
          {tabs.map(
            (tab) =>
              tab.id === activeTab && (
                <div key={tab.id} className="tab-content">
                  {tab.component}
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  );
};

export default Pedidos;
