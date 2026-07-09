import { useState } from "react";
import Parametros from "./Parametros";
import Alertas from "./Alertas";
import GeneracionAutomatica from "./GeneracionAutomatica";
import ConfiguracionEscuela from "./ConfiguracionEscuela";
import ConfiguracionServicio from "./ConfiguracionServicio";
import ConfiguracionTelegram from "./ConfiguracionTelegram";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";

const ParametrosSistema = () => {
  const [activeTab, setActiveTab] = useState("parametros");

  const tabs = [
    {
      id: "parametros",
      label: "Parametros del Sistema",
      icon: "fas fa-sliders-h",
      component: <Parametros />,
    },
    {
      id: "escuela",
      label: "Datos de la Escuela",
      icon: "fas fa-school",
      component: <ConfiguracionEscuela />,
    },
    {
      id: "servicio",
      label: "Configuración de Servicios",
      icon: "fas fa-clock",
      component: <ConfiguracionServicio />,
    },
    {
      id: "alertas",
      label: "Alertas",
      icon: "fas fa-bell",
      component: <Alertas />,
    },
    {
      id: "generacion",
      label: "Generación Automática",
      icon: "fas fa-robot",
      component: <GeneracionAutomatica />,
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: "fas fa-paper-plane",
      component: <ConfiguracionTelegram />,
    },
  ];

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-sliders-h"></i>
            Parámetros del Sistema
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Administra los parámetros del sistema
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

export default ParametrosSistema;
