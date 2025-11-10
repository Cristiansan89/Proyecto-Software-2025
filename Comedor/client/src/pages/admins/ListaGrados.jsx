import { useState, useEffect } from 'react';
import GradoForm from '../../components/GradoForm';
import gradoService from '../../services/gradoService';


const ListaGrados = () => {
    const [grados, setGrados] = useState([]);
    const [filteredGrados, setFilteredGrados] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedGrado, setSelectedGrado] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [filterEstado, setFilterEstado] = useState('');

    useEffect(() => {
        loadGrados();
    }, []);

    const loadGrados = async () => {
        try {
            setLoading(true);
            const gradosData = await gradoService.getAll();
            setGrados(gradosData);
            setFilteredGrados(gradosData);
        } catch (error) {
            console.error('Error al cargar grados:', error);
            alert('Error al cargar los grados');
        } finally {
            setLoading(false);
        }
    };

    // Búsqueda y filtros
    useEffect(() => {
        let filtered = grados;

        // Filtro por búsqueda de texto
        if (searchQuery.trim()) {
            filtered = filtered.filter(grado =>
                grado.nombreGrado.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filtro por estado
        if (filterEstado) {
            filtered = filtered.filter(grado => grado.estado === filterEstado);
        }

        setFilteredGrados(filtered);
        setCurrentPage(1);
    }, [searchQuery, grados, filterEstado]);

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentGrados = filteredGrados.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredGrados.length / itemsPerPage);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleFilterEstado = (e) => {
        setFilterEstado(e.target.value);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterEstado('');
    };

    const openModal = (mode, grado = null) => {
        setModalMode(mode);
        setSelectedGrado(grado);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedGrado(null);
        setModalMode('create');
    };

    const handleSaveGrado = async () => {
        try {
            closeModal();
            alert(`Grado ${modalMode === 'create' ? 'creado' : 'actualizado'} correctamente`);
            loadGrados(); // Recargar la lista
        } catch (error) {
            console.error('Error al guardar grado:', error);
        }
    };

    const handleDelete = async (grado) => {
        if (window.confirm(`¿Está seguro de eliminar el grado "${grado.nombreGrado}"?`)) {
            try {
                await gradoService.delete(grado.idGrado);
                alert('Grado eliminado correctamente');
                loadGrados();
            } catch (error) {
                console.error('Error al eliminar grado:', error);
                if (error.response?.data?.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else {
                    alert('Error al eliminar el grado');
                }
            }
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <i className="fas fa-graduation-cap me-2"></i>
                        Gestión de Grados
                    </h1>
                    <p>
                        Administra los grados académicos del centro educativo
                    </p>

                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary-new"
                        onClick={() => openModal('create')}
                    >
                        <i className="fas fa-plus"></i>
                        Nuevo Grado
                    </button>
                </div>
            </div>

            {/* Controles de búsqueda y filtros */}
            <div className="search-filters">
                <div className="search-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por nombre del grado..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
                <div className="filter-actions">
                    <select
                        className="filter-select"
                        value={filterEstado}
                        onChange={handleFilterEstado}
                    >
                        <option value="">Todos los estados</option>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                    </select>
                    {(searchQuery || filterEstado) && (
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={clearFilters}
                            title="Limpiar filtros"
                        >
                            <i className="fas fa-times"></i>
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Indicador de resultados */}
            <div className="results-info">
                <span className="results-count">
                    Mostrando {filteredGrados.length} de {grados.length} grado(s)
                    {(searchQuery || filterEstado) && (
                        <span className="filter-indicator"> (filtrado)</span>
                    )}
                </span>
            </div>

            {/* Tabla */}
            <div className="table-container">
                {loading ? (
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Cargando grados...</p>
                    </div>
                ) : (
                    <div className="scrollable-table">
                        <div className="table-body-scroll">
                            <table className="table table-striped data-table" style={{ width: '100%' }}>
                                <thead className="table-header-fixed">
                                    <tr>
                                        <th>Grado</th>
                                        <th>Turno</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentGrados.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="no-data">
                                                <p>No se encontraron grados</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentGrados.map(grado => (
                                            <tr key={grado.idGrado}>
                                                <td>
                                                    <div className="grado-name">
                                                        <strong>{grado.nombreGrado}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="turno-info">
                                                        <span className="turno-name">{grado.turno}</span>
                                                        <span className="turno-hours">({grado.horaInicio} - {grado.horaFin})</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${grado.estado.toLowerCase()}`}>{grado.estado}</span>
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            className="btn-action btn-view"
                                                            onClick={() => openModal('view', grado)}
                                                            title="Ver detalles"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button
                                                            className="btn-action btn-edit"
                                                            onClick={() => openModal('edit', grado)}
                                                            title="Editar"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn-action btn-delete"
                                                            onClick={() => handleDelete(grado)}
                                                            title="Eliminar"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <i className="fas fa-chevron-left"></i>
                        Anterior
                    </button>

                    <div className="pagination-info">
                        Página {currentPage} de {totalPages}
                    </div>

                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}

            {/* Modal para Grado */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content grado-modal">
                        <div className="modal-header">
                            <h3>
                                {modalMode === 'create' && (
                                    <>
                                        <i className="fas fa-plus me-2"></i>
                                        Nuevo Grado
                                    </>
                                )}
                                {modalMode === 'edit' && (
                                    <>
                                        <i className="fas fa-edit me-2"></i>
                                        Editar Grado
                                    </>
                                )}
                                {modalMode === 'view' && (
                                    <>
                                        <i className="fas fa-graduation-cap me-2"></i>
                                        Detalles del Grado
                                    </>
                                )}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <GradoForm
                                grado={selectedGrado}
                                mode={modalMode}
                                onSave={handleSaveGrado}
                                onCancel={closeModal}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaGrados;