import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import Select from "react-select";
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
    }
  }, [isOpen]);

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
        showToast("Complete los campos requeridos", "info", 2000);
        return;
      }

      if (
        nuevoMovimiento.tipoMovimiento === "Merma" &&
        !nuevoMovimiento.id_tipoMerma
      ) {
        showToast("Seleccione un tipo de merma", "info", 2000);
        return;
      }

      setLoading(true);

      const movimientoData = {
        id_insumo: parseInt(nuevoMovimiento.id_insumo),
        tipoMovimiento: nuevoMovimiento.tipoMovimiento,
        cantidadMovimiento: parseFloat(nuevoMovimiento.cantidadMovimiento),
        comentarioMovimiento: nuevoMovimiento.comentarioMovimiento,
        id_usuario: user.idUsuario || user.id_usuario,
        id_tipoMerma:
          nuevoMovimiento.tipoMovimiento === "Merma"
            ? parseInt(nuevoMovimiento.id_tipoMerma)
            : null,
      };

      await API.post("/movimientos-inventarios", movimientoData);

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

      onClose();
      showSuccess("Éxito", "Movimiento registrado exitosamente");
    } catch (error) {
      showError(
        "Error",
        "Error al registrar el movimiento: " +
          (error.response?.data?.message || error.message)
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
              (opt) => opt.value == nuevoMovimiento.id_insumo
            ) || null
          }
          onChange={(selectedOption) => {
            setNuevoMovimiento({
              ...nuevoMovimiento,
              id_insumo: selectedOption ? selectedOption.value : "",
            });
          }}
          placeholder={`Buscar y seleccionar insumo... (${opcionesInsumos.length} disponibles)`}
          isSearchable
          isClearable
          isDisabled={loading}
          styles={customSelectStyles}
          formatOptionLabel={(option) => (
            <div>
              <div style={{ fontWeight: "bold" }}>
                {option.data.nombreInsumo}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>
                Unidad: {option.data.unidadMedida} | Categoría:{" "}
                {option.data.categoria || "Sin categoría"}
                {option.data.inventario &&
                  ` | Stock: ${Math.round(
                    parseFloat(option.data.inventario.cantidadActual || 0)
                  )}`}
              </div>
            </div>
          )}
          noOptionsMessage={() => "No se encontraron insumos"}
          loadingMessage={() => "Cargando insumos..."}
        />
        {nuevoMovimiento.id_insumo && (
          <small className="form-text text-muted">
            {(() => {
              const inventarioSeleccionado = inventarios.find(
                (inv) => inv.id_insumo == nuevoMovimiento.id_insumo
              );
              if (inventarioSeleccionado) {
                return `Stock actual: ${Math.round(
                  parseFloat(inventarioSeleccionado.cantidadActual)
                )} ${inventarioSeleccionado.unidadMedida}`;
              }
              return "";
            })()}
          </small>
        )}
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Tipo de movimiento</label>
          <Select
            options={opcionesTiposMovimiento}
            value={opcionesTiposMovimiento.find(
              (opt) => opt.value === nuevoMovimiento.tipoMovimiento
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

        <div className="col-md-6 mb-3">
          <label className="form-label">Cantidad *</label>
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
            step="0.001"
            required
            disabled={loading}
          />
        </div>
      </div>

      {nuevoMovimiento.tipoMovimiento === "Merma" && (
        <div className="mb-3">
          <label className="form-label">Tipo de Merma *</label>
          <Select
            options={opcionesTiposMerma}
            value={
              opcionesTiposMerma.find(
                (opt) => opt.value == nuevoMovimiento.id_tipoMerma
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
            !nuevoMovimiento.id_insumo ||
            !nuevoMovimiento.cantidadMovimiento ||
            (nuevoMovimiento.tipoMovimiento === "Merma" &&
              !nuevoMovimiento.id_tipoMerma)
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
