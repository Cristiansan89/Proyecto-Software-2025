import { useState, useEffect } from 'react';
import ServicioForm from '../../components/admin/ServicioForm';
import servicioService from '../../services/servicioService';
import servicioTurnoService from '../../services/servicioTurnoService';

const ListaServicios = () => {
    const [servicios, setServicios] = useState([]);
    const [servicioTurnos, setServicioTurnos] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedServicio, setSelectedServicio] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');

    // Cargar servicios al montar el componente
    useEffect(() => {
        loadServicios();
    }, []);

    const loadServicios = async () => {
        console.log('ListaServicios: Iniciando loadServicios');
        try {
            setLoading(true);
            const data = await servicioService.getAll();
            console.log('ListaServicios: Datos recibidos:', data);
            setServicios(data);

            // Cargar turnos para cada servicio
            const turnosData = {};
            for (const servicio of data) {
                try {
                    const turnos = await servicioTurnoService.getTurnosByServicio(servicio.idServicio);
                    turnosData[servicio.idServicio] = turnos;
                } catch (error) {
                    console.error(`Error al cargar turnos para servicio ${servicio.idServicio}:`, error);
                    turnosData[servicio.idServicio] = [];
                }
            }
            setServicioTurnos(turnosData);
        } catch (error) {
            console.error('Error al cargar servicios:', error);
            alert('Error al cargar los servicios');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar servicios
    const filteredServicios = servicios.filter(servicio => {
        const matchesSearch = servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'todos' || servicio.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Manejar selección de servicios
    // Selección de servicios no utilizada actualmente; se ha eliminado para evitar variables sin uso.
    // Operaciones CRUD
    const handleCreate = () => {
        setSelectedServicio(null);
        setModalMode('create');
        setShowModal(true);
    };

    const handleEdit = (servicio) => {
        setSelectedServicio(servicio);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (servicio) => {
        setSelectedServicio(servicio);
        setModalMode('view');
        setShowModal(true);
    };

    const handleDelete = async (servicio) => {
        if (window.confirm(`¿Está seguro de eliminar el servicio "${servicio.nombre}"?`)) {
            try {
                await servicioService.delete(servicio.idServicio);
                alert('Servicio eliminado correctamente');
                loadServicios();
            } catch (error) {
                console.error('Error al eliminar servicio:', error);
                if (error.response?.data?.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else {
                    alert('Error al eliminar el servicio');
                }
            }
        }
    };

    const handleChangeStatus = async (servicio, nuevoEstado) => {
        try {
            await servicioService.cambiarEstado(servicio.idServicio, nuevoEstado);
            alert(`Servicio ${nuevoEstado.toLowerCase()} correctamente`);
            loadServicios();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('Error al cambiar el estado del servicio');
        }
    };

    const handleSave = () => {
        setShowModal(false);
        setSelectedServicio(null);
        loadServicios();
        alert(`Servicio ${modalMode === 'create' ? 'creado' : 'actualizado'} correctamente`);
    };

    const handleCancel = () => {
        setShowModal(false);
        setSelectedServicio(null);
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Cargando servicios...</p>
            </div>
        );
    }

    return (
        <div className="servicios-container">
            <div>
                <div className="page-header">
                    <div className="header-left">
                        <h2 className="page-title-sub">
                            Gestión de Servicios
                        </h2>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-primary-new" onClick={handleCreate}>
                            <i className="fas fa-plus"></i>
                            Nuevo Servicio
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="search-filters">
                <div className="search-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar servicios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-actions">
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="Activo">Activos</option>
                        <option value="Inactivo">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Información de resultados */}
            <div className="results-info">
                <div className="results-count">
                    <span>Mostrando {filteredServicios.length} de {servicios.length} servicios</span>
                    {searchTerm && <span className="filter-indicator">filtrado por "{searchTerm}"</span>}
                </div>
            </div>

            {/* Tabla de servicios */}
            <div className="table-container">
                {
                    filteredServicios.length === 0 ? (
                        <div className="no-data">
                            <p>No se encontraron servicios</p>
                        </div>
                    ) : (
                        <div className="scrollable-table">
                            <div className="table-body-scroll">
                                <table className="table table-striped data-table" style={{ width: '100%' }}>
                                    <thead className="table-header-fixed">
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Descripción</th>
                                            <th>Turno</th>
                                            <th>Estado</th>
                                            <th>Fecha Alta</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredServicios.map(servicio => (
                                            <tr key={servicio.idServicio}>
                                                <td>
                                                    <div className="servicio-name">
                                                        <i className="fas fa-utensils"></i>
                                                        <strong>{servicio.nombre}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="servicio-description">
                                                        {servicio.descripcion}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="servicio-turno">
                                                        {servicioTurnos[servicio.idServicio] && servicioTurnos[servicio.idServicio].length > 0 ? (
                                                            <div className="turnos-list">
                                                                {servicioTurnos[servicio.idServicio].map((turno) => (
                                                                    <span
                                                                        key={turno.idTurno}
                                                                        className="turno-badge"
                                                                        title={`${turno.nombreTurno}: ${turno.horaInicio} - ${turno.horaFin}`}
                                                                    >
                                                                        {turno.nombreTurno}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="no-turnos">Sin turnos asignados</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${servicio.estado.toLowerCase()}`}>
                                                        {servicio.estado}
                                                    </span>
                                                </td>
                                                <td>
                                                    {servicio.fechaAlta ? new Date(servicio.fechaAlta).toLocaleDateString() : '-'}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-action btn-view"
                                                            onClick={() => handleView(servicio)}
                                                            title="Ver detalles"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button
                                                            className="btn-action btn-edit"
                                                            onClick={() => handleEdit(servicio)}
                                                            title="Editar"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn-action btn-delete"
                                                            onClick={() => handleDelete(servicio)}
                                                            title="Eliminar"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                        <button
                                                            className={`btn-action ${servicio.estado === 'Activo' ? 'btn-delete' : 'btn-assign'}`}
                                                            onClick={() => handleChangeStatus(servicio, servicio.estado === 'Activo' ? 'Inactivo' : 'Activo')}
                                                            title={servicio.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                                        >
                                                            <i className={`fas ${servicio.estado === 'Activo' ? 'fa-times' : 'fa-check'}`}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }
            </div>
            </div>

            {/* Modal */}
            {
                showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content servicio-modal">
                            <div className="modal-header">
                                <h3>
                                    {modalMode === 'create' && 'Crear Nuevo Servicio'}
                                    {modalMode === 'edit' && 'Editar Servicio'}
                                    {modalMode === 'view' && 'Ver Servicio'}
                                </h3>
                                <button className="modal-close" onClick={handleCancel}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <ServicioForm
                                    servicio={selectedServicio}
                                    mode={modalMode}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default ListaServicios;