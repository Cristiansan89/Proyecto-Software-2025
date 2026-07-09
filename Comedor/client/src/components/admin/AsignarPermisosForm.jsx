import React, { useState, useEffect, useCallback } from "react";
import { rolService } from "../../services/rolService";
import { permisoService } from "../../services/permisoService";
import { rolPermisoService } from "../../services/rolPermisoService";
import { showSuccess, showError } from "../../utils/alertService";
import ComponenteStyle from "../../styles/Componentes.module.css";

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
      const permisosDelRol =
        await rolPermisoService.getPermisosByRol(selectedRol);
      setPermisosActuales(permisosDelRol);
      setSelectedPermisos(
        permisosDelRol.map((p) => p.idPermiso || p.id_permiso),
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

  // Limpiar mensajes de error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
        prev.filter((id) => !permisosDelModulo.includes(id)),
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRol) {
      setError("Debe seleccionar un rol");
      return;
    }

    if (selectedPermisos.length === 0) {
      setError("Debe seleccionar al menos un permiso");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Normalizar IDs a strings para comparación consistente
      const actualesIds = permisosActuales.map((p) =>
        String(p.idPermiso || p.id_permiso),
      );
      const selectedIds = selectedPermisos.map((id) => String(id));

      const toAdd = selectedIds.filter((id) => !actualesIds.includes(id));
      const toRemove = actualesIds.filter((id) => !selectedIds.includes(id));

      // Tracking de cambios
      let agregados = toAdd.length;
      let eliminados = toRemove.length;

      // Solución: pasar la lista COMPLETA de permisos seleccionados a asignarPermisos
      // No solo los nuevos, porque asignarPermisos borra y re-inserta
      const permisosParaAsignar = selectedIds.map((id) => parseInt(id, 10));

      try {
        await rolPermisoService.asignarPermisos(
          selectedRol,
          permisosParaAsignar,
        );
      } catch (error) {
        console.error("Error al asignar permisos:", error);
        throw error;
      }

      // Recargar permisos del rol
      await cargarPermisosDelRol();

      // Mostrar mensaje de éxito con más detalle
      const rolNombre = getRolNombre();
      let mensaje = "";

      if (agregados > 0 && eliminados > 0) {
        mensaje = `<strong>${rolNombre}</strong> actualizado exitosamente.<br/>Permisos añadidos: <strong>${agregados}</strong><br/>Permisos eliminados: <strong>${eliminados}</strong>`;
      } else if (agregados > 0) {
        mensaje = `<strong>${agregados}</strong> permiso(s) agregado(s) a <strong>${rolNombre}</strong>`;
      } else if (eliminados > 0) {
        mensaje = `<strong>${eliminados}</strong> permiso(s) eliminado(s) de <strong>${rolNombre}</strong>`;
      } else {
        mensaje = `Los permisos de <strong>${rolNombre}</strong> se encuentran actualizados`;
      }

      showSuccess("✓ Cambios Guardados", mensaje, 3000);

      // Cerrar el formulario inmediatamente (el usuario verá el alert SweetAlert)
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError("Error al asignar permisos: " + errorMsg);
      showError("Error", errorMsg, 5000);
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
      selectedPermisos.includes(p.idPermiso || p.id_permiso),
    ).length;
    return `${selectedCount}/${permisosDelModulo.length}`;
  };

  if (loading && roles.length === 0) {
    return (
      <div className={ComponenteStyle.loadingContainer}>
        <div className={ComponenteStyle.loadingSpinner}></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className={ComponenteStyle.formAsignarPermiso}>
      {error && (
        <div
          className="alert alert-error"
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "0.375rem",
            color: "#721c24",
          }}
        >
          <i className="fas fa-exclamation-triangle"></i>
          <div style={{ marginTop: "0.5rem" }}>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {success && (
        <div
          className="alert alert-success"
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "0.375rem",
            color: "#155724",
          }}
        >
          <i className="fas fa-check-circle"></i>
          <div style={{ marginTop: "0.5rem" }}>
            <strong>✓ Éxito:</strong> {success}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid" style={{ flexShrink: 0 }}>
          {/* Selector de Rol */}
          <div className={ComponenteStyle.formGroup}>
            <label htmlFor="rol" className={ComponenteStyle.formLabel}>
              Seleccionar Rol *
            </label>
            <select
              id="rol"
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value)}
              className={ComponenteStyle.formSelect}
              required
            >
              <option value="">Seleccionar rol...</option>
              {roles.map((rol) => (
                <option key={rol.idRol} value={rol.idRol}>
                  {rol.nombreRol}
                </option>
              ))}
            </select>
            <small className={ComponenteStyle.formHelp}>
              Seleccione el rol al cual desea asignar permisos
            </small>
          </div>

          {/* Filtro por módulo */}
          {selectedRol && (
            <div className={ComponenteStyle.formGroup}>
              <label
                htmlFor="filtroModulo"
                className={ComponenteStyle.formLabel}
              >
                Filtrar por Módulo
              </label>
              <select
                id="filtroModulo"
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                className={ComponenteStyle.formSelect}
              >
                <option value="">Todos los módulos</option>
                {modulosDisponibles.map((modulo) => (
                  <option key={modulo} value={modulo}>
                    {modulo} ({getModuleSelectedCount(modulo)})
                  </option>
                ))}
              </select>
              <small className={ComponenteStyle.formHelp}>
                Filtre los permisos por módulo del sistema para una mejor
                organización
              </small>
            </div>
          )}
        </div>

        {/* Información del rol seleccionado */}
        {selectedRol && (
          <div
            className={ComponenteStyle.formRolInfo}
            style={{
              flexShrink: 0,
              marginBottom: "1rem",
              padding: "0.75rem",
              backgroundColor:
                selectedPermisos.length > 0 ? "#e8f5e9" : "#fff3cd",
              borderLeft:
                "4px solid " +
                (selectedPermisos.length > 0 ? "#28a745" : "#ffc107"),
              borderRadius: "0.375rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
              <i className="fas fa-shield-alt me-2"></i>
              Asignando permisos para: <strong>{getRolNombre()}</strong>
            </h3>
            <div
              className={ComponenteStyle.textMuted}
              style={{ fontSize: "0.95rem" }}
            >
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>📋 Permisos actuales:</strong>{" "}
                <span style={{ color: "#666", fontWeight: "bold" }}>
                  {permisosActuales.length}
                </span>
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>☑️ Permisos seleccionados:</strong>{" "}
                <span
                  style={{
                    color: selectedPermisos.length > 0 ? "#28a745" : "#dc3545",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  {selectedPermisos.length}
                </span>
              </div>
              <div>
                <strong>📦 Total disponibles:</strong>{" "}
                <span style={{ color: "#666", fontWeight: "bold" }}>
                  {permisos.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Lista de permisos con scroll interno */}
        {selectedRol && (
          <div
            className={ComponenteStyle.permisoSection}
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
                (p) => p.modulo === modulo,
              );

              if (filtroModulo && filtroModulo !== modulo) {
                return null;
              }

              const allSelected = permisosDelModulo.every((p) =>
                selectedPermisos.includes(p.idPermiso || p.id_permiso),
              );
              const someSelected = permisosDelModulo.some((p) =>
                selectedPermisos.includes(p.idPermiso || p.id_permiso),
              );

              return (
                <div key={modulo} className={ComponenteStyle.moduloSection}>
                  <div className={ComponenteStyle.moduloHeader}>
                    <label className={ComponenteStyle.checkboxLabel}>
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
                      <span className={ComponenteStyle.badgeCounter}>
                        {getModuleSelectedCount(modulo)}
                      </span>
                    </label>
                  </div>

                  <div className={ComponenteStyle.permisosGrid}>
                    {permisosDelModulo.map((permiso) => {
                      const idPermiso = permiso.idPermiso || permiso.id_permiso;
                      return (
                        <label
                          key={idPermiso}
                          className={`${ComponenteStyle.checkboxLabel} ${ComponenteStyle.permisoItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={isPermisoSelected(idPermiso)}
                            onChange={(e) =>
                              handlePermisoChange(idPermiso, e.target.checked)
                            }
                          />
                          <div className={ComponenteStyle.permisoInfo}>
                            <span className={ComponenteStyle.permisoNombre}>
                              {permiso.nombrePermiso || permiso.descripcion}
                            </span>
                            {permiso.accion && permiso.accion !== "---" && (
                              <span className={ComponenteStyle.permisoAccion}>
                                ({permiso.accion})
                              </span>
                            )}
                            {permiso.descripcionPermiso && (
                              <small
                                className={ComponenteStyle.permisoDescripcion}
                              >
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

        {/* Información de cambios pendientes */}
        {selectedRol && (
          <div
            style={{
              flexShrink: 0,
              marginBottom: "1rem",
              padding: "0.75rem",
              backgroundColor: "#f0f7ff",
              borderRadius: "0.375rem",
              borderLeft: "4px solid #17a2b8",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "#004085" }}>
              {selectedPermisos.length > permisosActuales.length ? (
                <div>
                  <i
                    className="fas fa-arrow-up me-2"
                    style={{ color: "#28a745" }}
                  ></i>
                  <strong>
                    {selectedPermisos.length - permisosActuales.length}
                  </strong>{" "}
                  permiso(s) serán añadidos
                </div>
              ) : selectedPermisos.length < permisosActuales.length ? (
                <div>
                  <i
                    className="fas fa-arrow-down me-2"
                    style={{ color: "#dc3545" }}
                  ></i>
                  <strong>
                    {permisosActuales.length - selectedPermisos.length}
                  </strong>{" "}
                  permiso(s) serán eliminados
                </div>
              ) : (
                <div>
                  <i
                    className="fas fa-check me-2"
                    style={{ color: "#6c757d" }}
                  ></i>
                  Sin cambios pendientes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción fijos */}
        <div
          className={ComponenteStyle.formActions}
          style={{
            flexShrink: 0,
            borderTop: "1px solid #dee2e6",
            paddingTop: "1rem",
            marginTop: "auto",
            display: "flex",
            gap: "0.5rem",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel}`}
          >
            <i className="fas fa-times me-1"></i>
            Cancelar
          </button>

          {selectedRol && (
            <button
              type="submit"
              className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
              disabled={
                loading || selectedPermisos.length === permisosActuales.length
              }
              style={{
                backgroundColor: loading ? "#6c757d" : "#007bff",
                opacity:
                  selectedPermisos.length === permisosActuales.length ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-1"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-1"></i>
                  Guardar Cambios
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
