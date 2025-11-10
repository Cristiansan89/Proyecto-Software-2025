import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import '../../styles/CocineraInventario.css';

const CocineraInventario = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [inventarios, setInventarios] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [filtros, setFiltros] = useState({
        categoria: '',
        estado: '',
        busqueda: ''
    });
    const [modalMovimiento, setModalMovimiento] = useState(false);
    const [nuevoMovimiento, setNuevoMovimiento] = useState({
        id_insumo: '',
        tipo_movimiento: 'entrada',
        cantidad: '',
        observaciones: '',
        fecha: new Date().toISOString().split('T')[0]
    });
    const [alertasInventario, setAlertasInventario] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            const [inventariosRes, insumosRes, movimientosRes] = await Promise.all([
                API.get('/inventarios'),
                API.get('/insumos'),
                API.get('/movimientos-inventarios')
            ]);

            const inventariosData = inventariosRes.data || [];
            const insumosData = insumosRes.data || [];
            const movimientosData = movimientosRes.data || [];

            setInventarios(inventariosData);
            setInsumos(insumosData);
            setMovimientos(movimientosData);

            // Generar alertas de stock bajo
            generarAlertas(inventariosData, insumosData);

        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const generarAlertas = (inventariosData, insumosData) => {
        const alertas = [];

        inventariosData.forEach(inv => {
            const insumo = insumosData.find(ins => ins.id_insumo === inv.id_insumo);
            if (insumo) {
                const porcentajeStock = (inv.cantidad_actual / inv.cantidad_maxima) * 100;

                if (porcentajeStock <= 10) {
                    alertas.push({
                        tipo: 'critico',
                        insumo: insumo.nombre,
                        cantidad: inv.cantidad_actual,
                        unidad: insumo.unidad_medida,
                        porcentaje: porcentajeStock
                    });
                } else if (porcentajeStock <= 25) {
                    alertas.push({
                        tipo: 'bajo',
                        insumo: insumo.nombre,
                        cantidad: inv.cantidad_actual,
                        unidad: insumo.unidad_medida,
                        porcentaje: porcentajeStock
                    });
                }
            }
        });

        setAlertasInventario(alertas);
    };

    const obtenerInventarioFiltrado = () => {
        return inventarios.filter(inv => {
            const insumo = insumos.find(ins => ins.id_insumo === inv.id_insumo);
            if (!insumo) return false;

            const matchBusqueda = !filtros.busqueda ||
                insumo.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase());

            const matchCategoria = !filtros.categoria || insumo.categoria === filtros.categoria;

            const porcentajeStock = (inv.cantidad_actual / inv.cantidad_maxima) * 100;
            let matchEstado = true;

            if (filtros.estado === 'critico') {
                matchEstado = porcentajeStock <= 10;
            } else if (filtros.estado === 'bajo') {
                matchEstado = porcentajeStock <= 25 && porcentajeStock > 10;
            } else if (filtros.estado === 'normal') {
                matchEstado = porcentajeStock > 25;
            }

            return matchBusqueda && matchCategoria && matchEstado;
        });
    };

    const obtenerCategorias = () => {
        const cats = [...new Set(insumos.map(ins => ins.categoria))].filter(Boolean);
        return cats;
    };

    const obtenerEstadoStock = (inventario) => {
        const porcentaje = (inventario.cantidad_actual / inventario.cantidad_maxima) * 100;

        if (porcentaje <= 10) return { estado: 'critico', color: 'danger', texto: 'Crítico' };
        if (porcentaje <= 25) return { estado: 'bajo', color: 'warning', texto: 'Bajo' };
        if (porcentaje <= 50) return { estado: 'medio', color: 'info', texto: 'Medio' };
        return { estado: 'bueno', color: 'success', texto: 'Bueno' };
    };

    const registrarMovimiento = async () => {
        try {
            if (!nuevoMovimiento.id_insumo || !nuevoMovimiento.cantidad) {
                alert('Complete los campos requeridos');
                return;
            }

            setLoading(true);

            const movimientoData = {
                ...nuevoMovimiento,
                cantidad: parseFloat(nuevoMovimiento.cantidad),
                usuario_registro: user.idPersona || user.id_persona
            };

            await API.post('/movimientos-inventarios', movimientoData);

            setModalMovimiento(false);
            setNuevoMovimiento({
                id_insumo: '',
                tipo_movimiento: 'entrada',
                cantidad: '',
                observaciones: '',
                fecha: new Date().toISOString().split('T')[0]
            });

            await cargarDatos();
            alert('Movimiento registrado exitosamente');

        } catch (error) {
            console.error('Error al registrar movimiento:', error);
            alert('Error al registrar el movimiento');
        } finally {
            setLoading(false);
        }
    };

    const obtenerUltimosMovimientos = () => {
        return movimientos
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 10);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-3">Cargando inventario...</p>
            </div>
        );
    }

    const inventariosFiltrados = obtenerInventarioFiltrado();
    const categorias = obtenerCategorias();
    const ultimosMovimientos = obtenerUltimosMovimientos();

    return (
        <div className="cocinera-inventario">
            <div className="page-header">
                <h2>📦 Control de Inventario</h2>
                <p>Gestión de insumos y stock del comedor</p>
            </div>

            {/* Alertas de stock */}
            {alertasInventario.length > 0 && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-warning">
                            <div className="card-header bg-warning text-dark">
                                <h5 className="mb-0">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Alertas de Inventario
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    {alertasInventario.map((alerta, index) => (
                                        <div key={index} className="col-md-6 col-lg-4 mb-2">
                                            <div className={`alert alert-${alerta.tipo === 'critico' ? 'danger' : 'warning'} mb-0`}>
                                                <strong>{alerta.insumo}</strong>
                                                <br />
                                                <small>
                                                    {alerta.cantidad} {alerta.unidad}
                                                    ({alerta.porcentaje.toFixed(1)}% del stock)
                                                </small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                {/* Panel principal */}
                <div className="col-lg-8">
                    {/* Filtros */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="row align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label">Buscar insumo</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Nombre del insumo..."
                                        value={filtros.busqueda}
                                        onChange={(e) => setFiltros({
                                            ...filtros,
                                            busqueda: e.target.value
                                        })}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Categoría</label>
                                    <select
                                        className="form-select"
                                        value={filtros.categoria}
                                        onChange={(e) => setFiltros({
                                            ...filtros,
                                            categoria: e.target.value
                                        })}
                                    >
                                        <option value="">Todas las categorías</option>
                                        {categorias.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Estado de stock</label>
                                    <select
                                        className="form-select"
                                        value={filtros.estado}
                                        onChange={(e) => setFiltros({
                                            ...filtros,
                                            estado: e.target.value
                                        })}
                                    >
                                        <option value="">Todos los estados</option>
                                        <option value="critico">Stock Crítico</option>
                                        <option value="bajo">Stock Bajo</option>
                                        <option value="normal">Stock Normal</option>
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <button
                                        className="btn btn-success w-100"
                                        onClick={() => setModalMovimiento(true)}
                                    >
                                        <i className="fas fa-plus me-2"></i>
                                        Movimiento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de inventario */}
                    <div className="card">
                        <div className="card-header">
                            <h4>📋 Inventario Actual</h4>
                            <span className="badge bg-info">
                                {inventariosFiltrados.length} de {inventarios.length} insumos
                            </span>
                        </div>
                        <div className="card-body">
                            {inventariosFiltrados.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="fas fa-search fa-2x text-muted mb-3"></i>
                                    <p className="text-muted">No se encontraron insumos con los filtros aplicados</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Insumo</th>
                                                <th>Categoría</th>
                                                <th>Stock Actual</th>
                                                <th>Stock Máximo</th>
                                                <th>Estado</th>
                                                <th>Última Actualización</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventariosFiltrados.map(inventario => {
                                                const insumo = insumos.find(ins => ins.id_insumo === inventario.id_insumo);
                                                const estadoStock = obtenerEstadoStock(inventario);
                                                const porcentaje = (inventario.cantidad_actual / inventario.cantidad_maxima) * 100;

                                                return (
                                                    <tr key={inventario.id_inventario}>
                                                        <td>
                                                            <div>
                                                                <strong>{insumo?.nombre || 'Insumo no encontrado'}</strong>
                                                                {insumo?.descripcion && (
                                                                    <small className="text-muted d-block">
                                                                        {insumo.descripcion}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-secondary">
                                                                {insumo?.categoria || 'Sin categoría'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <strong>
                                                                {inventario.cantidad_actual} {insumo?.unidad_medida}
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            {inventario.cantidad_maxima} {insumo?.unidad_medida}
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <span className={`badge bg-${estadoStock.color}`}>
                                                                    {estadoStock.texto}
                                                                </span>
                                                                <div className="progress mt-1" style={{ height: '6px' }}>
                                                                    <div
                                                                        className={`progress-bar bg-${estadoStock.color}`}
                                                                        style={{ width: `${porcentaje}%` }}
                                                                    ></div>
                                                                </div>
                                                                <small className="text-muted">
                                                                    {porcentaje.toFixed(1)}%
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">
                                                                {new Date(inventario.fecha_actualizacion || inventario.updated_at).toLocaleDateString('es-ES')}
                                                            </small>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel lateral */}
                <div className="col-lg-4">
                    {/* Estadísticas rápidas */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h4>📊 Estadísticas</h4>
                        </div>
                        <div className="card-body">
                            <div className="stat-item">
                                <div className="stat-icon bg-primary">
                                    <i className="fas fa-boxes"></i>
                                </div>
                                <div className="stat-content">
                                    <h6>Total Insumos</h6>
                                    <h4>{inventarios.length}</h4>
                                </div>
                            </div>

                            <div className="stat-item">
                                <div className="stat-icon bg-danger">
                                    <i className="fas fa-exclamation-triangle"></i>
                                </div>
                                <div className="stat-content">
                                    <h6>Stock Crítico</h6>
                                    <h4>{alertasInventario.filter(a => a.tipo === 'critico').length}</h4>
                                </div>
                            </div>

                            <div className="stat-item">
                                <div className="stat-icon bg-warning">
                                    <i className="fas fa-minus-circle"></i>
                                </div>
                                <div className="stat-content">
                                    <h6>Stock Bajo</h6>
                                    <h4>{alertasInventario.filter(a => a.tipo === 'bajo').length}</h4>
                                </div>
                            </div>

                            <div className="stat-item">
                                <div className="stat-icon bg-info">
                                    <i className="fas fa-tags"></i>
                                </div>
                                <div className="stat-content">
                                    <h6>Categorías</h6>
                                    <h4>{categorias.length}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Últimos movimientos */}
                    <div className="card">
                        <div className="card-header">
                            <h4>🔄 Últimos Movimientos</h4>
                        </div>
                        <div className="card-body">
                            {ultimosMovimientos.length === 0 ? (
                                <p className="text-muted text-center">No hay movimientos recientes</p>
                            ) : (
                                <div className="movimientos-list">
                                    {ultimosMovimientos.map((mov, index) => {
                                        const insumo = insumos.find(ins => ins.id_insumo === mov.id_insumo);

                                        return (
                                            <div key={index} className="movimiento-item">
                                                <div className="movimiento-header">
                                                    <span className={`badge bg-${mov.tipo_movimiento === 'entrada' ? 'success' : 'danger'}`}>
                                                        {mov.tipo_movimiento === 'entrada' ? '↗️ Entrada' : '↙️ Salida'}
                                                    </span>
                                                    <small className="text-muted">
                                                        {new Date(mov.fecha).toLocaleDateString('es-ES')}
                                                    </small>
                                                </div>
                                                <div className="movimiento-content">
                                                    <strong>{insumo?.nombre || 'Insumo desconocido'}</strong>
                                                    <br />
                                                    <span>
                                                        {mov.cantidad} {insumo?.unidad_medida}
                                                    </span>
                                                    {mov.observaciones && (
                                                        <small className="text-muted d-block">
                                                            {mov.observaciones}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de nuevo movimiento */}
            {modalMovimiento && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Registrar Movimiento de Inventario</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalMovimiento(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Insumo *</label>
                                    <select
                                        className="form-select"
                                        value={nuevoMovimiento.id_insumo}
                                        onChange={(e) => setNuevoMovimiento({
                                            ...nuevoMovimiento,
                                            id_insumo: e.target.value
                                        })}
                                        required
                                    >
                                        <option value="">Seleccionar insumo</option>
                                        {insumos.map(insumo => (
                                            <option key={insumo.id_insumo} value={insumo.id_insumo}>
                                                {insumo.nombre} ({insumo.unidad_medida})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Tipo de movimiento</label>
                                        <select
                                            className="form-select"
                                            value={nuevoMovimiento.tipo_movimiento}
                                            onChange={(e) => setNuevoMovimiento({
                                                ...nuevoMovimiento,
                                                tipo_movimiento: e.target.value
                                            })}
                                        >
                                            <option value="entrada">Entrada</option>
                                            <option value="salida">Salida</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Cantidad *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={nuevoMovimiento.cantidad}
                                            onChange={(e) => setNuevoMovimiento({
                                                ...nuevoMovimiento,
                                                cantidad: e.target.value
                                            })}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Fecha</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={nuevoMovimiento.fecha}
                                        onChange={(e) => setNuevoMovimiento({
                                            ...nuevoMovimiento,
                                            fecha: e.target.value
                                        })}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Observaciones</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={nuevoMovimiento.observaciones}
                                        onChange={(e) => setNuevoMovimiento({
                                            ...nuevoMovimiento,
                                            observaciones: e.target.value
                                        })}
                                        placeholder="Motivo del movimiento, proveedor, etc..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalMovimiento(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={registrarMovimiento}
                                    disabled={!nuevoMovimiento.id_insumo || !nuevoMovimiento.cantidad}
                                >
                                    <i className="fas fa-save me-2"></i>
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CocineraInventario;
