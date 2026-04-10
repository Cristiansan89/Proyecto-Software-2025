import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import pedidoService from "../../services/pedidoService";
import { showError, showSuccess } from "../../utils/alertService";
import "../../styles/ProveedorPedidos.css";

const ProveedorPedidos = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");

  useEffect(() => {
    cargarPedidos();
  }, [user]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      if (user?.idProveedor) {
        const datos = await pedidoService.getByProveedor(user.idProveedor);
        setPedidos(Array.isArray(datos) ? datos : []);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      showError("Error al cargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = filtroEstado
    ? pedidos.filter((p) => p.id_estadoPedido === parseInt(filtroEstado))
    : pedidos;

  const estados = [
    { id: 1, nombre: "Pendiente", color: "pendiente" },
    { id: 2, nombre: "Aprobado", color: "aprobado" },
    { id: 3, nombre: "Entregado", color: "entregado" },
    { id: 4, nombre: "Cancelado", color: "cancelado" },
  ];

  return (
    <div className="proveedor-pedidos">
      <div className="header">
        <h1>Mis Pedidos</h1>
        <button className="btn-refrescar" onClick={cargarPedidos}>
          🔄 Refrescar
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros">
        <label>Filtrar por estado:</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos</option>
          {estados.map((est) => (
            <option key={est.id} value={est.id}>
              {est.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de pedidos */}
      {loading ? (
        <div className="loading">Cargando pedidos...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="sin-datos">
          <p>No hay pedidos para mostrar</p>
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Fecha Creación</th>
                <th>Fecha Entrega Esperada</th>
                <th>Estado</th>
                <th>Cantidad Insumos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id_pedido}>
                  <td className="id-pedido">#{pedido.id_pedido}</td>
                  <td>{(() => {
                    const fecha = pedido.fechaPedido;
                    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                      const [año, mes, día] = fecha.split('-').map(Number);
                      return new Date(año, mes - 1, día).toLocaleDateString();
                    }
                    return new Date(fecha).toLocaleDateString();
                  })()}</td>
                  <td>
                    {pedido.fechaEntregaEsperada
                      ? (() => {
                        const fecha = pedido.fechaEntregaEsperada;
                        if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                          const [año, mes, día] = fecha.split('-').map(Number);
                          return new Date(año, mes - 1, día).toLocaleDateString();
                        }
                        return new Date(fecha).toLocaleDateString();
                      })()
                      : "N/A"}
                  </td>
                  <td>
                    <span
                      className={`estado-badge estado-${pedido.id_estadoPedido}`}
                    >
                      {estados.find((e) => e.id === pedido.id_estadoPedido)
                        ?.nombre || "Desconocido"}
                    </span>
                  </td>
                  <td className="cantidad">{pedido.cantidadInsumos || 0}</td>
                  <td>
                    <button className="btn-ver-detalles">Ver detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProveedorPedidos;
