import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import '../../styles/CocineraMenu.css';

const CocineraMenu = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [servicios, setServicios] = useState([]);
    const [planificacionMenus, setPlanificacionMenus] = useState([]);
    const [recetas, setRecetas] = useState([]);
    const [semanaActual, setSemanaActual] = useState(new Date());
    const [vistaActual, setVistaActual] = useState('semana'); // 'semana' o 'mes'
    const [menuEditando, setMenuEditando] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, [semanaActual]);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            const [serviciosRes, planificacionRes, recetasRes] = await Promise.all([
                API.get('/servicios'),
                API.get('/planificacion-menus'),
                API.get('/recetas')
            ]);

            setServicios(serviciosRes.data?.filter(s => s.estado === 'Activo') || []);
            setPlanificacionMenus(planificacionRes.data || []);
            setRecetas(recetasRes.data?.filter(r => r.estado === 'Activo') || []);

        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const obtenerSemanaActual = () => {
        const inicio = new Date(semanaActual);
        inicio.setDate(inicio.getDate() - inicio.getDay() + 1); // Lunes

        const dias = [];
        for (let i = 0; i < 5; i++) { // Lunes a viernes
            const dia = new Date(inicio);
            dia.setDate(inicio.getDate() + i);
            dias.push(dia);
        }

        return dias;
    };

    const obtenerPlanificacionDelDia = (fecha, servicio) => {
        const fechaStr = fecha.toISOString().split('T')[0];
        return planificacionMenus.find(p =>
            p.fecha === fechaStr && p.id_servicio === servicio.id_servicio
        );
    };

    const abrirModalEdicion = (fecha, servicio) => {
        const fechaStr = fecha.toISOString().split('T')[0];
        const planificacionExistente = obtenerPlanificacionDelDia(fecha, servicio);

        setMenuEditando({
            fecha: fechaStr,
            id_servicio: servicio.id_servicio,
            servicio_nombre: servicio.nombre,
            id_receta: planificacionExistente?.id_receta || '',
            observaciones: planificacionExistente?.observaciones || '',
            porciones_estimadas: planificacionExistente?.porciones_estimadas || '',
            id_planificacion: planificacionExistente?.id_planificacion || null
        });

        setModalVisible(true);
    };

    const guardarMenu = async () => {
        try {
            setLoading(true);

            const datos = {
                fecha: menuEditando.fecha,
                id_servicio: menuEditando.id_servicio,
                id_receta: menuEditando.id_receta,
                observaciones: menuEditando.observaciones,
                porciones_estimadas: parseInt(menuEditando.porciones_estimadas) || 0,
                creado_por: user.idPersona || user.id_persona
            };

            if (menuEditando.id_planificacion) {
                // Actualizar existente
                await API.put(`/planificacion-menus/${menuEditando.id_planificacion}`, datos);
            } else {
                // Crear nuevo
                await API.post('/planificacion-menus', datos);
            }

            setModalVisible(false);
            setMenuEditando(null);
            await cargarDatos();

        } catch (error) {
            console.error('Error al guardar menú:', error);
            alert('Error al guardar el menú');
        } finally {
            setLoading(false);
        }
    };

    const eliminarMenu = async (idPlanificacion) => {
        if (!confirm('¿Está seguro de que desea eliminar esta planificación?')) {
            return;
        }

        try {
            setLoading(true);
            await API.delete(`/planificacion-menus/${idPlanificacion}`);
            await cargarDatos();
        } catch (error) {
            console.error('Error al eliminar menú:', error);
            alert('Error al eliminar el menú');
        } finally {
            setLoading(false);
        }
    };

    const cambiarSemana = (direccion) => {
        const nuevaFecha = new Date(semanaActual);
        nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7));
        setSemanaActual(nuevaFecha);
    };

    const obtenerReceta = (idReceta) => {
        return recetas.find(r => r.id_receta === idReceta);
    };

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const semana = obtenerSemanaActual();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-3">Cargando planificación de menús...</p>
            </div>
        );
    }

    return (
        <div className="cocinera-menu">
            <div className="page-header">
                <h2>🍽️ Planificación de Menús</h2>
                <p>Gestiona los menús semanales para el comedor escolar</p>
            </div>

            {/* Controles de navegación */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="week-navigation">
                                <button
                                    className="btn btn-outline-primary me-2"
                                    onClick={() => cambiarSemana(-1)}
                                >
                                    <i className="fas fa-chevron-left me-1"></i>
                                    Semana Anterior
                                </button>
                                <span className="current-week">
                                    Semana del {semana[0].toLocaleDateString('es-ES')} al {semana[4].toLocaleDateString('es-ES')}
                                </span>
                                <button
                                    className="btn btn-outline-primary ms-2"
                                    onClick={() => cambiarSemana(1)}
                                >
                                    Semana Siguiente
                                    <i className="fas fa-chevron-right ms-1"></i>
                                </button>
                            </div>
                        </div>
                        <div className="col-md-6 text-end">
                            <button
                                className="btn btn-primary"
                                onClick={() => setSemanaActual(new Date())}
                            >
                                <i className="fas fa-calendar-day me-2"></i>
                                Semana Actual
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Planilla de menús semanal */}
            <div className="card">
                <div className="card-header">
                    <h4>📋 Planilla Semanal de Menús</h4>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-bordered menu-planning-table">
                            <thead className="table-light">
                                <tr>
                                    <th width="15%">Servicio</th>
                                    {diasSemana.map((dia, index) => (
                                        <th key={dia} width="17%" className="text-center">
                                            <div className="dia-header">
                                                <div className="dia-nombre">{dia}</div>
                                                <div className="dia-fecha">
                                                    {semana[index].toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {servicios.map(servicio => (
                                    <tr key={servicio.id_servicio}>
                                        <td className="servicio-cell">
                                            <div className="servicio-info">
                                                <strong>{servicio.nombre}</strong>
                                                <small className="text-muted d-block">
                                                    {servicio.descripcion}
                                                </small>
                                            </div>
                                        </td>
                                        {semana.map((fecha, diaIndex) => {
                                            const planificacion = obtenerPlanificacionDelDia(fecha, servicio);
                                            const receta = planificacion ? obtenerReceta(planificacion.id_receta) : null;

                                            return (
                                                <td key={diaIndex} className="menu-cell">
                                                    {planificacion && receta ? (
                                                        <div className="menu-planificado">
                                                            <div className="receta-nombre">
                                                                <strong>{receta.nombre}</strong>
                                                            </div>
                                                            <div className="receta-info">
                                                                <small className="text-muted">
                                                                    <i className="fas fa-users me-1"></i>
                                                                    {planificacion.porciones_estimadas} porciones
                                                                </small>
                                                            </div>
                                                            {planificacion.observaciones && (
                                                                <div className="observaciones">
                                                                    <small className="text-info">
                                                                        <i className="fas fa-sticky-note me-1"></i>
                                                                        {planificacion.observaciones}
                                                                    </small>
                                                                </div>
                                                            )}
                                                            <div className="menu-acciones mt-2">
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary me-1"
                                                                    onClick={() => abrirModalEdicion(fecha, servicio)}
                                                                    title="Editar"
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => eliminarMenu(planificacion.id_planificacion)}
                                                                    title="Eliminar"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="menu-vacio">
                                                            <button
                                                                className="btn btn-outline-success btn-sm w-100"
                                                                onClick={() => abrirModalEdicion(fecha, servicio)}
                                                            >
                                                                <i className="fas fa-plus me-2"></i>
                                                                Agregar Menú
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de edición de menú */}
            {modalVisible && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {menuEditando.id_planificacion ? 'Editar' : 'Agregar'} Menú
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setModalVisible(false);
                                        setMenuEditando(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="menu-info mb-3">
                                    <p>
                                        <strong>Fecha:</strong> {new Date(menuEditando.fecha).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p>
                                        <strong>Servicio:</strong> {menuEditando.servicio_nombre}
                                    </p>
                                </div>

                                <div className="row">
                                    <div className="col-md-8 mb-3">
                                        <label className="form-label">
                                            <i className="fas fa-utensils me-2"></i>
                                            Receta *
                                        </label>
                                        <select
                                            className="form-select"
                                            value={menuEditando.id_receta}
                                            onChange={(e) => setMenuEditando({
                                                ...menuEditando,
                                                id_receta: e.target.value
                                            })}
                                            required
                                        >
                                            <option value="">Seleccionar receta</option>
                                            {recetas.map(receta => (
                                                <option key={receta.id_receta} value={receta.id_receta}>
                                                    {receta.nombre} - {receta.categoria} ({receta.dificultad})
                                                </option>
                                            ))}
                                        </select>
                                        <small className="form-text text-muted">
                                            ¿No encuentras la receta?
                                            <a href="/cocinera/recetas" className="ms-1">Gestionar recetas aquí</a>
                                        </small>
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">
                                            <i className="fas fa-users me-2"></i>
                                            Porciones Estimadas
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={menuEditando.porciones_estimadas}
                                            onChange={(e) => setMenuEditando({
                                                ...menuEditando,
                                                porciones_estimadas: e.target.value
                                            })}
                                            min="1"
                                            placeholder="Ej: 120"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        <i className="fas fa-sticky-note me-2"></i>
                                        Observaciones
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={menuEditando.observaciones}
                                        onChange={(e) => setMenuEditando({
                                            ...menuEditando,
                                            observaciones: e.target.value
                                        })}
                                        placeholder="Notas adicionales, alergias, sustituciones..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setModalVisible(false);
                                        setMenuEditando(null);
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={guardarMenu}
                                    disabled={!menuEditando.id_receta}
                                >
                                    <i className="fas fa-save me-2"></i>
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CocineraMenu;
