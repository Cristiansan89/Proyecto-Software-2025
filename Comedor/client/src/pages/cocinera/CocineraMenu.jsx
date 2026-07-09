import { useState, useEffect } from "react";
import PlanificacionSemanal from "../../pages/cocinera/PlanificacionSemanal";
import PlanificacionCalendario from "../../pages/cocinera/PlanificacionCalendario";
import InsumosSemanal from "../../pages/cocinera/InsumosSemanal";
import planificacionMenuService from "../../services/planificacionMenuService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

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
        "❌ Ocurrió un error al cargar las planificaciones. Por favor, intente nuevamente más tarde.",
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
            (p) => p.estado === "Activo",
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
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-calendar-alt"></i>
            Planificación de Menús
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Gestiona la planificación de jornadas, servicios y recetas para el
            comedor escolar
          </p>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className={ContenidoStyle.navigationTabs}>
        <div className={ContenidoStyle.tabsHeader}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${ContenidoStyle.tabsButton} ${activeTab === tab.id ? ContenidoStyle.active : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <i className={tab.icon}></i> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de planificaciones (solo en pestaña de calendario) */}
      {activeTab === "calendario" && (
        <div className={ContenidoStyle.pageContent}>
          <div className={ContenidoStyle.pageHeader}>
            <div className="row w-100 align-items-center">
              <div className="col-md-6">
                <p
                  className={`${ContenidoStyle.pageTitle} fs-5 aling-items-center`}
                >
                  <i className="fas fa-folder-open me-2"></i>
                  Seleccionar Calendario
                </p>
              </div>
              <div className="col-md-6 d-flex justify-content-start justify-content-md-end mt-3 mt-md-0">
                {" "}
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
                  <div
                    className={`${ComponenteStyle.alert} ${ComponenteStyle.alertInfo} mb-0`}
                  >
                    <i className="fas fa-info-circle me-2"></i>
                    No hay planificaciones disponibles. Cree una nueva en la
                    pestaña "Planificación Semanal".
                  </div>
                ) : (
                  <select
                    className={`${ComponenteStyle.formSelect} w-50`}
                    value={planificacionSeleccionada?.id_planificacion || ""}
                    onChange={(e) => {
                      const idSeleccionado = e.target.value;
                      const seleccionada = planificaciones.find(
                        (p) =>
                          String(p.id_planificacion) === String(idSeleccionado),
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
                        {new Date(planificacion.fechaInicio).toLocaleDateString(
                          "es-ES",
                        )}{" "}
                        -{" "}
                        {new Date(planificacion.fechaFin).toLocaleDateString(
                          "es-ES",
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
      )}

      <div className={ContenidoStyle.tabContent}>
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default PlanificacionMenus;
