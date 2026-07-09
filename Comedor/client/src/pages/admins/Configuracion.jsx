import { useState } from "react";
import ListaTurnos from "./ListaTurnos";
import ListaServicios from "./ListaServicios";
import ListaTipoMerma from "./ListaTipoMerma";
import ListaEstadoPedido from "./ListaEstadoPedido";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";

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
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-cog"></i>
            Configuración del Sistema
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Administra la configuración básica del comedor
          </p>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className={ContenidoStyle.navigationTabs}>
        <div className={ContenidoStyle.tabsHeader}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${ContenidoStyle.tabsButton} ${
                activeTab === tab.id ? ContenidoStyle.active : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className={ContenidoStyle.tabContent}>
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default Configuracion;
