import { useState, useEffect } from "react";
import CocineraGestionAsistencias from "./CocineraGestionAsistencias";
import ListaAsistencia from "./ListaAsistencia";
import ListaAsistenciasService from "./ListaAsistenciasService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";

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
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-check-square"></i>
            Gestión de Asistencias
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Generar y enviar enlaces de registro de asistencias para los alumnos
            al comedor escolar
          </p>
        </div>
      </div>

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
              <i className={tab.icon}></i> {tab.label}
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

export default GestionAsistencias;
