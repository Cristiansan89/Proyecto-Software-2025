import { useState, useEffect } from "react";
import PlanificacionSemanal from "../../pages/cocinera/PlanificacionSemanal";
import PlanificacionCalendario from "../../pages/cocinera/PlanificacionCalendario";
import InsumosSemanal from "../../pages/cocinera/InsumosSemanal";
import planificacionMenuService from "../../services/planificacionMenuService";
import "../../styles/PlanificacionMenus.css";

const PlanificacionMenus = () => {
  const [activeTab, setActiveTab] = useState("planificacion");
  const [planificacionSeleccionada, setPlanificacionSeleccionada] =
    useState(null);
  const [planificaciones, setPlanificaciones] = useState([]);
  const [cargandoPlanificaciones, setCargandoPlanificaciones] = useState(false);

  // Cargar planificaciones al montar
  useEffect(() => {
    cargarPlanificaciones();
  }, []);

  const cargarPlanificaciones = async () => {
    setCargandoPlanificaciones(true);
    try {
      const response = await planificacionMenuService.getAll();
      if (Array.isArray(response)) {
        // Las planificaciones ya vienen ordenadas por fechaInicio ASC del backend
        setPlanificaciones(response);
        // Si no hay planificación seleccionada y hay disponibles, seleccionar la primera (más antigua)
        if (!planificacionSeleccionada && response.length > 0) {
          setPlanificacionSeleccionada(response[0]);
        }
      }
    } catch (error) {
      //console.error("Error al cargar planificaciones:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar las planificaciones. Por favor, intente nuevamente más tarde."
      );
    } finally {
      setCargandoPlanificaciones(false);
    }
  };

  // Auto-seleccionar planificación cuando se cambia a la pestaña de calendario
  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    if (tabId === "calendario") {
      // Recargar planificaciones para obtener las más recientes
      setCargandoPlanificaciones(true);
      try {
        const response = await planificacionMenuService.getAll();
        if (Array.isArray(response)) {
          setPlanificaciones(response);
          
          // Ordenar planificaciones por fecha de inicio (de menor a mayor)
          const planificacionesOrdenadas = response.sort((a, b) => {
            const fechaA = new Date(a.fechaInicio);
            const fechaB = new Date(b.fechaInicio);
            return fechaA - fechaB;
          });

          // Buscar una planificación activa o la primera disponible
          const planificacionActiva = planificacionesOrdenadas.find(
            (p) => p.estado === "Activo"
          );
          const planificacionASeleccionar =
            planificacionActiva || planificacionesOrdenadas[0];

          if (planificacionASeleccionar) {
            setPlanificacionSeleccionada(planificacionASeleccionar);
          }
        }
      } catch (error) {
        //console.error("Error al recargar planificaciones:", error);
      } finally {
        setCargandoPlanificaciones(false);
      }
    }
  };

  const handleSeleccionarPlanificacion = (planificacion) => {
    setPlanificacionSeleccionada(planificacion);
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
      component: (
        <PlanificacionCalendario
          planificacionSeleccionada={planificacionSeleccionada}
        />
      ),
    },
    {
      id: "insumos",
      label: "Insumos Semanales",
      icon: "fas fa-boxes",
      component: <InsumosSemanal />,
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

      {/* Selector de planificaciones (solo en pestaña de calendario) */}
      {activeTab === "calendario" && (
        <div className="planificacion-selector mb-4">
          <div className="card">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <label className="form-label fw-bold mb-0">
                    <h2 className="page-title-sub">
                      <i className="fas fa-folder-open me-2"></i> 
                      Seleccionar Calendario
                    </h2>
                  </label>
                </div>
                <div className="col-md-6">
                  {cargandoPlanificaciones ? (
                    <div className="text-center">
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Cargando...
                    </div>
                  ) : planificaciones.length === 0 ? (
                    <div className="alert alert-info mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      No hay planificaciones disponibles. Cree una nueva en la
                      pestaña "Planificación Semanal".
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={planificacionSeleccionada?.id_planificacion || ""}
                      onChange={(e) => {
                        const idSeleccionado = e.target.value;
                        const seleccionada = planificaciones.find(
                          (p) =>
                            String(p.id_planificacion) ===
                            String(idSeleccionado)
                        );
                        if (seleccionada) {
                          handleSeleccionarPlanificacion(seleccionada);
                        }
                      }}
                    >
                      <option value="">-- Seleccionar planificación --</option>
                      {planificaciones.map((planificacion) => (
                        <option
                          key={planificacion.id_planificacion}
                          value={String(planificacion.id_planificacion)}
                        >
                          {new Date(
                            planificacion.fechaInicio
                          ).toLocaleDateString("es-ES")}{" "}
                          -{" "}
                          {new Date(planificacion.fechaFin).toLocaleDateString(
                            "es-ES"
                          )}{" "}
                          ({planificacion.estado})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default PlanificacionMenus;
