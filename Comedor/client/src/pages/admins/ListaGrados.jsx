import { useState, useEffect } from 'react';
import GradoForm from '../../components/GradoForm';

// Datos de ejemplo - en producción vendría de la API
const datosEjemplo = [
    {
        id: 1,
        nombreGrado: 'Preescolar',
        estado: 'Activo',
        fechaRegistro: '2024-01-15'
    },
    {
        id: 2,
        nombreGrado: 'Primero',
        estado: 'Activo',
        fechaRegistro: '2024-01-15'
    },
    {
        id: 3,
        nombreGrado: 'Segundo',
        estado: 'Activo',
        fechaRegistro: '2024-01-15'
    },
    {
        id: 4,
        nombreGrado: 'Tercero',
        estado: 'Activo',
        fechaRegistro: '2024-01-15'
    },
    {
        id: 5,
        nombreGrado: 'Cuarto',
        estado: 'Activo',
        fechaRegistro: '2024-01-15'
    },
    {
        id: 6,
        nombreGrado: 'Quinto',
        estado: 'Activo',
        fechaRegistro: '2024-01-15'
    },
    {
        id: 7,
        nombreGrado: 'Sexto',
        estado: 'Inactivo',
        fechaRegistro: '2024-01-15'
    }
];

const ListaGrados = () => {
    const [grados, setGrados] = useState([]);
    const [filteredGrados, setFilteredGrados] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrados, setSelectedGrados] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedGrado, setSelectedGrado] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [filterEstado, setFilterEstado] = useState('');

    useEffect(() => {
        // Simular carga de datos
        setLoading(true);
        setTimeout(() => {
            setGrados(datosEjemplo);
            setFilteredGrados(datosEjemplo);
            setLoading(false);
        }, 1000);
    }, []);

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

    const handleSelectGrado = (gradoId) => {
        setSelectedGrados(prev =>
            prev.includes(gradoId)
                ? prev.filter(id => id !== gradoId)
                : [...prev, gradoId]
        );
    };

    const handleSelectAll = () => {
        if (selectedGrados.length === currentGrados.length) {
            setSelectedGrados([]);
        } else {
            setSelectedGrados(currentGrados.map(grado => grado.id));
        }
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

    const handleSaveGrado = async (gradoData) => {
        try {
            if (modalMode === 'create') {
                // Agregar nuevo grado
                const newGrado = {
                    ...gradoData,
                    id: Date.now() // En producción vendría del backend
                };
                setGrados(prev => [...prev, newGrado]);
            } else if (modalMode === 'edit') {
                // Actualizar grado existente
                setGrados(prev =>
                    prev.map(g => g.id === gradoData.id ? gradoData : g)
                );
            }
            closeModal();
        } catch (error) {
            console.error('Error al guardar grado:', error);
        }
    };

    const handleDelete = (gradoId) => {
        if (window.confirm('¿Está seguro de que desea eliminar este grado?')) {
            setGrados(prev => prev.filter(g => g.id !== gradoId));
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`¿Está seguro de que desea eliminar ${selectedGrados.length} grado(s)?`)) {
            setGrados(prev => prev.filter(g => !selectedGrados.includes(g.id)));
            setSelectedGrados([]);
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
                    <i className="fas fa-search search-icon"></i>
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

            {/* Acciones en lote */}
            {selectedGrados.length > 0 && (
                <div className="bulk-actions">
                    <span className="selected-count">
                        {selectedGrados.length} grado(s) seleccionado(s)
                    </span>
                    <div className="bulk-buttons">
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleBulkDelete}
                        >
                            <i className="fas fa-trash"></i>
                            Eliminar Seleccionados
                        </button>
                    </div>
                </div>
            )}

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
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedGrados.length === currentGrados.length && currentGrados.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Nobre del Grado</th>
                                <th>Estado</th>
                                <th>Fecha Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentGrados.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="empty-state">
                                        <i className="fas fa-graduation-cap"></i>
                                        <p>No se encontraron grados</p>
                                    </td>
                                </tr>
                            ) : (
                                currentGrados.map(grado => (
                                    <tr key={grado.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedGrados.includes(grado.id)}
                                                onChange={() => handleSelectGrado(grado.id)}
                                            />
                                        </td>
                                        <td>
                                            <div className="grado-name">
                                                <i className="fas fa-graduation-cap"></i>
                                                <strong>{grado.nombreGrado}</strong>
                                            </div>
                                        </td>
                                        <td>

                                            <span className={`status-badge ${grado.estado.toLowerCase()}`}>{grado.estado}</span>
                                        </td>
                                        <td>{grado.fechaRegistro}</td>
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
                                                    onClick={() => handleDelete(grado.id)}
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
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content grado-modal" onClick={(e) => e.stopPropagation()}>
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