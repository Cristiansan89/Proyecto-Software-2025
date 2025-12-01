import React, { useState, useEffect, useCallback } from "react";
import { rolService } from "../../services/rolService";
import { permisoService } from "../../services/permisoService";
import { rolPermisoService } from "../../services/rolPermisoService";

const AsignarPermisosForm = ({ onClose, rolSeleccionado = null }) => {
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [selectedRol, setSelectedRol] = useState(rolSeleccionado || "");
  const [selectedPermisos, setSelectedPermisos] = useState([]);
  const [permisosActuales, setPermisosActuales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filtroModulo, setFiltroModulo] = useState("");

  // Obtener módulos únicos de los permisos
  const modulosDisponibles = [...new Set(permisos.map((p) => p.modulo))].sort();

  // El filtrado por módulo se aplica directamente al renderizado de módulos usando `filtroModulo`

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarPermisosDelRol = useCallback(async () => {
    if (!selectedRol) return;

    try {
      const permisosDelRol = await rolPermisoService.getPermisosByRol(
        selectedRol
      );
      setPermisosActuales(permisosDelRol);
      setSelectedPermisos(
        permisosDelRol.map((p) => p.idPermiso || p.id_permiso)
      );
    } catch (error) {
      setError("Error al cargar permisos del rol: " + error.message);
    }
  }, [selectedRol]);

  useEffect(() => {
    if (rolSeleccionado) {
      setSelectedRol(rolSeleccionado);
    }
  }, [rolSeleccionado]);

  useEffect(() => {
    if (selectedRol) {
      cargarPermisosDelRol();
    } else {
      setPermisosActuales([]);
      setSelectedPermisos([]);
    }
  }, [selectedRol, cargarPermisosDelRol]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [rolesData, permisosData] = await Promise.all([
        rolService.getAll(),
        permisoService.getAll(),
      ]);

      setRoles(rolesData);
      setPermisos(permisosData);
    } catch (error) {
      setError("Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (idPermiso, isChecked) => {
    if (isChecked) {
      setSelectedPermisos((prev) => [...prev, idPermiso]);
    } else {
      setSelectedPermisos((prev) => prev.filter((id) => id !== idPermiso));
    }
  };

  const handleSelectAllModule = (modulo, isChecked) => {
    const permisosDelModulo = permisos
      .filter((p) => p.modulo === modulo)
      .map((p) => p.idPermiso || p.id_permiso);

    if (isChecked) {
      setSelectedPermisos((prev) => {
        const newSelected = [...prev];
        permisosDelModulo.forEach((id) => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    } else {
      setSelectedPermisos((prev) =>
        prev.filter((id) => !permisosDelModulo.includes(id))
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRol) {
      setError("Debe seleccionar un rol");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // En lugar de borrar todo y re-asignar (riesgo de eliminar si algo falla),
      // calcular diferencias: permisos a agregar y permisos a eliminar.
      const actualesIds = permisosActuales.map(
        (p) => p.idPermiso || p.id_permiso
      );

      const toAdd = selectedPermisos.filter((id) => !actualesIds.includes(id));
      const toRemove = actualesIds.filter(
        (id) => !selectedPermisos.includes(id)
      );

      // Añadir nuevos permisos (si hay)
      if (toAdd.length > 0) {
        // rolPermisoService.asignarPermisos acepta un array según uso previo
        await rolPermisoService.asignarPermisos(selectedRol, toAdd);
      }

      // Eliminar permisos que fueron deseleccionados
      if (toRemove.length > 0) {
        // Usar removerPermiso por elemento (la API ya existe en el proyecto)
        await Promise.all(
          toRemove.map((id) =>
            rolPermisoService.removerPermiso(selectedRol, id)
          )
        );
      }

      setSuccess(
        `Permisos actualizados exitosamente. Añadidos: ${toAdd.length}, Eliminados: ${toRemove.length}.`
      );

      // Recargar permisos del rol
      await cargarPermisosDelRol();
    } catch (error) {
      setError("Error al asignar permisos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRolNombre = () => {
    const rol = roles.find((r) => r.idRol == selectedRol);
    return rol ? rol.nombreRol : "";
  };

  const isPermisoSelected = (idPermiso) => {
    return selectedPermisos.includes(idPermiso);
  };

  const getModuleSelectedCount = (modulo) => {
    const permisosDelModulo = permisos.filter((p) => p.modulo === modulo);
    const selectedCount = permisosDelModulo.filter((p) =>
      selectedPermisos.includes(p.idPermiso || p.id_permiso)
    ).length;
    return `${selectedCount}/${permisosDelModulo.length}`;
  };

  if (loading && roles.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div
      className="asignar-permisos-form"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          <div>
            <strong>Éxito:</strong> {success}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="form"
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <div className="form-grid" style={{ flexShrink: 0 }}>
          {/* Selector de Rol */}
          <div className="form-group">
            <label htmlFor="rol" className="form-label">
              Seleccionar Rol *
            </label>
            <select
              id="rol"
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Seleccionar rol...</option>
              {roles.map((rol) => (
                <option key={rol.idRol} value={rol.idRol}>
                  {rol.nombreRol}
                </option>
              ))}
            </select>
            <small className="form-help">
              Seleccione el rol al cual desea asignar permisos
            </small>
          </div>

          {/* Filtro por módulo */}
          {selectedRol && (
            <div className="form-group">
              <label htmlFor="filtroModulo" className="form-label">
                Filtrar por Módulo
              </label>
              <select
                id="filtroModulo"
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                className="form-select"
              >
                <option value="">Todos los módulos</option>
                {modulosDisponibles.map((modulo) => (
                  <option key={modulo} value={modulo}>
                    {modulo} ({getModuleSelectedCount(modulo)})
                  </option>
                ))}
              </select>
              <small className="form-help">
                Filtre los permisos por módulo del sistema para una mejor
                organización
              </small>
            </div>
          )}
        </div>

        {/* Información del rol seleccionado */}
        {selectedRol && (
          <div
            className="rol-info"
            style={{ flexShrink: 0, marginBottom: "1rem" }}
          >
            <h3>Asignando permisos para: {getRolNombre()}</h3>
            <div className="text-muted">
              <strong>Permisos actuales:</strong> {permisosActuales.length} |
              <strong> Permisos seleccionados:</strong>{" "}
              {selectedPermisos.length} |<strong> Total disponibles:</strong>{" "}
              {permisos.length}
            </div>
          </div>
        )}

        {/* Lista de permisos con scroll interno */}
        {selectedRol && (
          <div
            className="permisos-section"
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: "1rem",
              border: "1px solid #dee2e6",
              borderRadius: "0.375rem",
              padding: "1rem",
            }}
          >
            <h4 style={{ marginTop: 0 }}>Seleccionar Permisos</h4>

            {modulosDisponibles.map((modulo) => {
              const permisosDelModulo = permisos.filter(
                (p) => p.modulo === modulo
              );

              if (filtroModulo && filtroModulo !== modulo) {
                return null;
              }

              const allSelected = permisosDelModulo.every((p) =>
                selectedPermisos.includes(p.idPermiso || p.id_permiso)
              );
              const someSelected = permisosDelModulo.some((p) =>
                selectedPermisos.includes(p.idPermiso || p.id_permiso)
              );

              return (
                <div key={modulo} className="modulo-section">
                  <div className="modulo-header">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input)
                            input.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={(e) =>
                          handleSelectAllModule(modulo, e.target.checked)
                        }
                      />
                      <strong>{modulo}</strong>
                      <span className="badge">
                        {getModuleSelectedCount(modulo)}
                      </span>
                    </label>
                  </div>

                  <div className="permisos-grid">
                    {permisosDelModulo.map((permiso) => {
                      const idPermiso = permiso.idPermiso || permiso.id_permiso;
                      return (
                        <label
                          key={idPermiso}
                          className="checkbox-label permiso-item"
                        >
                          <input
                            type="checkbox"
                            checked={isPermisoSelected(idPermiso)}
                            onChange={(e) =>
                              handlePermisoChange(idPermiso, e.target.checked)
                            }
                          />
                          <div className="permiso-info">
                            <span className="permiso-nombre">
                              {permiso.nombrePermiso || permiso.descripcion}
                            </span>
                            {permiso.accion && permiso.accion !== "---" && (
                              <span className="permiso-accion">
                                ({permiso.accion})
                              </span>
                            )}
                            {permiso.descripcionPermiso && (
                              <small className="permiso-descripcion">
                                {permiso.descripcionPermiso}
                              </small>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botones de acción fijos */}
        <div
          className="form-actions"
          style={{
            flexShrink: 0,
            borderTop: "1px solid #dee2e6",
            paddingTop: "1rem",
            marginTop: "auto",
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary">
            <i className="fas fa-times mr-1"></i>
            Cancelar
          </button>

          {selectedRol && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-1"></i>
                  Guardar
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AsignarPermisosForm;
