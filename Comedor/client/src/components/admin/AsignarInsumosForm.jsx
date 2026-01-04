import { useState, useEffect } from "react";
import insumoService from "../../services/insumoService";
import proveedorService from "../../services/proveedorService";
import "../../styles/index.css";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const AsignarInsumosForm = ({ proveedor, onSave, onCancel }) => {
  const [availableInsumos, setAvailableInsumos] = useState([]);
  const [assignedInsumos, setAssignedInsumos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredInsumos, setFilteredInsumos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calificaciones, setCalificaciones] = useState([
    // Valores por defecto en caso de error al cargar desde el backend
    { value: "Excelente", label: "Excelente", color: "success" },
    { value: "Bueno", label: "Bueno", color: "info" },
    { value: "Regular", label: "Regular", color: "warning" },
    { value: "Malo", label: "Malo", color: "danger" },
  ]);

  useEffect(() => {
    loadCalificaciones();
    loadInsumos();
    loadInsumosAsignados();
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
          insumo.unidadMedida.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const assignedIds = assignedInsumos.map((item) => item.idInsumo);
    filtered = filtered.filter(
      (insumo) => !assignedIds.includes(insumo.idInsumo)
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
        (insumo) => insumo.estado === "Activo"
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
        proveedor.idProveedor
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
      (item) => item.idInsumo === insumo.idInsumo
    );

    if (yaAsignado) {
      showToast("Este insumo ya ha sido asignado al proveedor", "info", 2000);
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
      prev.filter((item) => item.idInsumo !== idInsumo)
    );
  };

  const handleCalificacionChange = (idInsumo, calificacion) => {
    setAssignedInsumos((prev) =>
      prev.map((item) =>
        item.idInsumo === idInsumo ? { ...item, calificacion } : item
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (assignedInsumos.length === 0) {
      showToast("Debe asignar al menos un insumo", "info", 2000);
      return;
    }

    setLoading(true);

    try {
      const insumosToSave = assignedInsumos.map((item) => ({
        idInsumo: item.idInsumo,
        calificacion: item.calificacion,
      }));

      onSave(insumosToSave);
    } catch (error) {
      showError(
        "Error",
        "Error al asignar los insumos. Por favor, inténtelo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asignar-insumos-form">
      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          <div className="proveedor-info">
            <div className="info-card">
              <h6 className="info-title">Información del Proveedor</h6>
              <div className="info-grid">
                <div>
                  <i className="fas fa-building me-2"></i>
                  <span className="info-label">Razón Social: </span>
                  <span className="info-value">
                    {proveedor?.razonSocial || "No especificado"}
                  </span>
                </div>
                <div>
                  <i className="fas fa-id-card me-2"></i>
                  <span className="info-label">CUIT: </span>
                  <span className="info-value">
                    {proveedor?.CUIT || "No especificado"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="search-section mb-4">
            <h6 className="section-title">
              <i className="fas fa-search me-2"></i>
              Buscar Insumos Disponibles
            </h6>
            <div className="search-bar">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, categoría o unidad de medida..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="available-insumos">
            <h6 className="section-title">
              <i className="fas fa-boxes"></i>
              Insumos Disponibles ({filteredInsumos.length})
            </h6>
            <div className="insumos-list available-list">
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
                    className="insumo-item available-item"
                  >
                    <div className="insumo-info">
                      <div className="insumo-name">
                        <i className="fas fa-box me-2"></i>
                        <strong>{insumo.nombreInsumo}</strong>
                      </div>
                      <div className="insumo-details">
                        <span className="categoria-badge">
                          {insumo.categoria}
                        </span>
                        <span className="unidad-medida">
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

          <div className="assigned-insumos">
            <h6 className="section-title">
              <i className="fas fa-check-circle me-2"></i>
              Insumos Asignados ({assignedInsumos.length})
            </h6>
            <div className="insumos-list assigned-list">
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
                    className="insumo-item assigned-item"
                  >
                    <div className="insumo-info">
                      <div className="insumo-name">
                        <i className="fas fa-box me-2"></i>
                        <strong>{insumo.nombreInsumo}</strong>
                      </div>
                      <div className="insumo-details">
                        <span className="categoria-badge">
                          {insumo.categoria}
                        </span>
                        <span className="unidad-medida">
                          {insumo.unidadMedida}
                        </span>
                      </div>
                    </div>
                    <div className="insumo-actions">
                      <select
                        className="form-select form-select-sm me-2"
                        value={insumo.calificacion}
                        onChange={(e) =>
                          handleCalificacionChange(
                            insumo.idInsumo,
                            e.target.value
                          )
                        }
                        style={{ width: "120px" }}
                      >
                        {calificaciones.map((cal) => (
                          <option key={cal.value} value={cal.value}>
                            {cal.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
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

        <div className="form-actions mt-4">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={onCancel}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || assignedInsumos.length === 0}
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
    </div>
  );
};

export default AsignarInsumosForm;
