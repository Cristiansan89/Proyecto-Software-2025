import { useState } from "react";
import Parametros from "./Parametros";
import Alertas from "./Alertas";
import GeneracionAutomatica from "./GeneracionAutomatica";
import ConfiguracionEscuela from "../../components/admin/ConfiguracionEscuela";

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
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-sliders-h me-2"></i>
            Parámetros del Sistema
          </h1>
          <p>Administra los parámetros del sistema</p>
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

export default ParametrosSistema;
