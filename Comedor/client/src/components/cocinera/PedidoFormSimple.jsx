import { useState, useEffect } from "react";
import Select from "react-select";
import { useAuth } from "../../context/AuthContext";
import pedidoService from "../../services/pedidoService";
import insumoService from "../../services/insumoService";
import proveedorService from "../../services/proveedorService";
import { proveedorInsumoService } from "../../services/proveedorInsumoService";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

// Estilos personalizados para react-select
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    border: state.isFocused ? "2px solid #007bff" : "2px solid #e9ecef",
    boxShadow: state.isFocused
      ? "0 0 0 0.2rem rgba(0, 123, 255, 0.25)"
      : "none",
    "&:hover": {
      border: "2px solid #007bff",
    },
    minHeight: "38px",
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: "250px",
    overflowY: "auto",
  }),
  menu: (base) => ({
    ...base,
    maxHeight: "300px",
    zIndex: 9999,
    position: "absolute",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#007bff"
      : state.isFocused
      ? "#f8f9fa"
      : base.backgroundColor,
    cursor: "pointer",
    padding: "8px 12px",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#6c757d",
    fontWeight: "500",
  }),
};

const PedidoFormSimple = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [insumos, setInsumos] = useState([]);
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState([]);

  // Estado del formulario simplificado
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0], // Fecha actual fija
    id_proveedor: "",
    insumos: [], // Lista de insumos seleccionados con sus cantidades
  });

  // Estado para el formulario de agregar insumo
  const [nuevoInsumo, setNuevoInsumo] = useState({
    id_insumo: "",
    cantidad: 1,
  });

  const [insumosProveedor, setInsumosProveedor] = useState([]);

  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    if (formData.id_proveedor) {
      cargarInsumosDelProveedor(formData.id_proveedor);
    } else {
      setInsumosProveedor([]);
      setFormData((prev) => ({ ...prev, insumos: [] }));
      setNuevoInsumo({ id_insumo: "", cantidad: 1 });
    }
  }, [formData.id_proveedor]);

  const cargarInsumos = async () => {
    try {
      setLoading(true);
      const insumosData = await insumoService.getActivos();
      setInsumos(insumosData);
    } catch (error) {
      console.error("Error al cargar insumos:", error);
      showError("Error", "Error al cargar insumos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const proveedoresData = await proveedorService.getActivos();
      setProveedoresDisponibles(proveedoresData);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      showError("Error", "Error al cargar proveedores: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarInsumosDelProveedor = async (idProveedor) => {
    try {
      console.log("Cargando insumos para proveedor ID:", idProveedor);
      const insumos = await proveedorInsumoService.getInsumosByProveedor(
        idProveedor
      );
      console.log("Insumos encontrados:", insumos);
      setInsumosProveedor(insumos);
    } catch (error) {
      console.error("Error al cargar insumos del proveedor:", error);
      setInsumosProveedor([]);
      console.warn(
        `No se encontraron insumos para el proveedor ${idProveedor}`
      );
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Transformar proveedores para react-select
  const proveedoresOptions = proveedoresDisponibles.map((proveedor) => ({
    value: proveedor.idProveedor,
    label: `${proveedor.razonSocial}${
      proveedor.telefono ? ` - Tel: ${proveedor.telefono}` : ""
    }`,
    data: proveedor,
  }));

  // Transformar insumos del proveedor para react-select
  const insumosOptions = insumosProveedor.map((insumo) => ({
    value: insumo.id_insumo,
    label: `${insumo.nombreInsumo || insumo.nombreInsumo} ${
      insumo.categoria ? `(${insumo.categoria})` : ""
    }`,
    data: insumo,
  }));

  // Manejar selección de proveedor
  const handleProveedorChange = (selectedOption) => {
    const idProveedor = selectedOption ? selectedOption.value : "";
    console.log("Proveedor seleccionado:", selectedOption);
    setFormData((prev) => ({
      ...prev,
      id_proveedor: idProveedor,
      insumos: [],
    }));
    setNuevoInsumo({ id_insumo: "", cantidad: 1 });
  };

  // Manejar selección de insumo para agregar
  const handleInsumoChange = (selectedOption) => {
    const idInsumo = selectedOption ? selectedOption.value : "";
    console.log("Insumo seleccionado:", selectedOption);
    setNuevoInsumo((prev) => ({ ...prev, id_insumo: idInsumo }));
  };

  // Agregar insumo a la lista
  const agregarInsumo = () => {
    if (
      !nuevoInsumo.id_insumo ||
      !nuevoInsumo.cantidad ||
      nuevoInsumo.cantidad <= 0
    ) {
      showToast(
        "Debe seleccionar un insumo y una cantidad válida",
        "info",
        2000
      );
      return;
    }

    // Verificar si el insumo ya está en la lista
    const insumoExistente = formData.insumos.find(
      (item) => item.id_insumo === nuevoInsumo.id_insumo
    );

    if (insumoExistente) {
      showToast(
        "Este insumo ya está en la lista. Puede editar la cantidad si es necesario.",
        "info",
        2000
      );
      return;
    }

    const insumoData = insumosProveedor.find(
      (i) => i.id_insumo === nuevoInsumo.id_insumo
    );
    const nuevoItem = {
      ...nuevoInsumo,
      nombreInsumo: insumoData?.nombreInsumo || insumoData?.nombreInsumo,
      unidadMedida: insumoData?.unidadMedida,
      cantidad: Number(nuevoInsumo.cantidad),
    };

    setFormData((prev) => ({
      ...prev,
      insumos: [...prev.insumos, nuevoItem],
    }));

    // Limpiar formulario de agregar insumo
    setNuevoInsumo({ id_insumo: "", cantidad: 1 });
  };

  // Eliminar insumo de la lista
  const eliminarInsumo = (idInsumo) => {
    setFormData((prev) => ({
      ...prev,
      insumos: prev.insumos.filter((item) => item.id_insumo !== idInsumo),
    }));
  };

  // Actualizar cantidad de un insumo en la lista
  const actualizarCantidad = (idInsumo, nuevaCantidad) => {
    if (nuevaCantidad <= 0) return;

    setFormData((prev) => ({
      ...prev,
      insumos: prev.insumos.map((item) =>
        item.id_insumo === idInsumo
          ? { ...item, cantidad: Number(nuevaCantidad) }
          : item
      ),
    }));
  };

  const validarFormulario = () => {
    if (!formData.id_proveedor) {
      showToast("Debe seleccionar un proveedor", "info", 2000);
      return false;
    }

    if (formData.insumos.length === 0) {
      showToast("Debe agregar al menos un insumo al pedido", "info", 2000);
      return false;
    }

    // Verificar que todos los insumos tengan cantidades válidas
    const insumoInvalido = formData.insumos.find(
      (item) => !item.cantidad || item.cantidad <= 0
    );
    if (insumoInvalido) {
      showToast(
        "Todos los insumos deben tener una cantidad válida mayor a 0",
        "info",
        2000
      );
      return false;
    }

    return true;
  };

  const crearPedido = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const datosPedido = {
        insumos: formData.insumos.map((item) => ({
          id_insumo: item.id_insumo,
          id_proveedor: formData.id_proveedor,
          cantidad: Number(item.cantidad),
        })),
        fechaEntregaEsperada: formData.fecha,
        observaciones: null,
        id_usuario: user?.idUsuario || user?.id_usuario,
      };

      const pedidosCreados = await pedidoService.crearPedidoManual(datosPedido);

      showSuccess("Éxito", "Pedido creado exitosamente");
      if (onSuccess) onSuccess(pedidosCreados);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al crear pedido:", error);
      showError("Error", "Error al crear el pedido: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const proveedorSeleccionado = proveedoresDisponibles.find(
    (p) => p.idProveedor === formData.id_proveedor
  );

  return (
    <div>
      <div className="card shadow-sm">
        <div className="card-header text-dark">
          <h5 className="mb-0">
            <i className="fas fa-plus-circle me-2"></i>
            Crear Pedido Manual
          </h5>
          <small>Selecciona un proveedor y agrega los insumos necesarios</small>
        </div>

        <div className="card-body bg-white">
          {loading && (
            <div className="d-flex justify-content-center mb-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              crearPedido();
            }}
          >
            {/* Fecha fija */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  <i className="fas fa-calendar me-1"></i>
                  Fecha del Pedido
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fecha}
                  disabled
                  style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                />
                <small className="form-text text-muted">
                  La fecha está fija al día actual
                </small>
              </div>
            </div>

            {/* Selección de Proveedor */}
            <div className="row mb-3">
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-truck me-1"></i>
                  Seleccionar Proveedor *
                </label>
                <Select
                  options={proveedoresOptions}
                  value={
                    proveedoresOptions.find(
                      (opt) => opt.value === formData.id_proveedor
                    ) || null
                  }
                  onChange={handleProveedorChange}
                  placeholder="Buscar y seleccionar un proveedor..."
                  isSearchable
                  isClearable
                  noOptionsMessage={() => "No se encontraron proveedores"}
                  loadingMessage={() => "Cargando proveedores..."}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={customSelectStyles}
                />
              </div>
            </div>

            {/* Formulario para agregar insumos */}
            {formData.id_proveedor && (
              <div className="card mb-4 border-light">
                <div className="card-header text-dark">
                  <h6 className="mb-0">
                    <i className="fas fa-plus me-1 text-primary"></i>
                    Agregar Insumo al Pedido
                  </h6>
                  <small className="text-muted">
                    Selecciona un insumo y especifica la cantidad
                  </small>
                </div>
                <div className="card-body bg-white">
                  <div>
                    <div className="form-group">
                      <label className="form-label fw-bold">
                        <i className="fas fa-box me-1 text-black"></i>
                        Insumo *
                      </label>
                      <Select
                        options={insumosOptions}
                        value={
                          insumosOptions.find(
                            (opt) => opt.value === nuevoInsumo.id_insumo
                          ) || null
                        }
                        onChange={handleInsumoChange}
                        placeholder="🔍 Buscar insumo..."
                        isSearchable
                        isClearable
                        noOptionsMessage={() =>
                          "No se encontraron insumos para este proveedor"
                        }
                        loadingMessage={() => "Cargando insumos..."}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={customSelectStyles}
                      />
                      {insumosProveedor.length === 0 && (
                        <small className="text-warning mt-1 d-block">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          No hay insumos disponibles para este proveedor
                        </small>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="mt-1">
                        <i className="fas fa-calculator me-1 text-black"></i>
                        Cantidad *
                      </label>
                      <div className="d-flex mt-2" style={{ width: "35%" }}>
                        <div className="form-group">
                          <input
                            type="number"
                            className="form-control"
                            value={nuevoInsumo.cantidad}
                            onChange={(e) =>
                              setNuevoInsumo((prev) => ({
                                ...prev,
                                cantidad: e.target.value,
                              }))
                            }
                            min="1"
                            step="1"
                            placeholder="0"
                          />
                        </div>
                        <div className="mx-1">
                          <span className="input-group-text bg-light">
                            {insumosProveedor.find(
                              (i) => i.id_insumo === nuevoInsumo.id_insumo
                            )?.unidadMedida || "unidad"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="form-actions">
                      <div className="d-grid">
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={agregarInsumo}
                          disabled={
                            !nuevoInsumo.id_insumo || !nuevoInsumo.cantidad
                          }
                        >
                          <i className="fas fa-plus-circle"></i>
                          Agregar al Pedido
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay insumos en el pedido */}
            {formData.id_proveedor && formData.insumos.length === 0 && (
              <div className="alert alert-info border-info mb-4">
                <div className="d-flex align-items-center">
                  <i className="fas fa-info-circle text-info me-2"></i>
                  <div>
                    <h6 className="mb-1">No hay insumos en el pedido</h6>
                    <small>
                      Selecciona insumos del proveedor elegido y agrégalos al
                      pedido usando el formulario de arriba.
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de insumos agregados */}
            {formData.insumos.length > 0 && (
              <div className="card mb-4 border-light">
                <div className="card-header bg-light text-dark">
                  <h6 className="mb-0">
                    <i className="fas fa-list-check me-1"></i>
                    Insumos en el Pedido ({formData.insumos.length})
                  </h6>
                  <small>Lista de insumos agregados al pedido</small>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-bold">
                            <i className="fas fa-box text-dark me-1"></i>
                            Insumo
                          </th>
                          <th className="fw-bold text-center">
                            <i className="fas fa-calculator text-dark me-1"></i>
                            Cantidad
                          </th>
                          <th className="fw-bold text-center">
                            <i className="fas fa-ruler text-dark me-1"></i>
                            Unidad
                          </th>
                          <th className="fw-bold text-center" width="120">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.insumos.map((item, index) => (
                          <tr key={item.id_insumo} className="align-middle">
                            <td className="fw-medium">{item.nombreInsumo}</td>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center">
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-center fw-bold"
                                  value={item.cantidad}
                                  onChange={(e) =>
                                    actualizarCantidad(
                                      item.id_insumo,
                                      e.target.value
                                    )
                                  }
                                  min="1"
                                  step="1"
                                  style={{ width: "80px" }}
                                />
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark">
                                {item.unidadMedida || "unidad(es)"}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => eliminarInsumo(item.id_insumo)}
                                title="Eliminar insumo"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen del Pedido */}
            {formData.id_proveedor && formData.insumos.length > 0 && (
              <div className="alert alert-success border-success mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-check-circle text-success me-2 fs-5"></i>
                  <h6 className="mb-0 fw-bold">Resumen del Pedido</h6>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-calendar text-primary me-2"></i>
                      <div>
                        <small className="text-muted d-block">
                          Fecha de entrega
                        </small>
                        <strong>
                          {new Date(formData.fecha).toLocaleDateString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-truck text-info me-2"></i>
                      <div>
                        <small className="text-muted d-block">Proveedor</small>
                        <strong>{proveedorSeleccionado?.razonSocial}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-boxes text-warning me-2"></i>
                      <div>
                        <small className="text-muted d-block">
                          Total de insumos
                        </small>
                        <strong>
                          {formData.insumos.length} item
                          {formData.insumos.length !== 1 ? "s" : ""}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="form-actions mt-4">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={onClose}
                disabled={loading}
              >
                <i className="fas fa-times"></i>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary me-2"
                disabled={
                  loading ||
                  !formData.id_proveedor ||
                  formData.insumos.length === 0
                }
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Crear Pedido ({formData.insumos.length} insumo
                    {formData.insumos.length !== 1 ? "s" : ""})
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PedidoFormSimple;
