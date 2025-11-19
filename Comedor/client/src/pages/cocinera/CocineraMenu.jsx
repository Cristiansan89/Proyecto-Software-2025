import { useState } from "react";
import PlanificacionSemanal from "../../pages/cocinera/PlanificacionSemanal";
import PlanificacionCalendario from "../../pages/cocinera/PlanificacionCalendario";
import PlanificacionMenuForm from "../../components/cocinera/PlanificacionMenuForm";
import "../../styles/PlanificacionMenus.css";

const PlanificacionMenus = () => {
  const [activeTab, setActiveTab] = useState("planificacion");
  const [modalVisible, setModalVisible] = useState(false);
  const [formularioPlanificacion, setFormularioPlanificacion] = useState({
    fechaInicio: "",
    fechaFin: "",
    comensalesEstimados: "",
    estado: "",
  });

  const abrirModalNuevaPlanificacion = () => {
    setFormularioPlanificacion({
      fechaInicio: "",
      fechaFin: "",
      comensalesEstimados: "",
      estado: "",
    });
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setFormularioPlanificacion({
      fechaInicio: "",
      fechaFin: "",
      comensalesEstimados: "",
      estado: "",
    });
  };

  const manejarCambioFormulario = (e) => {
    const { name, value } = e.target;
    setFormularioPlanificacion((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSuccessForm = () => {
    cerrarModal();
    // Aquí podrías emitir un evento para que los componentes hijo se actualicen
    // o usar un contexto/estado global para manejar la sincronización
  };

  const tabs = [
    {
      id: "planificacion",
      label: "Planificación Semanal",
      icon: "fas fa-calendar-week",
      component: <PlanificacionSemanal />,
    },
    {
      id: "calendario",
      label: "Calendario de Menús",
      icon: "fas fa-calendar-alt",
      component: <PlanificacionCalendario />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-calendar-alt me-2"></i>
            Planificación de Menús
          </h1>
          <p className="page-subtitle">
            Gestiona la planificación de jornadas, servicios y recetas para el
            comedor escolar
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-success"
            onClick={() => abrirModalNuevaPlanificacion()}
          >
            <i className="fas fa-plus me-2"></i>
            Nueva Planificación
          </button>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="navigation-tabs">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>

      <PlanificacionMenuForm
        visible={modalVisible}
        modalTipo="crear"
        planificacionSeleccionada={null}
        formularioPlanificacion={formularioPlanificacion}
        onFormChange={manejarCambioFormulario}
        onClose={cerrarModal}
        onSuccess={onSuccessForm}
      />
    </div>
  );
};

export default PlanificacionMenus;
