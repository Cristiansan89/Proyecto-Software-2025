import { useState, useEffect } from "react";
import CocineraGestionAsistencias from "./CocineraGestionAsistencias";
import ListaAsistencia from "./ListaAsistencia";
import ListaAsistenciasService from "./ListaAsistenciasService";
import "../../styles/GestionAsistencias.css";

const GestionAsistencias = () => {
  const [activeTab, setActiveTab] = useState("gestion-asistencias");
  const [modalVisible, setModalVisible] = useState(false);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const tabs = [
    {
      id: "gestion-asistencias",
      label: "Generar Asistencias",
      icon: "fas fa-check-square",
      component: <CocineraGestionAsistencias />,
    },
    {
      id: "lista-asistencia-individual",
      label: "Asistencia Generadas",
      icon: "fas fa-user-check",
      component: <ListaAsistencia />,
    },
    {
      id: "lista-asistencia-servicio",
      label: "Asistencias Completadas",
      icon: "fas fa-list",
      component: <ListaAsistenciasService />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-check-square me-2"></i>
            Gestión de Asistencias
          </h1>
          <p className="page-subtitle">
            Generar y enviar enlaces de registro de asistencias para los alumnos
            al comedor escolar
          </p>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="navigation-tabs">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <i className={tab.icon}></i> {tab.label}
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

export default GestionAsistencias;
