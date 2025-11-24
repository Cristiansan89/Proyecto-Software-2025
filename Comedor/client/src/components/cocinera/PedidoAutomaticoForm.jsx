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
      console.log("🚀 Generando pedidos automáticos...");

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
      console.error("❌ Error generando pedidos automáticos:", error);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-90vh overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Generación Automática de Pedidos
              </h2>
              <p className="text-sm text-gray-500">
                Basado en planificación de menús e inventario
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del proceso */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                ¿Cómo funciona?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Analiza la planificación de menús del período</li>
                <li>• Calcula insumos necesarios por recetas y comensales</li>
                <li>• Verifica stock actual en inventario</li>
                <li>• Identifica déficit y selecciona mejores proveedores</li>
                <li>• Crea pedidos agrupados automáticamente</li>
              </ul>
            </div>

            {/* Selección de fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio del Período
                </label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin del Período
                </label>
                <input
                  type="date"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Botón de fechas sugeridas */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={usarFechasSugeridas}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Usar próxima semana</span>
              </button>
            </div>

            {/* Resultado del análisis */}
            {resultado && (
              <div
                className={`border rounded-lg p-4 ${
                  resultado.success && resultado.totalPedidosCreados > 0
                    ? "border-green-200 bg-green-50"
                    : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <h3 className="font-semibold mb-3 flex items-center">
                  {resultado.success && resultado.totalPedidosCreados > 0 ? (
                    <>
                      <svg
                        className="w-5 h-5 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-green-900">
                        Pedidos Generados Exitosamente
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-yellow-900">
                        Información del Análisis
                      </span>
                    </>
                  )}
                </h3>

                <p className="text-sm text-gray-700 mb-3">
                  {resultado.message}
                </p>

                {resultado.analisis && (
                  <div className="text-xs space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <span>
                        <strong>Período:</strong>{" "}
                        {resultado.analisis.periodoPlanificacion}
                      </span>
                      <span>
                        <strong>Total Menús:</strong>{" "}
                        {resultado.analisis.totalMenus || 0}
                      </span>
                      <span>
                        <strong>Insumos Analizados:</strong>{" "}
                        {resultado.analisis.insumosAnalizados || 0}
                      </span>
                      <span>
                        <strong>Proveedores:</strong>{" "}
                        {resultado.analisis.proveedoresInvolucrados || 0}
                      </span>
                    </div>
                    {resultado.analisis.fechaEntregaSugerida && (
                      <div>
                        <strong>Entrega Sugerida:</strong>{" "}
                        {resultado.analisis.fechaEntregaSugerida}
                      </div>
                    )}
                  </div>
                )}

                {resultado.pedidos && resultado.pedidos.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold mb-2">
                      Pedidos Creados:
                    </h4>
                    <div className="space-y-2">
                      {resultado.pedidos.map((pedido, index) => (
                        <div
                          key={index}
                          className="text-xs bg-white bg-opacity-50 p-2 rounded"
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
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={loading}
              >
                {resultado ? "Cerrar" : "Cancelar"}
              </button>

              {!resultado && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Generar Pedidos</span>
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
