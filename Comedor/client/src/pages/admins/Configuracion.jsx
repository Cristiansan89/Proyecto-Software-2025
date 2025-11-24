import { useState } from "react";
import ListaTurnos from "./ListaTurnos";
import ListaServicios from "./ListaServicios";
import ListaTipoMerma from "./ListaTipoMerma";
import ListaEstadoPedido from "./ListaEstadoPedido";

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState("turnos");

  const tabs = [
    {
      id: "turnos",
      label: "Turnos",
      icon: "fas fa-clock",
      component: <ListaTurnos />,
    },
    {
      id: "servicios",
      label: "Servicios",
      icon: "fas fa-utensils",
      component: <ListaServicios />,
    },
    {
      id: "tipo-merma",
      label: "Tipos de Mermas",
      icon: "fas fa-tags",
      component: <ListaTipoMerma />,
    },
    {
      id: "estado-pedido",
      label: "Estados de Pedidos",
      icon: "fas fa-clipboard-check",
      component: <ListaEstadoPedido />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-cog me-2"></i>
            Configuración del Sistema
          </h1>
          <p>Administra la configuración básica del comedor</p>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="navigation-tabs">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default Configuracion;
