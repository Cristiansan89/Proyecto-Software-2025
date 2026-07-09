import { useState, useEffect } from "react";
import insumoService from "../../services/insumoService";
import proveedorService from "../../services/proveedorService";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import ComponenteStyle from "../../styles/Componentes.module.css";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";

const AsignarInsumosForm = ({ proveedor, onSave, onCancel }) => {
  const [availableInsumos, setAvailableInsumos] = useState([]);
  const [assignedInsumos, setAssignedInsumos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredInsumos, setFilteredInsumos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [calificaciones, setCalificaciones] = useState([
    // Valores por defecto en caso de error al cargar desde el backend
    { value: "Excelente", label: "Excelente", color: "success" },
    { value: "Bueno", label: "Bueno", color: "info" },
    { value: "Regular", label: "Regular", color: "warning" },
    { value: "Malo", label: "Malo", color: "danger" },
  ]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        await Promise.all([
          loadCalificaciones(),
          loadInsumos(),
          loadInsumosAsignados(),
        ]);
      } finally {
        setLoadingData(false);
      }
    };
    cargarDatos();
  }, [proveedor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let filtered = availableInsumos;

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (insumo) =>
          insumo.nombreInsumo
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          insumo.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
          insumo.unidadMedida.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    const assignedIds = assignedInsumos.map((item) => item.idInsumo);
    filtered = filtered.filter(
      (insumo) => !assignedIds.includes(insumo.idInsumo),
    );

    setFilteredInsumos(filtered);
  }, [availableInsumos, searchTerm, assignedInsumos]);

  const loadCalificaciones = async () => {
    try {
      const calificacionesFromServer =
        await proveedorService.getCalificaciones();
      setCalificaciones(calificacionesFromServer);
    } catch (error) {
      // Mantener las calificaciones por defecto ya definidas en el useState
    }
  };

  const loadInsumos = async () => {
    try {
      const insumos = await insumoService.getAll();
      const insumosActivos = insumos.filter(
        (insumo) => insumo.estado === "Activo",
      );
      setAvailableInsumos(insumosActivos);
    } catch (error) {
      showError("Error", "Error al cargar los insumos disponibles");
    }
  };

  const loadInsumosAsignados = async () => {
    if (!proveedor?.idProveedor) return;

    try {
      const insumosAsignados = await proveedorService.getInsumosAsignados(
        proveedor.idProveedor,
      );
      setAssignedInsumos(insumosAsignados);
    } catch (error) {
      if (proveedor?.insumos) {
        setAssignedInsumos(proveedor.insumos);
      }
    }
  };

  const handleAssignInsumo = (insumo) => {
    // Verificar si el insumo ya está asignado
    const yaAsignado = assignedInsumos.some(
      (item) => item.idInsumo === insumo.idInsumo,
    );

    if (yaAsignado) {
      showInfo("Este insumo ya ha sido asignado al proveedor");
      return;
    }

    const newAssigned = {
      idInsumo: insumo.idInsumo,
      nombreInsumo: insumo.nombreInsumo,
      categoria: insumo.categoria,
      unidadMedida: insumo.unidadMedida,
      calificacion: "Bueno",
    };
    setAssignedInsumos((prev) => [...prev, newAssigned]);
  };

  const handleRemoveInsumo = (idInsumo) => {
    setAssignedInsumos((prev) =>
      prev.filter((item) => item.idInsumo !== idInsumo),
    );
  };

  const handleCalificacionChange = (idInsumo, calificacion) => {
    setAssignedInsumos((prev) =>
      prev.map((item) =>
        item.idInsumo === idInsumo ? { ...item, calificacion } : item,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (assignedInsumos.length === 0) {
      showInfo("Información", "Por favor, asigna al menos un insumo");
      return;
    }

    setLoading(true);

    try {
      const insumosToSave = assignedInsumos.map((item) => ({
        idInsumo: item.idInsumo,
        calificacion: item.calificacion,
      }));

      await onSave(insumosToSave);
    } catch (error) {
      showError(
        "Error",
        "Error al asignar los insumos. Por favor, inténtelo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Mostrar indicador de carga mientras se cargan los datos
  if (loadingData) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: "2rem", color: "#667eea" }}
        ></i>
        <p style={{ marginTop: "1rem", color: "#666" }}>Cargando insumos...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={ComponenteStyle.formSections}>
        <div className={`${ComponenteStyle.formRow} mt-4`}>
          <div className={ContenidoStyle.headerLeft}>
            <div className={ContenidoStyle.searchFilters}>
              <div className={ContenidoStyle.searchBar}>
                <h6 className={ComponenteStyle.sectionTitle}>
                  <i className="fas fa-search me-2"></i>
                  Buscar Insumos Disponibles
                </h6>
                <div className={ComponenteStyle.formGroup}>
                  <input
                    type="text"
                    className={ComponenteStyle.formControl}
                    placeholder="Buscar por nombre, categoría o unidad de medida..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`${ComponenteStyle.formRow} mt-4`}>
          <h6 className={ComponenteStyle.sectionTitle}>
            <i className="fas fa-boxes"></i>
            Insumos Disponibles ({filteredInsumos.length})
          </h6>
          <div
            className={`${ComponenteStyle.insumoList} ${ComponenteStyle.availableList}`}
          >
            {" "}
            {filteredInsumos.length === 0 ? (
              <div className="no-data">
                <p className="text-muted">
                  No hay insumos disponibles para asignar
                </p>
              </div>
            ) : (
              filteredInsumos.map((insumo) => (
                <div
                  key={insumo.idInsumo}
                  className={`${ComponenteStyle.insumoItem} ${ComponenteStyle.availableItem}`}
                >
                  <div className={ComponenteStyle.insumoInfo}>
                    <div className={ComponenteStyle.insumoName}>
                      <i className="fas fa-box me-2"></i>
                      <strong>{insumo.nombreInsumo}</strong>
                    </div>
                    <div className={ComponenteStyle.insumoDetails}>
                      <span className={ComponenteStyle.categoriaBadge}>
                        {insumo.categoria}
                      </span>
                      <span className={ComponenteStyle.unidadMedida}>
                        {insumo.unidadMedida}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => handleAssignInsumo(insumo)}
                  >
                    <i className="fas fa-plus"></i>
                    Asignar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${ComponenteStyle.formRow} mt-4`}>
          <h6 className={ComponenteStyle.sectionTitle}>
            <i className="fas fa-check-circle me-2"></i>
            Insumos Asignados ({assignedInsumos.length})
          </h6>
          <div
            className={`${ComponenteStyle.insumoList} ${ComponenteStyle.assignedList}`}
          >
            {assignedInsumos.length === 0 ? (
              <div className="no-data">
                <p className="text-muted">
                  No hay insumos asignados a este proveedor
                </p>
              </div>
            ) : (
              assignedInsumos.map((insumo, index) => (
                <div
                  key={`${insumo.idInsumo}-${index}`}
                  className={`${ComponenteStyle.insumoItem} ${ComponenteStyle.assignedItem}`}
                >
                  <div className={ComponenteStyle.insumoInfo}>
                    <div className={ComponenteStyle.insumoName}>
                      <i className="fas fa-box me-2"></i>
                      <strong>{insumo.nombreInsumo}</strong>
                    </div>
                    <div className={ComponenteStyle.insumoDetails}>
                      <span className={ComponenteStyle.categoriaBadge}>
                        {insumo.categoria}
                      </span>
                      <span className={ComponenteStyle.unidadMedida}>
                        {insumo.unidadMedida}
                      </span>
                    </div>
                  </div>
                  <div className={ComponenteStyle.formActionsInsumos}>
                    <button
                      type="button"
                      className={`${ComponenteStyle.btn} ${ComponenteStyle.btnDanger}`}
                      onClick={() => handleRemoveInsumo(insumo.idInsumo)}
                      title="Remover insumo"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={ComponenteStyle.formActions}>
        <button
          type="button"
          className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel}`}
          onClick={onCancel}
          disabled={loading}
        >
          <i className="fas fa-times"></i>
          Cancelar
        </button>
        <button
          type="submit"
          className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Guardando...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              Guardar Asignación ({assignedInsumos.length} insumos)
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AsignarInsumosForm;
