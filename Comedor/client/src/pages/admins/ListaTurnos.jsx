import { useState, useEffect } from 'react';
import TurnoForm from '../../components/TurnoForm';
import turnoService from '../../services/turnoService';

const ListaTurnos = () => {
    const [turnos, setTurnos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedTurno, setSelectedTurno] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');

    // Cargar turnos al montar el componente
    useEffect(() => {
        loadTurnos();
    }, []);

    const loadTurnos = async () => {
        console.log('ListaTurnos: Iniciando loadTurnos');
        try {
            setLoading(true);
            const data = await turnoService.getAll();
            console.log('ListaTurnos: Datos recibidos:', data);
            setTurnos(data);
        } catch (error) {
            console.error('Error al cargar turnos:', error);
            alert('Error al cargar los turnos');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar turnos
    const filteredTurnos = turnos.filter(turno => {
        const matchesSearch = turno.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'todos' || turno.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Operaciones CRUD
    const handleCreate = () => {
        setSelectedTurno(null);
        setModalMode('create');
        setShowModal(true);
    };

    const handleEdit = (turno) => {
        setSelectedTurno(turno);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (turno) => {
        setSelectedTurno(turno);
        setModalMode('view');
        setShowModal(true);
    };

    const handleDelete = async (turno) => {
        console.log('ListaTurnos: Intentando eliminar turno:', turno);
        if (window.confirm(`¿Está seguro de eliminar el turno "${turno.nombre}"?`)) {
            try {
                console.log('ListaTurnos: Usuario confirmó eliminación');
                const result = await turnoService.delete(turno.idTurno);
                console.log('ListaTurnos: Resultado de eliminación:', result);
                alert('Turno eliminado correctamente');
                loadTurnos();
            } catch (error) {
                console.error('ListaTurnos: Error al eliminar turno:', error);
                console.error('ListaTurnos: Error response:', error.response?.data);
                if (error.response?.data?.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else {
                    alert('Error al eliminar el turno');
                }
            }
        } else {
            console.log('ListaTurnos: Usuario canceló eliminación');
        }
    };

    const handleChangeStatus = async (turno, nuevoEstado) => {
        try {
            await turnoService.cambiarEstado(turno.idTurno, nuevoEstado);
            alert(`Turno ${nuevoEstado.toLowerCase()} correctamente`);
            loadTurnos();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('Error al cambiar el estado del turno');
        }
    };

    const handleSave = () => {
        setShowModal(false);
        setSelectedTurno(null);
        loadTurnos();
        alert(`Turno ${modalMode === 'create' ? 'creado' : 'actualizado'} correctamente`);
    };

    const handleCancel = () => {
        setShowModal(false);
        setSelectedTurno(null);
    };

    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5); // Remover segundos (HH:MM:SS -> HH:MM)
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Cargando turnos...</p>
            </div>
        );
    }

    return (
        <div className="turnos-container">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h2>Gestión de Turnos</h2>
                    <p>Administra los turnos de atención del comedor</p>
                    <div className="header-stats">
                        <div className="stat-card-users">
                            <div className="stat-number-users">{turnos.length}</div>
                            <div className="stat-label-users">Total</div>
                        </div>
                        <div className="stat-card-stock">
                            <div className="summary-number-stock">{turnos.filter(t => t.estado === 'Activo').length}</div>
                            <div className="summary-label-stock">Activos</div>
                        </div>
                        <div className="stat-card-alert">
                            <div className="summary-number-alert">{turnos.filter(t => t.estado === 'Inactivo').length}</div>
                            <div className="summary-label-alert">Inactivos</div>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary-new" onClick={handleCreate}>
                        <i className="fas fa-plus"></i>
                        Nuevo Turno
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="search-filters">
                <div className="search-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar turnos..."
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
                    <span>Mostrando {filteredTurnos.length} de {turnos.length} turnos</span>
                    {searchTerm && <span className="filter-indicator">filtrado por "{searchTerm}"</span>}
                </div>
            </div>

            {/* Tabla de turnos */}
            <div className="table-container">
                {filteredTurnos.length === 0 ? (
                    <div className="no-data">
                        <p>No se encontraron turnos</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Horario</th>
                                <th>Estado</th>
                                <th>Fecha Alta</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTurnos.map(turno => (
                                <tr key={turno.idTurno}>
                                    <td>
                                        <div className="turno-name">
                                            <i className="fas fa-clock"></i>
                                            <strong>{turno.nombre}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="horario-badge">
                                            {formatTime(turno.horaInicio)} - {formatTime(turno.horaFin)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${turno.estado.toLowerCase()}`}>
                                            {turno.estado}
                                        </span>
                                    </td>
                                    <td>
                                        {turno.fechaAlta ? new Date(turno.fechaAlta).toLocaleDateString() : '-'}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-action btn-view"
                                                onClick={() => handleView(turno)}
                                                title="Ver detalles"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button
                                                className="btn-action btn-edit"
                                                onClick={() => handleEdit(turno)}
                                                title="Editar"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-action btn-delete"
                                                onClick={() => handleDelete(turno)}
                                                title="Eliminar"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                            <button
                                                className={`btn-action ${turno.estado === 'Activo' ? 'btn-delete' : 'btn-assign'}`}
                                                onClick={() => handleChangeStatus(turno, turno.estado === 'Activo' ? 'Inactivo' : 'Activo')}
                                                title={turno.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                            >
                                                <i className={`fas ${turno.estado === 'Activo' ? 'fa-times' : 'fa-check'}`}></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content turno-modal">
                        <div className="modal-header">
                            <h3>
                                {modalMode === 'create' && 'Crear Nuevo Turno'}
                                {modalMode === 'edit' && 'Editar Turno'}
                                {modalMode === 'view' && 'Ver Turno'}
                            </h3>
                            <button className="modal-close" onClick={handleCancel}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <TurnoForm
                                turno={selectedTurno}
                                mode={modalMode}
                                onSave={handleSave}
                                onCancel={handleCancel}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaTurnos;