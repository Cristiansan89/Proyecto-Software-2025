import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import Select from "react-select";
import { proveedorInsumoService } from "../../services/proveedorInsumoService";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const MovimientosForm = ({
  isOpen,
  onClose,
  inventarios,
  tiposMerma,
  onMovimientoRegistrado,
}) => {
  const { user } = useAuth();
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    id_insumo: "",
    tipoMovimiento: "Entrada",
    cantidadMovimiento: "",
    comentarioMovimiento: "",
    id_tipoMerma: "",
  });
  const [loading, setLoading] = useState(false);
  const [proveedoresDelInsumo, setProveedoresDelInsumo] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [calificacionSeleccionada, setCalificacionSeleccionada] = useState("");
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [unidadMedidaInsumo, setUnidadMedidaInsumo] = useState("");
  const [stockMaximoInsumo, setStockMaximoInsumo] = useState(null);

  // Opciones de calificación
  const opcionesCalificacion = [
    { value: "Excelente", label: "⭐⭐⭐⭐⭐ Excelente" },
    { value: "Bueno", label: "⭐⭐⭐⭐ Bueno" },
    { value: "Regular", label: "⭐⭐⭐ Regular" },
    { value: "Malo", label: "⭐⭐ Malo" },
  ];

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setNuevoMovimiento({
        id_insumo: "",
        tipoMovimiento: "Entrada",
        cantidadMovimiento: "",
        comentarioMovimiento: "",
        id_tipoMerma: "",
      });
      setProveedoresDelInsumo([]);
      setProveedorSeleccionado(null);
      setCalificacionSeleccionada("");
      setUnidadMedidaInsumo("");
      setStockMaximoInsumo(null);
    }
  }, [isOpen]);

  // Cargar proveedores cuando se selecciona un insumo y es tipo Entrada
  useEffect(() => {
    if (
      nuevoMovimiento.id_insumo &&
      nuevoMovimiento.tipoMovimiento === "Entrada"
    ) {
      cargarProveedoresDelInsumo(nuevoMovimiento.id_insumo);
    } else {
      setProveedoresDelInsumo([]);
      setProveedorSeleccionado(null);
      setCalificacionSeleccionada("");
      setUnidadMedidaInsumo("");
    }
  }, [nuevoMovimiento.id_insumo, nuevoMovimiento.tipoMovimiento]);

  // Cargar proveedores del insumo
  const cargarProveedoresDelInsumo = async (idInsumo) => {
    try {
      setCargandoProveedores(true);
      const response =
        await proveedorInsumoService.getProveedoresByInsumo(idInsumo);
      const proveedores = Array.isArray(response.data)
        ? response.data
        : response;
      setProveedoresDelInsumo(proveedores || []);
      setProveedorSeleccionado(null);
      setCalificacionSeleccionada("");
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      setProveedoresDelInsumo([]);
    } finally {
      setCargandoProveedores(false);
    }
  };

  // Opciones para react-select
  const opcionesInsumos = inventarios.map((inv) => {
    return {
      value: inv.id_insumo,
      label: `${inv.nombreInsumo} (${inv.unidadMedida})`,
      data: {
        idInsumo: inv.id_insumo,
        nombreInsumo: inv.nombreInsumo,
        unidadMedida: inv.unidadMedida,
        categoria: inv.categoria,
        inventario: {
          cantidadActual: inv.cantidadActual,
          stockMaximo: inv.stockMaximo,
        },
      },
    };
  });

  const opcionesTiposMovimiento = [
    { value: "Entrada", label: "↗️ Entrada" },
    { value: "Salida", label: "↙️ Salida" },
    { value: "Merma", label: "🗑️ Merma" },
  ];

  const opcionesTiposMerma = tiposMerma.map((tipo) => ({
    value: tipo.id_tipo_merma || tipo.id_tipoMerma,
    label: `${tipo.nombre} - ${tipo.descripcion}`,
  }));

  // Estilos personalizados para react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#0d6efd" : "#ced4da",
      boxShadow: state.isFocused
        ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
        : "none",
      "&:hover": {
        borderColor: "#0d6efd",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#0d6efd"
        : state.isFocused
          ? "#f8f9fa"
          : "white",
      color: state.isSelected ? "white" : "#212529",
    }),
  };

  const registrarMovimiento = async () => {
    try {
      if (!nuevoMovimiento.id_insumo || !nuevoMovimiento.cantidadMovimiento) {
        showInfo("Complete los campos requeridos");
        return;
      }

      // Validar que la cantidad no exceda el stock máximo para entradas
      if (nuevoMovimiento.tipoMovimiento === "Entrada" && stockMaximoInsumo) {
        const cantidad = parseFloat(nuevoMovimiento.cantidadMovimiento);
        if (cantidad > stockMaximoInsumo) {
          showError(
            "Cantidad excedida",
            `La cantidad (${cantidad}) no puede exceder el stock máximo permitido (${stockMaximoInsumo})`
          );
          return;
        }
      }

      if (
        nuevoMovimiento.tipoMovimiento === "Merma" &&
        !nuevoMovimiento.id_tipoMerma
      ) {
        showInfo("Seleccione un tipo de merma");
        return;
      }

      // Validar que se haya seleccionado proveedor y calificación si es entrada
      if (
        nuevoMovimiento.tipoMovimiento === "Entrada" &&
        proveedoresDelInsumo.length > 0
      ) {
        if (!proveedorSeleccionado) {
          showInfo("Seleccione un proveedor para la entrada");
          return;
        }
        if (!calificacionSeleccionada) {
          showInfo("Seleccione una calificación para el proveedor");
          return;
        }
      }

      setLoading(true);

      const movimientoData = {
        id_insumo: parseInt(nuevoMovimiento.id_insumo),
        tipoMovimiento: nuevoMovimiento.tipoMovimiento,
        cantidadMovimiento: parseInt(nuevoMovimiento.cantidadMovimiento),
        comentarioMovimiento: nuevoMovimiento.comentarioMovimiento,
        id_usuario: user.idUsuario || user.id_usuario,
        id_tipoMerma:
          nuevoMovimiento.tipoMovimiento === "Merma"
            ? parseInt(nuevoMovimiento.id_tipoMerma)
            : null,
      };

      // Registrar movimiento de inventario y capturar respuesta con ID
      const respuestaMovimiento = await API.post("/movimientos-inventarios", movimientoData);
      const idMovimiento = respuestaMovimiento.data?.id_movimiento;
      
      if (idMovimiento) {
        console.log("[MovimientosForm] Movimiento creado con ID:", idMovimiento);
      } else {
        console.warn("[Auditoría] Advertencia: No se capturó ID del movimiento registrado");
      }

      // Si es entrada y se seleccionó proveedor, actualizar calificación
      if (
        nuevoMovimiento.tipoMovimiento === "Entrada" &&
        proveedorSeleccionado &&
        calificacionSeleccionada
      ) {
        try {
          // Obtener los IDs de proveedor e insumo
          const proveedorInsumoData = proveedoresDelInsumo.find(
            (p) =>
              (p.id_proveedor || p.idProveedor) ==
              (proveedorSeleccionado.value ||
                proveedorSeleccionado.id_proveedor),
          );

          if (proveedorInsumoData) {
            const idProvedor = proveedorInsumoData.id_proveedor;
            const idInsumo = nuevoMovimiento.id_insumo;
            
            if (!idProvedor || !idInsumo) {
              console.warn(
                "[MovimientosForm] No se puede actualizar calificación: ID Proveedor =",
                idProvedor,
                "ID Insumo =",
                idInsumo,
              );
              throw new Error("Faltan IDs de proveedor o insumo");
            }

            const actualizacion = {
              calificacion: calificacionSeleccionada,
            };

            console.log(
              "[MovimientosForm] Actualizando calificación para proveedor",
              idProvedor,
              "insumo",
              idInsumo,
              "con datos:",
              actualizacion,
            );

            // Actualizar la calificación en proveedorinsumo
            const respuestaActualizacion = await proveedorInsumoService.update(
              idProvedor,
              idInsumo,
              actualizacion,
            );

            if (respuestaActualizacion) {
              console.log(
                "[MovimientosForm] Calificación actualizada exitosamente para proveedor:",
                idProvedor,
                "insumo:",
                idInsumo,
              );
            } else {
              console.warn(
                "[Auditoría] Advertencia: Respuesta vacía de actualización de proveedorInsumo",
              );
            }
          }
        } catch (error) {
          console.error("Error al actualizar calificación:", error);
          // No bloquear el movimiento si falla la calificación
        }
      }

      // Callback para notificar que el movimiento fue registrado
      if (onMovimientoRegistrado) {
        onMovimientoRegistrado();
      }

      // Reset form and close modal
      setNuevoMovimiento({
        id_insumo: "",
        tipoMovimiento: "Entrada",
        cantidadMovimiento: "",
        comentarioMovimiento: "",
        id_tipoMerma: "",
      });
      setProveedoresDelInsumo([]);
      setProveedorSeleccionado(null);
      setCalificacionSeleccionada("");

      onClose();
      showSuccess("Éxito", "Movimiento registrado exitosamente");
    } catch (error) {
      showError(
        "Error",
        "Error al registrar el movimiento: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <form onSubmit={registrarMovimiento} id="movimientoForm">
      <div className="mb-3">
        <label className="form-label">Insumo *</label>
        {opcionesInsumos.length === 0 && (
          <div className="alert alert-warning">
            🔄 Cargando inventario... ({inventarios.length} items disponibles)
          </div>
        )}
        <Select
          options={opcionesInsumos}
          value={
            opcionesInsumos.find(
              (opt) => opt.value == nuevoMovimiento.id_insumo,
            ) || null
          }
          onChange={(selectedOption) => {
            setNuevoMovimiento({
              ...nuevoMovimiento,
              id_insumo: selectedOption ? selectedOption.value : "",
            });
            // Guardar la unidad de medida y stock máximo del insumo seleccionado
            if (selectedOption) {
              setUnidadMedidaInsumo(selectedOption.data.unidadMedida);
              setStockMaximoInsumo(selectedOption.data.inventario?.stockMaximo || null);
            } else {
              setUnidadMedidaInsumo("");
              setStockMaximoInsumo(null);
            }
          }}
          placeholder={`Buscar y seleccionar insumo... (${opcionesInsumos.length} disponibles)`}
          isSearchable
          isClearable
          isDisabled={loading}
          styles={customSelectStyles}
          formatOptionLabel={(option) => {
            const stockFormato = option.data.inventario
              ? Math.round(
                  parseFloat(option.data.inventario.cantidadActual || 0),
                ).toLocaleString("es-ES")
              : "0";
            return (
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {option.data.nombreInsumo}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#6c757d",
                    display: "grid",
                    gap: "4px",
                  }}
                >
                  <div>
                    <strong>Unidad:</strong> {option.data.unidadMedida} |{" "}
                    <strong>Categoría:</strong>{" "}
                    {option.data.categoria || "Sin categoría"}
                  </div>
                  {option.data.inventario && (
                    <div>
                      <strong>Stock Disponible:</strong>{" "}
                      <span style={{ color: "#28a745", fontWeight: "bold" }}>
                        {stockFormato} {option.data.unidadMedida}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          }}
          noOptionsMessage={() => "No se encontraron insumos"}
          loadingMessage={() => "Cargando insumos..."}
        />
        {nuevoMovimiento.id_insumo && (
          <small className="form-text text-muted">
            {(() => {
              const inventarioSeleccionado = inventarios.find(
                (inv) => inv.id_insumo == nuevoMovimiento.id_insumo,
              );
              if (inventarioSeleccionado) {
                const stockFormato = Math.round(
                  parseFloat(inventarioSeleccionado.cantidadActual),
                ).toLocaleString("es-ES");
                return `Stock actual: ${stockFormato} ${inventarioSeleccionado.unidadMedida}`;
              }
              return "";
            })()}
          </small>
        )}
      </div>

      <div className="row g-3">
        <div className="col-md-4 mb-3">
          <label className="form-label">Tipo de movimiento</label>
          <Select
            options={opcionesTiposMovimiento}
            value={opcionesTiposMovimiento.find(
              (opt) => opt.value === nuevoMovimiento.tipoMovimiento,
            )}
            onChange={(selectedOption) => {
              setNuevoMovimiento({
                ...nuevoMovimiento,
                tipoMovimiento: selectedOption.value,
                id_tipoMerma: "", // Reset tipo de merma cuando cambia el tipo de movimiento
              });
            }}
            isSearchable={false}
            isDisabled={loading}
            styles={customSelectStyles}
          />
        </div>
        <div className="col-md-2 mb-3 mx-0">
          <label className="form-label">Unidad de Medida</label>
          <div className="d-block">
            {unidadMedidaInsumo && (
              <span className="input-group-text bg-light font-weight-bold">
                <strong>{unidadMedidaInsumo}</strong>
              </span>
            )}
          </div>
        </div>
        <div className="col-md-3 mb-3 mx-2">
          <label className="form-label">Cantidad *</label>
          <div className="input">
            <input
              type="number"
              className="form-control"
              value={nuevoMovimiento.cantidadMovimiento}
              onChange={(e) =>
                setNuevoMovimiento({
                  ...nuevoMovimiento,
                  cantidadMovimiento: e.target.value,
                })
              }
              min="0"
              step="0"
              placeholder="0"
              max={nuevoMovimiento.tipoMovimiento === "Entrada" ? stockMaximoInsumo : undefined}
              required
              disabled={loading}
            />
          </div>
          {nuevoMovimiento.tipoMovimiento === "Entrada" && stockMaximoInsumo && (
            <small className="form-text text-muted">
              Máximo permitido: {stockMaximoInsumo.toLocaleString("es-ES")}
            </small>
          )}
        </div>
      </div>

      {nuevoMovimiento.tipoMovimiento === "Merma" && (
        <div className="mb-3">
          <label className="form-label">Tipo de Merma *</label>
          <Select
            options={opcionesTiposMerma}
            value={
              opcionesTiposMerma.find(
                (opt) => opt.value == nuevoMovimiento.id_tipoMerma,
              ) || null
            }
            onChange={(selectedOption) => {
              setNuevoMovimiento({
                ...nuevoMovimiento,
                id_tipoMerma: selectedOption ? selectedOption.value : "",
              });
            }}
            placeholder="Seleccionar tipo de merma..."
            isSearchable
            isClearable
            isDisabled={loading}
            styles={customSelectStyles}
          />
        </div>
      )}

      {/* Selector de Proveedor - Solo para Entrada */}
      {nuevoMovimiento.tipoMovimiento === "Entrada" && (
        <>
          {cargandoProveedores && (
            <div className="mb-3">
              <div className="alert alert-info">
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Cargando proveedores...
              </div>
            </div>
          )}

          {!cargandoProveedores && proveedoresDelInsumo.length > 0 && (
            <>
              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-building me-2 text-primary"></i>
                  Proveedor *
                </label>
                <Select
                  options={proveedoresDelInsumo.map((p) => ({
                    value: p.id_proveedor || p.idProveedor,
                    label:
                      p.nombreProveedor ||
                      p.nombre ||
                      p.razonSocial ||
                      `Proveedor (${p.id_proveedor || p.idProveedor})`,
                    data: p,
                  }))}
                  value={proveedorSeleccionado}
                  onChange={(selectedOption) => {
                    setProveedorSeleccionado(selectedOption);
                    setCalificacionSeleccionada("");
                  }}
                  placeholder="Seleccionar proveedor..."
                  isSearchable
                  isClearable
                  isDisabled={loading || cargandoProveedores}
                  styles={customSelectStyles}
                />
              </div>

              {/* Selector de Calificación - Solo si hay proveedor seleccionado */}
              {proveedorSeleccionado && (
                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-star me-2 text-warning"></i>
                    Calificar Proveedor *
                  </label>
                  <div className="d-flex gap-3">
                    {opcionesCalificacion.map((opcion) => (
                      <div key={opcion.value} className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="calificacion"
                          id={`cal_${opcion.value}`}
                          value={opcion.value}
                          checked={calificacionSeleccionada === opcion.value}
                          onChange={(e) =>
                            setCalificacionSeleccionada(e.target.value)
                          }
                          disabled={loading}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`cal_${opcion.value}`}
                        >
                          {opcion.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!cargandoProveedores &&
            proveedoresDelInsumo.length === 0 &&
            nuevoMovimiento.id_insumo && (
              <div className="alert alert-warning" role="alert">
                <i className="fas fa-info-circle me-2"></i>
                No hay proveedores registrados para este insumo
              </div>
            )}
        </>
      )}

      <div className="mb-3">
        <label className="form-label">
          {nuevoMovimiento.tipoMovimiento === "Entrada"
            ? "Observaciones (proveedor, factura, etc.)"
            : nuevoMovimiento.tipoMovimiento === "Salida"
              ? "Observaciones (destino, receta, etc.)"
              : "Descripción de la merma"}
        </label>
        <textarea
          className="form-control"
          rows="3"
          value={nuevoMovimiento.comentarioMovimiento}
          onChange={(e) =>
            setNuevoMovimiento({
              ...nuevoMovimiento,
              comentarioMovimiento: e.target.value,
            })
          }
          placeholder={
            nuevoMovimiento.tipoMovimiento === "Entrada"
              ? "Proveedor, número de factura, lote..."
              : nuevoMovimiento.tipoMovimiento === "Salida"
                ? "Para qué receta, consumo directo..."
                : "Detalles sobre la causa de la merma..."
          }
          disabled={loading}
        />
      </div>

      <div className="form-actions mt-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
        >
          <i className="fas fa-times me-2"></i>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={registrarMovimiento}
          disabled={
            loading ||
            cargandoProveedores ||
            !nuevoMovimiento.id_insumo ||
            !nuevoMovimiento.cantidadMovimiento ||
            (nuevoMovimiento.tipoMovimiento === "Merma" &&
              !nuevoMovimiento.id_tipoMerma) ||
            (nuevoMovimiento.tipoMovimiento === "Entrada" &&
              proveedoresDelInsumo.length > 0 &&
              (!proveedorSeleccionado || !calificacionSeleccionada))
          }
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Guardando...
            </>
          ) : (
            <>
              <i className="fas fa-save me-2"></i>
              Registrar {nuevoMovimiento.tipoMovimiento}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default MovimientosForm;
