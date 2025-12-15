import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import CocineraInventario from "./CocineraInventario";
import CocineraMovimiento from "./CocineraMovimiento";
import API from "../../services/api";
import "../../styles/ControlInventario.css";

const ControlInventario = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventario");
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [inventarios, setInventarios] = useState([]);
  const [tiposMerma, setTiposMerma] = useState([]);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    id_insumo: "",
    tipoMovimiento: "Entrada",
    cantidadMovimiento: "",
    comentarioMovimiento: "",
    id_tipoMerma: "",
  });
  const [mensajeNotificacion, setMensajeNotificacion] = useState(null);

  const tabs = [
    {
      id: "inventario",
      label: "Inventario",
      icon: "fas fa-warehouse",
      component: <CocineraInventario />,
    },
    {
      id: "movimientos",
      label: "Movimientos",
      icon: "fas fa-history",
      component: <CocineraMovimiento />,
    },
  ];

  const handleTabChange = (id) => setActiveTab(id);

  // Cargar inventarios y tipos de merma
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [inventariosRes, mermaRes] = await Promise.all([
        API.get("/inventarios"),
        API.get("/tipos-merma"),
      ]);
      setInventarios(inventariosRes.data || []);
      setTiposMerma(mermaRes.data || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const registrarMovimiento = async () => {
    try {
      if (
        !nuevoMovimiento.id_insumo ||
        !nuevoMovimiento.cantidadMovimiento ||
        (nuevoMovimiento.tipoMovimiento === "Merma" &&
          !nuevoMovimiento.id_tipoMerma)
      ) {
        setMensajeNotificacion({
          tipo: "warning",
          texto: "Por favor completa los campos requeridos",
        });
        return;
      }

      const payload = {
        id_insumo: nuevoMovimiento.id_insumo,
        tipoMovimiento: nuevoMovimiento.tipoMovimiento,
        cantidadMovimiento: parseFloat(nuevoMovimiento.cantidadMovimiento),
        comentarioMovimiento: nuevoMovimiento.comentarioMovimiento,
        id_usuario: user?.id_usuario || user?.idUsuario,
      };

      if (nuevoMovimiento.tipoMovimiento === "Merma") {
        payload.id_tipoMerma = nuevoMovimiento.id_tipoMerma;
      }

      const response = await API.post("/movimientos-inventarios", payload);

      if (response.data.success || response.status === 201) {
        setMensajeNotificacion({
          tipo: "success",
          texto: `✅ ${nuevoMovimiento.tipoMovimiento} registrada exitosamente`,
        });

        // Limpiar formulario
        setNuevoMovimiento({
          id_insumo: "",
          tipoMovimiento: "Entrada",
          cantidadMovimiento: "",
          comentarioMovimiento: "",
          id_tipoMerma: "",
        });

        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
          setModalMovimiento(false);
          cargarDatos();
        }, 1500);
      }
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      setMensajeNotificacion({
        tipo: "error",
        texto: `❌ Error: ${
          error.response?.data?.message || "No se pudo registrar el movimiento"
        }`,
      });
    }
  };

  // Verificación de autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Si no está autenticado, no renderizar
  if (!isAuthenticated) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="control-inventario">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-warehouse me-2"></i>
            Control de Inventario
          </h1>
          <p>Gestión completa de inventario y movimientos</p>
        </div>
        <div className="header-actions">
          <div className="btn-group">
            <button
              className="btn btn-success w-100"
              onClick={() => setModalMovimiento(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Movimiento Inventario
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Movimiento - Renderizado fuera del árbol del DOM */}
      {modalMovimiento &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="page-title text-white">
                  Registrar Movimiento de Inventario
                </h2>
                <button
                  className="modal-close text-white"
                  onClick={() => setModalMovimiento(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                {/* Notificación */}
                {mensajeNotificacion && (
                  <div
                    className={`alert alert-${mensajeNotificacion.tipo} alert-dismissible fade show mb-3`}
                    role="alert"
                  >
                    {mensajeNotificacion.texto}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setMensajeNotificacion(null)}
                    ></button>
                  </div>
                )}

                {/* Formulario */}
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Insumo *</strong>
                  </label>
                  <Select
                    options={inventarios.map((inv) => ({
                      value: inv.id_insumo,
                      label: `${inv.nombreInsumo} (${inv.unidadMedida})`,
                      data: inv,
                    }))}
                    value={
                      inventarios.length > 0
                        ? {
                            value: nuevoMovimiento.id_insumo,
                            label:
                              inventarios.find(
                                (inv) =>
                                  inv.id_insumo === nuevoMovimiento.id_insumo
                              )?.nombreInsumo || "Seleccionar...",
                          }
                        : null
                    }
                    onChange={(selectedOption) =>
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        id_insumo: selectedOption ? selectedOption.value : "",
                      })
                    }
                    placeholder="Buscar y seleccionar insumo..."
                    isSearchable
                    isClearable
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        borderColor: state.isFocused ? "#0d6efd" : "#ced4da",
                        boxShadow: state.isFocused
                          ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
                          : "none",
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
                    }}
                    formatOptionLabel={(option) => {
                      // Validar que option.data existe
                      if (!option.data) return option.label;
                      return (
                        <div>
                          <div style={{ fontWeight: "bold" }}>
                            {option.data.nombreInsumo}
                          </div>
                          <div
                            style={{
                              fontSize: "0.875rem",
                              color: "#6c757d",
                            }}
                          >
                            Unidad: {option.data.unidadMedida} | Stock:{" "}
                            {Math.round(
                              parseFloat(option.data.cantidadActual || 0)
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <strong>Tipo de Movimiento *</strong>
                    </label>
                    <select
                      className="form-select"
                      value={nuevoMovimiento.tipoMovimiento}
                      onChange={(e) =>
                        setNuevoMovimiento({
                          ...nuevoMovimiento,
                          tipoMovimiento: e.target.value,
                          id_tipoMerma: "",
                        })
                      }
                    >
                      <option value="Entrada">↗️ Entrada</option>
                      <option value="Salida">↙️ Salida</option>
                      <option value="Merma">🗑️ Merma</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <strong>Cantidad *</strong>
                    </label>
                    <div className="row">
                      <div className="col-md-5">
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: "100%" }}
                          value={nuevoMovimiento.cantidadMovimiento}
                          onChange={(e) =>
                            setNuevoMovimiento((prev) => ({
                              ...prev,
                              cantidadMovimiento: e.target.value,
                            }))
                          }
                          min="0"
                          step="0.001"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-md-4">
                        <span
                          className="input-group-text"
                          style={{ width: "130px", fontSize: "18px" }}
                        >
                          <strong>
                            {inventarios.find(
                              (inv) =>
                                inv.id_insumo === nuevoMovimiento.id_insumo
                            )?.unidadMedida || "—"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {nuevoMovimiento.tipoMovimiento === "Merma" && (
                  <div className="mb-3">
                    <label className="form-label">
                      <strong>Tipo de Merma *</strong>
                    </label>
                    <Select
                      options={tiposMerma.map((tipo) => ({
                        value: tipo.id_tipoMerma || tipo.id_tipo_merma,
                        label: `${tipo.nombre} - ${tipo.descripcion}`,
                      }))}
                      value={
                        tiposMerma.length > 0 && nuevoMovimiento.id_tipoMerma
                          ? {
                              value: nuevoMovimiento.id_tipoMerma,
                              label:
                                tiposMerma.find(
                                  (tipo) =>
                                    (tipo.id_tipoMerma ||
                                      tipo.id_tipo_merma) ===
                                    nuevoMovimiento.id_tipoMerma
                                )?.nombre || "Seleccionar...",
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        setNuevoMovimiento({
                          ...nuevoMovimiento,
                          id_tipoMerma: selectedOption
                            ? selectedOption.value
                            : "",
                        })
                      }
                      placeholder="Buscar tipo de merma..."
                      isSearchable
                      isClearable
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          borderColor: state.isFocused ? "#0d6efd" : "#ced4da",
                          boxShadow: state.isFocused
                            ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
                            : "none",
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
                      }}
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    <strong>
                      {nuevoMovimiento.tipoMovimiento === "Entrada"
                        ? "Observaciones (proveedor, factura, etc.)"
                        : nuevoMovimiento.tipoMovimiento === "Salida"
                        ? "Observaciones (destino, receta, etc.)"
                        : "Descripción de la merma"}
                    </strong>
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
                  />
                </div>

                <div className="form-actions mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalMovimiento(false)}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={registrarMovimiento}
                    disabled={
                      !nuevoMovimiento.id_insumo ||
                      !nuevoMovimiento.cantidadMovimiento ||
                      (nuevoMovimiento.tipoMovimiento === "Merma" &&
                        !nuevoMovimiento.id_tipoMerma)
                    }
                  >
                    <i className="fas fa-save me-2"></i>
                    Registrar {nuevoMovimiento.tipoMovimiento}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Pestañas de navegación */}
      <div className="navigation-tabs mb-4">
        <div className="tabs-header d-flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${
                activeTab === tab.id ? "active" : ""
              } btn`}
              onClick={() => handleTabChange(tab.id)}
            >
              <i className={`${tab.icon} me-1`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default ControlInventario;
