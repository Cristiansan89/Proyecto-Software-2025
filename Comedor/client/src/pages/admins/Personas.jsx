import { useState } from "react";
import ListaPersonas from "./ListaPersonas";
import ListaUsuarios from "./ListaUsuarios";

const Persona = () => {
  const [activeTab, setActiveTab] = useState("personas");

  const tabs = [
    {
      id: "personas",
      label: "Personas",
      icon: "fas fa-user-friends",
      component: <ListaPersonas />,
    },
    {
      id: "usuarios",
      label: "Usuarios",
      icon: "fas fa-user-cog",
      component: <ListaUsuarios />,
    },
  ];

  return (
    <div className="contente-area-persona">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-user-friends me-2"> </i>
            Gestión de Personas y Usuarios
          </h1>
          <p>Administra las personas y usuarios del sistema</p>
        </div>
      </div>

      {/* Navegación por pestaña de personas y usuarios */}
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

export default Persona;
