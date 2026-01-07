import React, { useState } from "react";
import pedidoService from "../../services/pedidoService";

const PedidoAutomaticoForm = ({ onSuccess, onError, isVisible, onClose }) => {
  const [formData, setFormData] = useState({
    fechaInicio: "",
    fechaFin: "",
  });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Generar fechas sugeridas (próxima semana)
  const obtenerFechasSugeridas = () => {
    const hoy = new Date();
    const proximoLunes = new Date(hoy);
    proximoLunes.setDate(hoy.getDate() + ((1 - hoy.getDay() + 7) % 7) || 7);

    const proximoViernes = new Date(proximoLunes);
    proximoViernes.setDate(proximoLunes.getDate() + 4);

    return {
      inicio: proximoLunes.toISOString().split("T")[0],
      fin: proximoViernes.toISOString().split("T")[0],
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const usarFechasSugeridas = () => {
    const fechas = obtenerFechasSugeridas();
    setFormData({
      fechaInicio: fechas.inicio,
      fechaFin: fechas.fin,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fechaInicio || !formData.fechaFin) {
      onError?.("Por favor selecciona ambas fechas");
      return;
    }

    if (new Date(formData.fechaInicio) > new Date(formData.fechaFin)) {
      onError?.("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      //console.log("🚀 Generando pedidos automáticos...");

      const response = await pedidoService.generarAutomatico(
        formData.fechaInicio,
        formData.fechaFin
      );

      setResultado(response);

      if (response.success && response.totalPedidosCreados > 0) {
        onSuccess?.(response);
      } else {
        onError?.(response.message || "No fue necesario crear pedidos");
      }
    } catch (error) {
      //console.error("❌ Error generando pedidos automáticos:", error);
      onError?.(
        error.response?.data?.message || "Error al generar pedidos automáticos"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ fechaInicio: "", fechaFin: "" });
    setResultado(null);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "0",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <i className="fas fa-robot me-2"></i>
              Generación Automática de Pedidos
            </h5>
            <small className="text-muted">
              Basado en planificación de menús e inventario
            </small>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={handleClose}
          ></button>
        </div>

        {/* Body */}
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Información del proceso */}
            <div className="alert alert-info mb-4">
              <h6 className="alert-heading mb-2">
                <i className="fas fa-info-circle me-2"></i>¿Cómo funciona?
              </h6>
              <ul className="mb-0 ps-3">
                <li>Analiza la planificación de menús del período</li>
                <li>Calcula insumos necesarios por recetas y comensales</li>
                <li>Verifica stock actual en inventario</li>
                <li>Identifica déficit y selecciona mejores proveedores</li>
                <li>Crea pedidos agrupados automáticamente</li>
              </ul>
            </div>

            {/* Selección de fechas */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  <i className="fas fa-calendar-alt me-1"></i>
                  Fecha Inicio del Período
                </label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  <i className="fas fa-calendar-alt me-1"></i>
                  Fecha Fin del Período
                </label>
                <input
                  type="date"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
            </div>

            {/* Botón de fechas sugeridas */}
            <div className="text-center mb-3">
              <button
                type="button"
                onClick={usarFechasSugeridas}
                className="btn btn-outline-secondary btn-sm"
              >
                <i className="fas fa-calendar-check me-1"></i>
                Usar próxima semana
              </button>
            </div>

            {/* Resultado del análisis */}
            {resultado && (
              <div
                className={`alert ${
                  resultado.success && resultado.totalPedidosCreados > 0
                    ? "alert-success"
                    : "alert-warning"
                } mb-3`}
              >
                <h6 className="alert-heading">
                  {resultado.success && resultado.totalPedidosCreados > 0 ? (
                    <>
                      <i className="fas fa-check-circle me-2"></i>
                      Pedidos Generados Exitosamente
                    </>
                  ) : (
                    <>
                      <i className="fas fa-info-circle me-2"></i>
                      Información del Análisis
                    </>
                  )}
                </h6>

                <p className="mb-2">{resultado.message}</p>

                {resultado.analisis && (
                  <div className="small">
                    <div className="row">
                      <div className="col-sm-6">
                        <strong>Período:</strong>{" "}
                        {resultado.analisis.periodoPlanificacion}
                      </div>
                      <div className="col-sm-6">
                        <strong>Total Menús:</strong>{" "}
                        {resultado.analisis.totalMenus || 0}
                      </div>
                      <div className="col-sm-6">
                        <strong>Insumos Analizados:</strong>{" "}
                        {resultado.analisis.insumosAnalizados || 0}
                      </div>
                      <div className="col-sm-6">
                        <strong>Proveedores:</strong>{" "}
                        {resultado.analisis.proveedoresInvolucrados || 0}
                      </div>
                    </div>
                    {resultado.analisis.fechaEntregaSugerida && (
                      <div className="mt-2">
                        <strong>Entrega Sugerida:</strong>{" "}
                        {resultado.analisis.fechaEntregaSugerida}
                      </div>
                    )}
                  </div>
                )}

                {resultado.pedidos && resultado.pedidos.length > 0 && (
                  <div className="mt-3">
                    <h6 className="text-sm font-semibold mb-2">
                      Pedidos Creados:
                    </h6>
                    <div className="space-y-2">
                      {resultado.pedidos.map((pedido, index) => (
                        <div
                          key={index}
                          className="small bg-white p-2 rounded border"
                        >
                          <div>
                            <strong>Proveedor:</strong>{" "}
                            {pedido.resumenProveedor?.razonSocial || "N/A"}
                          </div>
                          <div>
                            <strong>Insumos:</strong>{" "}
                            {pedido.detalleInsumos?.length || 0} item(s)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="d-flex justify-content-end gap-2 pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                {resultado ? "Cerrar" : "Cancelar"}
              </button>

              {!resultado && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary ${loading ? "disabled" : ""}`}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Generando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cog me-1"></i>
                      Generar Pedidos
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PedidoAutomaticoForm;
