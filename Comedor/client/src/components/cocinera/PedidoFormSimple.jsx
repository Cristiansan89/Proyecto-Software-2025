import { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { useAuth } from "../../context/AuthContext";
import pedidoService from "../../services/pedidoService";
import insumoService from "../../services/insumoService";
import proveedorService from "../../services/proveedorService";
import { proveedorInsumoService } from "../../services/proveedorInsumoService";
import inventarioService from "../../services/inventarioService";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm,
} from "../../utils/alertService";
import formatCantidad from "../../utils/formatCantidad";

const CALIFICACION_BADGE = {
  Excelente: "success",
  Bueno: "info",
  Regular: "warning",
  Malo: "danger",
};

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

const PedidoFormSimple = ({ onClose, onSuccess, pedidoEditando = null }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!pedidoEditando;

  // ─── Utilidades ───────────────────────────────────────────────────────────
  const obtenerFechaActual = () => new Date().toISOString().split("T")[0];

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "";
    // Si es solo fecha (YYYY-MM-DD), parsear directamente sin conversión UTC
    if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaString)) {
      const [año, mes, día] = fechaString.split('-').map(Number);
      // Crear fecha local directamente
      return new Date(año, mes - 1, día).toLocaleDateString("es-ES");
    }
    return new Date(fechaString).toLocaleDateString("es-ES");
  };

  const formatearFechaInput = (fechaString) => {
    if (!fechaString) return obtenerFechaActual();
    return new Date(fechaString + "T12:00:00").toISOString().split("T")[0];
  };

  // ─── MODO EDICIÓN ─────────────────────────────────────────────────────────
  const [editFormData, setEditFormData] = useState({
    fecha: pedidoEditando
      ? formatearFechaInput(pedidoEditando.fechaEmision)
      : obtenerFechaActual(),
    id_proveedor:
      pedidoEditando?.id_proveedor || pedidoEditando?.idProveedor || "",
    insumos: [],
  });
  const [nuevoInsumoEdit, setNuevoInsumoEdit] = useState({
    id_insumo: "",
    cantidad: 1,
  });
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState([]);
  const [insumosProveedor, setInsumosProveedor] = useState([]);

  useEffect(() => {
    if (isEditMode && !authLoading && isAuthenticated) cargarProveedores();
  }, [isEditMode, authLoading, isAuthenticated]);

  useEffect(() => {
    if (isEditMode && editFormData.id_proveedor)
      cargarInsumosDelProveedor(editFormData.id_proveedor);
  }, [editFormData.id_proveedor]);

  useEffect(() => {
    if (pedidoEditando?.detalles) {
      setEditFormData((prev) => ({
        ...prev,
        insumos: pedidoEditando.detalles.map((d) => ({
          id_insumo: d.id_insumo,
          nombreInsumo: d.nombreInsumo,
          unidadMedida: d.unidadMedida,
          cantidad: Number(d.cantidad || d.cantidadSolicitada),
        })),
      }));
    }
  }, [pedidoEditando]);

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      setProveedoresDisponibles(await proveedorService.getActivos());
    } catch (error) {
      showError("Error", "Error al cargar proveedores: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarInsumosDelProveedor = async (idProveedor) => {
    try {
      setInsumosProveedor(
        await proveedorInsumoService.getInsumosByProveedor(idProveedor)
      );
    } catch (error) {
      showError(
        "Error",
        "Error al cargar insumos del proveedor: " + error.message
      );
      setInsumosProveedor([]);
    }
  };

  const proveedoresOptions = proveedoresDisponibles.map((p) => ({
    value: p.idProveedor,
    label: `${p.razonSocial}${p.telefono ? ` - Tel: ${p.telefono}` : ""}`,
    data: p,
  }));

  const insumosProveedorOptions = insumosProveedor.map((i) => ({
    value: i.id_insumo,
    label: `${i.nombreInsumo}${i.categoria ? ` (${i.categoria})` : ""}`,
    data: i,
  }));

  const agregarInsumoEdit = () => {
    if (!nuevoInsumoEdit.id_insumo || nuevoInsumoEdit.cantidad <= 0) {
      showInfo("Debe seleccionar un insumo y una cantidad válida");
      return;
    }
    if (
      editFormData.insumos.find(
        (it) => it.id_insumo === nuevoInsumoEdit.id_insumo
      )
    ) {
      showInfo("Este insumo ya está en la lista.", 4000);
      return;
    }
    const insumoData = insumosProveedor.find(
      (i) => i.id_insumo === nuevoInsumoEdit.id_insumo
    );
    
    // Validar que no exceda el stock máximo
    if (insumoData?.stockMaximo && nuevoInsumoEdit.cantidad > insumoData.stockMaximo) {
      showWarning(
        "Cantidad excedida",
        `La cantidad máxima permitida para este insumo es ${insumoData.stockMaximo} ${insumoData.unidadMedida || 'unidades'}`
      );
      return;
    }
    
    setEditFormData((prev) => ({
      ...prev,
      insumos: [
        ...prev.insumos,
        {
          ...nuevoInsumoEdit,
          nombreInsumo: insumoData?.nombreInsumo,
          unidadMedida: insumoData?.unidadMedida,
          cantidad: Number(nuevoInsumoEdit.cantidad),
        },
      ],
    }));
    setNuevoInsumoEdit({ id_insumo: "", cantidad: 1 });
  };

  const guardarEdicion = async () => {
    if (!editFormData.id_proveedor) {
      showInfo("Debe seleccionar un proveedor");
      return;
    }
    if (editFormData.insumos.length === 0) {
      showInfo("Debe agregar al menos un insumo");
      return;
    }
    setLoading(true);
    try {
      await pedidoService.update(pedidoEditando.id_pedido, {
        insumos: editFormData.insumos.map((it) => ({
          id_insumo: it.id_insumo,
          id_proveedor: editFormData.id_proveedor,
          cantidad: Number(it.cantidad),
        })),
        fechaEntregaEsperada: editFormData.fecha,
        observaciones: null,
        id_usuario: user?.idUsuario || user?.id_usuario,
      });
      showSuccess("Éxito", "Pedido actualizado exitosamente");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      showError("Error", "Error al actualizar el pedido: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── MODO CREACIÓN – flujo 3 pasos ────────────────────────────────────────
  // Paso 1: Lista de necesidades   → el usuario elige insumos + cantidades
  // Paso 2: Asignación de proveedores → matching automático + revisión manual
  // Paso 3: Confirmar y generar órdenes agrupadas por proveedor
  // ─────────────────────────────────────────────────────────────────────────
  const [paso, setPaso] = useState(1);
  const [fecha, setFecha] = useState(obtenerFechaActual());
  const [todosInsumos, setTodosInsumos] = useState([]);
  const [necesidades, setNecesidades] = useState([]); // { id_insumo, nombreInsumo, unidadMedida, categoria, cantidad }
  const [nuevaNecesidad, setNuevaNecesidad] = useState({
    id_insumo: "",
    cantidad: 1,
  });
  const [asignaciones, setAsignaciones] = useState([]); // { ...necesidad, proveedoresDisponibles, proveedorAsignado, asignacionAutomatica }
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!isEditMode && !authLoading && isAuthenticated) cargarTodosInsumos();
  }, [isEditMode, authLoading, isAuthenticated]);

  const cargarTodosInsumos = async () => {
    try {
      setLoading(true);
      setTodosInsumos(await insumoService.getActivos());
    } catch (error) {
      showError("Error", "Error al cargar insumos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // IDs ya en la lista para excluirlos del selector
  const idsEnLista = useMemo(
    () => new Set(necesidades.map((n) => n.id_insumo)),
    [necesidades]
  );

  const insumosNecesidadOptions = useMemo(
    () =>
      todosInsumos
        .filter((i) => !idsEnLista.has(i.idInsumo ?? i.id_insumo))
        .map((i) => ({
          value: i.idInsumo ?? i.id_insumo,
          label: `${i.nombreInsumo}${
            i.categoria ? ` (${i.categoria})` : ""
          }`,
          data: i,
        })),
    [todosInsumos, idsEnLista]
  );

  const agregarNecesidad = () => {
    if (!nuevaNecesidad.id_insumo || nuevaNecesidad.cantidad <= 0) {
      showInfo("Debe seleccionar un insumo y una cantidad válida");
      return;
    }
    const insumoData = todosInsumos.find(
      (i) => (i.idInsumo ?? i.id_insumo) === nuevaNecesidad.id_insumo
    );
    
    // Validar que no exceda el stock máximo
    if (insumoData?.stockMaximo && nuevaNecesidad.cantidad > insumoData.stockMaximo) {
      showWarning(
        "Cantidad excedida",
        `La cantidad máxima permitida para este insumo es ${insumoData.stockMaximo} ${insumoData.unidadMedida || 'unidades'}`
      );
      return;
    }
    
    setNecesidades((prev) => [
      ...prev,
      {
        id_insumo: nuevaNecesidad.id_insumo,
        nombreInsumo: insumoData?.nombreInsumo,
        unidadMedida: insumoData?.unidadMedida,
        categoria: insumoData?.categoria,
        cantidad: Number(nuevaNecesidad.cantidad),
      },
    ]);
    setNuevaNecesidad({ id_insumo: "", cantidad: 1 });
  };

  const eliminarNecesidad = (id_insumo) =>
    setNecesidades((prev) => prev.filter((n) => n.id_insumo !== id_insumo));

  const actualizarCantidadNecesidad = (id_insumo, cant) => {
    if (cant <= 0) return;
    setNecesidades((prev) =>
      prev.map((n) =>
        n.id_insumo === id_insumo ? { ...n, cantidad: Number(cant) } : n
      )
    );
  };

  const importarFaltantesStock = async () => {
    try {
      setLoading(true);
      const faltantes = await inventarioService.obtenerInventariosBajoStock();
      if (!faltantes || faltantes.length === 0) {
        showInfo("No se encontraron insumos con faltante de stock.");
        return;
      }
      let importados = 0;
      setNecesidades((prev) => {
        const nuevo = [...prev];
        for (const item of faltantes) {
          if (!item.id_insumo) continue;
          if (nuevo.find((n) => n.id_insumo === item.id_insumo)) continue;
          const cantidadFaltante = Math.max(
            1,
            Math.ceil(
              (item.nivelMinimoAlerta || 0) - (item.cantidadActual || 0)
            )
          );
          nuevo.push({
            id_insumo: item.id_insumo,
            nombreInsumo: item.nombreInsumo,
            unidadMedida: item.unidadMedida,
            categoria: item.categoria,
            cantidad: cantidadFaltante,
          });
          importados++;
        }
        return nuevo;
      });
      if (importados > 0)
        showSuccess(
          "Importado",
          `Se importaron ${importados} insumos con faltante de stock.`
        );
      else showInfo("Todos los insumos del faltante ya están en la lista.");
    } catch {
      showError("Error", "No se pudo importar el faltante de stock.");
    } finally {
      setLoading(false);
    }
  };

  // Paso 1 → 2: matching automático por calidad
  const realizarMatching = async () => {
    if (necesidades.length === 0) {
      showInfo("Agregue al menos un insumo antes de continuar.");
      return;
    }
    setProcesando(true);
    try {
      const resultados = [];
      for (const nec of necesidades) {
        try {
          const raw = await proveedorInsumoService.getProveedoresByInsumo(
            nec.id_insumo
          );
          // La BD ya devuelve los proveedores ordenados por calidad (Excelente → Bueno → Regular → Malo)
          const activos = (raw || []).filter(
            (p) =>
              p.estadoProveedor?.toLowerCase() === "activo" &&
              p.estadoRelacion?.toLowerCase() === "activo"
          );
          resultados.push({
            ...nec,
            proveedoresDisponibles: activos,
            proveedorAsignado: activos.length > 0 ? activos[0] : null,
            asignacionAutomatica: activos.length >= 1,
          });
        } catch {
          resultados.push({
            ...nec,
            proveedoresDisponibles: [],
            proveedorAsignado: null,
            asignacionAutomatica: false,
          });
        }
      }
      setAsignaciones(resultados);
      setPaso(2);
    } finally {
      setProcesando(false);
    }
  };

  const cambiarProveedorAsignado = (id_insumo, proveedor) =>
    setAsignaciones((prev) =>
      prev.map((a) =>
        a.id_insumo === id_insumo
          ? { ...a, proveedorAsignado: proveedor, asignacionAutomatica: false }
          : a
      )
    );

  const sinProveedor = asignaciones.filter((a) => !a.proveedorAsignado);

  const ordenesPorProveedor = useMemo(() => {
    const map = new Map();
    for (const a of asignaciones) {
      if (!a.proveedorAsignado) continue;
      const pid = a.proveedorAsignado.id_proveedor;
      if (!map.has(pid))
        map.set(pid, { proveedor: a.proveedorAsignado, insumos: [] });
      map.get(pid).insumos.push(a);
    }
    return Array.from(map.values());
  }, [asignaciones]);

  const generarOrdenes = async () => {
    const conProveedor = asignaciones.filter((a) => a.proveedorAsignado);
    if (conProveedor.length === 0) {
      showInfo(
        "Ningún insumo tiene proveedor asignado. Asigne proveedores antes de continuar."
      );
      return;
    }
    if (sinProveedor.length > 0) {
      const confirmado = await showConfirm(
        "Insumos sin proveedor",
        `${sinProveedor.length} insumo(s) no tienen proveedor asignado y serán excluidos. ¿Continuar de todas formas?`
      );
      if (!confirmado) return;
    }
    setLoading(true);
    try {
      await pedidoService.crearPedidoManual({
        insumos: conProveedor.map((a) => ({
          id_insumo: a.id_insumo,
          id_proveedor: a.proveedorAsignado.id_proveedor,
          cantidad: Number(a.cantidad),
        })),
        fechaEntregaEsperada: fecha,
        observaciones: null,
        id_usuario: user?.idUsuario || user?.id_usuario,
      });
      showSuccess(
        "Éxito",
        `Se generaron ${ordenesPorProveedor.length} orden(es) de pedido exitosamente.`
      );
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      showError("Error", "Error al generar las órdenes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER – Modo Edición ────────────────────────────────────────────────
  if (isEditMode) {
    const proveedorSeleccionado = proveedoresDisponibles.find(
      (p) => p.idProveedor === editFormData.id_proveedor
    );
    return (
      <div className="card shadow-sm">
        <div className="card-header text-dark">
          <h5 className="mb-0">
            <i className="fas fa-edit me-2"></i>Editar Pedido Manual
          </h5>
          <small>Actualiza los datos del pedido</small>
        </div>
        <div className="card-body bg-white">
          {loading && (
            <div className="d-flex justify-content-center mb-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          )}
          {/* Fecha */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">
                <i className="fas fa-calendar me-1"></i>Fecha del Pedido
              </label>
              <input
                type="date"
                className="form-control"
                value={editFormData.fecha}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, fecha: e.target.value }))
                }
              />
            </div>
          </div>
          {/* Proveedor */}
          <div className="mb-3">
            <label className="form-label">
              <i className="fas fa-truck me-1"></i>Proveedor
            </label>
            <input
              type="text"
              className="form-control"
              value={proveedorSeleccionado?.razonSocial || "Sin proveedor"}
              disabled
              readOnly
            />
            <small className="text-muted d-block mt-1">
              <i className="fas fa-lock me-1"></i>El proveedor está bloqueado. No se puede modificar en la edición.
            </small>
          </div>
          {/* Agregar insumo */}
          {editFormData.id_proveedor && (
            <div className="card mb-4 border-light">
              <div className="card-header text-dark">
                <h6 className="mb-0">
                  <i className="fas fa-plus me-1 text-primary"></i>Agregar
                  Insumo
                </h6>
              </div>
              <div className="card-body bg-white">
                <div className="row g-2 align-items-end">
                  <div className="col-md-7">
                    <label className="form-label fw-bold">Insumo *</label>
                    <Select
                      options={insumosProveedorOptions}
                      value={
                        insumosProveedorOptions.find(
                          (o) => o.value === nuevoInsumoEdit.id_insumo
                        ) || null
                      }
                      onChange={(opt) =>
                        setNuevoInsumoEdit((prev) => ({
                          ...prev,
                          id_insumo: opt ? opt.value : "",
                        }))
                      }
                      placeholder="🔍 Buscar insumo..."
                      isSearchable
                      isClearable
                      noOptionsMessage={() =>
                        "No hay insumos para este proveedor"
                      }
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Cantidad *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={nuevoInsumoEdit.cantidad}
                      onChange={(e) =>
                        setNuevoInsumoEdit((prev) => ({
                          ...prev,
                          cantidad: e.target.value,
                        }))
                      }
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={agregarInsumoEdit}
                      disabled={!nuevoInsumoEdit.id_insumo}
                    >
                      <i className="fas fa-plus-circle"></i> Agregar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Tabla insumos */}
          {editFormData.insumos.length > 0 && (
            <div className="card mb-4 border-light">
              <div className="card-header bg-light text-dark">
                <h6 className="mb-0">
                  <i className="fas fa-list-check me-1"></i>Insumos en el
                  Pedido ({editFormData.insumos.length})
                </h6>
              </div>
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Insumo</th>
                      <th >Cantidad</th>
                      <th className="text-center">Unidad</th>
                      <th className="text-center" width="80">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {editFormData.insumos.map((item) => (
                      <tr key={item.id_insumo} className="align-middle">
                        <td className="fw-medium">{item.nombreInsumo}</td>
                        <td className="text-center">
                          <input
                            type="number"
                            className="form-control form-control-sm text-center"
                            value={item.cantidad}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                insumos: prev.insumos.map((it) =>
                                  it.id_insumo === item.id_insumo
                                    ? {
                                        ...it,
                                        cantidad: Number(e.target.value),
                                      }
                                    : it
                                ),
                              }))
                            }
                            min="1"
                            style={{ width: "100px"}}
                          />
                        </td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark">
                            {item.unidadMedida || "un."}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              setEditFormData((prev) => ({
                                ...prev,
                                insumos: prev.insumos.filter(
                                  (it) => it.id_insumo !== item.id_insumo
                                ),
                              }))
                            }
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
          )}
          {/* Resumen */}
          {editFormData.id_proveedor && editFormData.insumos.length > 0 && (
            <div className="alert alert-success mb-4">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-check-circle text-success me-2 fs-5"></i>
                <h6 className="mb-0 fw-bold">Resumen del Pedido: &nbsp;&nbsp;</h6>
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <small className="text-muted d-block">Fecha de entrega</small>
                  <strong>{formatearFecha(editFormData.fecha)}</strong>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block">Proveedor</small>
                  <strong>{proveedorSeleccionado?.razonSocial}</strong>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block">Total de insumos</small>
                  <strong>
                    {editFormData.insumos.length} item
                    {editFormData.insumos.length !== 1 ? "s" : ""}
                  </strong>
                </div>
              </div>
            </div>
          )}
          {/* Acciones */}
          <div className="d-flex gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              <i className="fas fa-times me-1"></i>Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={guardarEdicion}
              disabled={
                loading ||
                !editFormData.id_proveedor ||
                editFormData.insumos.length === 0
              }
            >
              {loading ? (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
              ) : (
                <i className="fas fa-save me-1"></i>
              )}
              Actualizar Pedido ({editFormData.insumos.length} insumo
              {editFormData.insumos.length !== 1 ? "s" : ""})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER – Modo Creación (wizard 3 pasos) ──────────────────────────────
  return (
    <div className="card shadow-sm">
      {/* Header con indicador de pasos */}
      <div className="card-header text-dark">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-plus-circle me-2"></i>Nueva Orden de Pedido
          </h5>
          <div className="d-flex gap-2">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`badge rounded-pill fs-6 ${
                  paso === n
                    ? "bg-primary"
                    : paso > n
                    ? "bg-success"
                    : "bg-secondary opacity-50"
                }`}
              >
                {paso > n ? <i className="fas fa-check"></i> : n}
              </span>
            ))}
          </div>
        </div>
        <small className="text-muted">
          {paso === 1 && "Paso 1 de 3 — Define la lista de necesidades"}
          {paso === 2 && "Paso 2 de 3 — Revisión y asignación de proveedores"}
          {paso === 3 && "Paso 3 de 3 — Confirmar y generar órdenes de pedido"}
        </small>
      </div>

      <div className="card-body bg-white">
        {(loading || procesando) && (
          <div className="d-flex justify-content-center align-items-center mb-3 gap-2">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            {procesando && (
              <span className="text-primary fw-bold">
                Buscando proveedores para cada insumo…
              </span>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            PASO 1: Lista de necesidades
            ════════════════════════════════ */}
        {paso === 1 && (
          <>
            {/* Fecha */}
            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <i className="fas fa-calendar me-1"></i>Fecha de entrega
                  esperada
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            {/* Formulario agregar insumo */}
            <div className="card mb-4 border-primary border-opacity-25">
              <div className="card-header bg-primary bg-opacity-10 text-dark">
                <h6 className="mb-0">
                  <i className="fas fa-box me-1 text-primary"></i>Agregar
                  insumo a la lista
                </h6>
                <small className="text-muted">
                  Selecciona el insumo que necesitas y la cantidad requerida
                </small>
              </div>
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label fw-bold">Insumo *</label>
                    <Select
                      options={insumosNecesidadOptions}
                      value={
                        insumosNecesidadOptions.find(
                          (o) => o.value === nuevaNecesidad.id_insumo
                        ) || null
                      }
                      onChange={(opt) =>
                        setNuevaNecesidad((prev) => ({
                          ...prev,
                          id_insumo: opt ? opt.value : "",
                        }))
                      }
                      placeholder="🔍 Buscar insumo por nombre o categoría..."
                      isSearchable
                      isClearable
                      noOptionsMessage={() => "No se encontraron insumos"}
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Unidad de Medida</label>
                    <input
                      type="text"
                      className="form-control"
                      value={todosInsumos.find(
                        (i) =>
                          (i.idInsumo ?? i.id_insumo) === nuevaNecesidad.id_insumo
                      )?.unidadMedida || ""}
                      disabled={true}
                    />

                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-bold">Cantidad *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={nuevaNecesidad.cantidad}
                      onChange={(e) =>
                        setNuevaNecesidad((prev) => ({
                          ...prev,
                          cantidad: e.target.value,
                        }))
                      }
                      min="0.001"
                      step="0.001"
                      placeholder="0.000"
                    />
                  </div>
                  <div className="col-md-3">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={agregarNecesidad}
                      disabled={
                        !nuevaNecesidad.id_insumo || !nuevaNecesidad.cantidad
                      }
                    >
                      <i className="fas fa-plus-circle me-1"></i>Agregar
                    </button>
                  </div>
                </div>
                {/* Importar faltante */}
                <div className="mt-3 border-top pt-3">
                  <button
                    type="button"
                    className="btn btn-outline-warning btn-sm"
                    onClick={importarFaltantesStock}
                    disabled={loading}
                  >
                    <i className="fas fa-file-import me-1"></i>Importar insumos
                    con faltante de stock
                  </button>
                  <small className="text-muted ms-2">
                    Carga automáticamente los insumos cuyo stock está por debajo
                    del mínimo
                  </small>
                </div>
              </div>
            </div>

            {/* Lista de necesidades */}
            {necesidades.length === 0 ? (
              <div className="alert alert-info border-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Tu lista está vacía.</strong> Agrega los insumos que
                necesitas pedir, o importa el faltante de stock
                automáticamente.
              </div>
            ) : (
              <div className="card mb-4 border-light">
                <div className="card-header bg-light text-dark d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="fas fa-list-check me-1"></i>Lista de
                    necesidades ({necesidades.length} insumo
                    {necesidades.length !== 1 ? "s" : ""})
                  </h6>
                  <span className="badge bg-primary">{necesidades.length}</span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Insumo</th>
                          <th>Categoría</th>
                          <th className="text-center">Cantidad</th>
                          <th className="text-center">Unidad</th>
                          <th className="text-center" width="80">
                            Eliminar
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {necesidades.map((nec) => (
                          <tr key={nec.id_insumo} className="align-middle">
                            <td className="fw-medium">{nec.nombreInsumo}</td>
                            <td>
                              {nec.categoria && (
                                <span className="badge bg-secondary bg-opacity-25 text-dark">
                                  {nec.categoria}
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <input
                                type="number"
                                className="form-control form-control-sm text-center fw-bold"
                                value={nec.cantidad}
                                onChange={(e) =>
                                  actualizarCantidadNecesidad(
                                    nec.id_insumo,
                                    e.target.value
                                  )
                                }
                                min="0.001"
                                step="0.001"
                                style={{ width: "80px", margin: "0 auto" }}
                              />
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark">
                                {nec.unidadMedida || "unidad(es)"}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => eliminarNecesidad(nec.id_insumo)}
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

            {/* Acciones paso 1 */}
            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                <i className="fas fa-times me-1"></i>Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={realizarMatching}
                disabled={necesidades.length === 0 || procesando}
              >
                {procesando ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                ) : (
                  <i className="fas fa-search me-1"></i>
                )}
                Buscar Proveedores →
              </button>
            </div>
          </>
        )}

        {/* ════════════════════════════════
            PASO 2: Asignación de proveedores
            ════════════════════════════════ */}
        {paso === 2 && (
          <>
            {sinProveedor.length > 0 && (
              <div className="alert alert-warning mb-4">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>
                  {sinProveedor.length} insumo(s) sin proveedor:
                </strong>{" "}
                {sinProveedor.map((a) => a.nombreInsumo).join(", ")}. Estos no
                podrán incluirse en ninguna orden por no tener proveedores
                registrados en el sistema.
              </div>
            )}

            <div className="card mb-4 border-light">
              <div className="card-header bg-light text-dark">
                <h6 className="mb-0">
                  <i className="fas fa-link me-1 text-primary"></i>Asignación
                  de Proveedores por Insumo
                </h6>
                <small className="text-muted">
                  El sistema asignó automáticamente el proveedor de mayor
                  calidad para cada insumo.
                </small>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Insumo</th>
                        <th className="text-center">Cantidad</th>
                        <th>Proveedor Asignado</th>
                        <th className="text-center">Calidad</th>
                        <th className="text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asignaciones.map((a) => (
                          <tr key={a.id_insumo} className="align-middle">
                            <td className="fw-medium">{a.nombreInsumo}</td>
                            <td className="text-center">
                              <span className="badge bg-secondary">
                                  {formatCantidad(a.cantidad, a.unidadMedida)} {a.unidadMedida || "un."}
                                </span>
                            </td>
                            <td>
                              {a.proveedorAsignado ? (
                                <span className="fw-medium">
                                  <i className="fas fa-truck text-success me-2"></i>
                                  {a.proveedorAsignado.razonSocial}
                                </span>
                              ) : (
                                <span className="text-danger fst-italic">
                                  <i className="fas fa-times-circle me-1"></i>
                                  Sin proveedor registrado
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              {a.proveedorAsignado ? (
                                <span
                                  className={`badge bg-${
                                    CALIFICACION_BADGE[
                                      a.proveedorAsignado.calificacion
                                    ] || "secondary"
                                  }`}
                                >
                                  {a.proveedorAsignado.calificacion || "—"}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="text-center">
                              {!a.proveedorAsignado ? (
                                <span className="badge bg-danger">
                                  Sin proveedor
                                </span>
                              ) : (
                                <span className="badge bg-success">
                                  <i className="fas fa-magic me-1"></i>Auto
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Acciones paso 2 */}
            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPaso(1)}
              >
                <i className="fas fa-arrow-left me-1"></i>Volver a la lista
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPaso(3)}
                disabled={
                  asignaciones.filter((a) => a.proveedorAsignado).length === 0
                }
              >
                Ver Resumen de Órdenes →
                <i className="fas fa-arrow-right ms-1"></i>
              </button>
            </div>
          </>
        )}

        {/* ════════════════════════════════
            PASO 3: Confirmación de órdenes
            ════════════════════════════════ */}
        {paso === 3 && (
          <>
            <div className="alert alert-info mb-4">
              <i className="fas fa-info-circle me-2"></i>Se generará&nbsp;
              <strong>
                {ordenesPorProveedor.length} orden(es) de pedido
              </strong>
              , una por cada proveedor, para un total de&nbsp;
              <strong>
                {asignaciones.filter((a) => a.proveedorAsignado).length}
              </strong>&nbsp;
              insumo(s).
              {sinProveedor.length > 0 && (
                <span className="text-warning ms-2">
                  ({sinProveedor.length} insumo(s) excluido(s) por no tener
                  proveedor)
                </span>
              )}
            </div>

            {/* Tarjetas por proveedor */}
            <div className="row g-3 mb-4">
              {ordenesPorProveedor.map(({ proveedor, insumos }) => (
                <div key={proveedor.id_proveedor} className="col-12">
                  <div className="card border-success border-opacity-50">
                    <div className="card-header bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
                      <div>
                        <i className="fas fa-truck text-success me-2"></i>
                        <strong>{proveedor.razonSocial}</strong>
                        {proveedor.telefono && (
                          <small className="text-muted ms-2">
                            Tel: {proveedor.telefono}
                          </small>
                        )}
                      </div>
                      <span className="badge bg-success">
                        {insumos.length} insumo
                        {insumos.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="card-body p-0">
                      <table className="table table-sm mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Insumo</th>
                            <th className="text-center">Cantidad</th>
                            <th className="text-center">Unidad</th>
                            <th className="text-center">Calidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insumos.map((it) => (
                            <tr key={it.id_insumo}>
                              <td>{it.nombreInsumo}</td>
                              <td className="text-center fw-bold">
                                {formatCantidad(it.cantidad, it.unidadMedida)}
                              </td>
                              <td className="text-center">
                                <span className="badge bg-light text-dark">
                                  {it.unidadMedida || "un."}
                                </span>
                              </td>
                              <td className="text-center">
                                <span
                                  className={`badge bg-${
                                    CALIFICACION_BADGE[
                                      it.proveedorAsignado?.calificacion
                                    ] || "secondary"
                                  }`}
                                >
                                  {it.proveedorAsignado?.calificacion || "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Insumos excluidos */}
            {sinProveedor.length > 0 && (
              <div className="card border-warning border-opacity-50 mb-4">
                <div className="card-header bg-warning bg-opacity-10">
                  <i className="fas fa-exclamation-triangle text-warning me-1"></i>
                  <strong>Insumos excluidos (sin proveedor)</strong>
                </div>
                <div className="card-body p-0">
                  <table className="table table-sm mb-0">
                    <tbody>
                      {sinProveedor.map((a) => (
                        <tr key={a.id_insumo}>
                          <td>{a.nombreInsumo}</td>
                          <td className="text-center">
                            {formatCantidad(a.cantidad, a.unidadMedida)} {a.unidadMedida || "un."}
                          </td>
                          <td>
                            <small className="text-muted">
                              No tiene proveedores registrados en el sistema
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fecha de entrega */}
            <div className="alert alert-light border mb-4">
              <i className="fas fa-calendar text-primary me-2"></i>
              <strong>Fecha de entrega esperada:</strong>{" "}
              {formatearFecha(fecha)}
            </div>

            {/* Acciones paso 3 */}
            <div className="d-flex justify-content-between mt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPaso(2)}
                disabled={loading}
              >
                <i className="fas fa-arrow-left me-1"></i>Revisar asignaciones
              </button>
              <button
                type="button"
                className="btn btn-success btn-lg"
                onClick={generarOrdenes}
                disabled={loading || ordenesPorProveedor.length === 0}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                ) : (
                  <i className="fas fa-file-invoice me-1"></i>
                )}
                Generar {ordenesPorProveedor.length} Orden(es) de Pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PedidoFormSimple;



