import { useState } from "react";
import ListaAlumnosGrados from "./ListaAlumnoGrado";
import ListaDocentesGrados from "./ListaDocenteGrado";
import ListaReemplazosGrados from "./ListaReemplazoDocente";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";

const PersonaGrado = () => {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState("alumnos");

  const tabs = [
    {
      id: "alumnos",
      label: "Alumnos",
      icon: "fas fa-user-graduate",
      component: <ListaAlumnosGrados />,
    },
    {
      id: "docentes",
      label: "Docentes",
      icon: "fas fa-chalkboard-teacher",
      component: <ListaDocentesGrados />,
    },
    {
      id: "reemplazos",
      label: "Reemplazos",
      icon: "fas fa-user-clock",
      component: <ListaReemplazosGrados />,
    },
  ];

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-user-clock"> </i>
            Asignación de Personas a Grados
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Administra la asignación de personas a grados
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

export default PersonaGrado;
