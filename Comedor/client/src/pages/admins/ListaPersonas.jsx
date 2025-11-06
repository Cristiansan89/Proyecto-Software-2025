import { useState, useEffect } from 'react';
import PersonaForm from '../../components/PersonaForm';
import personaService from '../../services/personaService.js';

const ListaPersonas = () => {
    const [personas, setPersonas] = useState([]);
    const [filteredPersonas, setFilteredPersonas] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPersonas, setSelectedPersonas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [filterTipo, setFilterTipo] = useState('');
    const [filterEstado, setFilterEstado] = useState('');

    useEffect(() => {
        loadPersonas();
    }, []);

    const loadPersonas = async () => {
        try {
            setLoading(true);
            const data = await personaService.getAll();
            setPersonas(data);
            setFilteredPersonas(data);
        } catch (error) {
            console.error('Error al cargar personas:', error);



        } finally {
            setLoading(false);
        }
    };

    // Búsqueda y filtros
    useEffect(() => {
        let filtered = personas;

        // Filtro por búsqueda de texto
        if (searchQuery.trim()) {
            filtered = filtered.filter(persona =>
                persona.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                persona.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
                persona.numeroDocumento.includes(searchQuery) ||
                (persona.nombreRol && persona.nombreRol.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (persona.genero && persona.genero.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Filtro por rol
        if (filterTipo) {
            filtered = filtered.filter(persona => persona.nombreRol === filterTipo);
        }

        // Filtro por estado
        if (filterEstado) {
            filtered = filtered.filter(persona => persona.estado === filterEstado);
        }

        setFilteredPersonas(filtered);
        setCurrentPage(1);
    }, [searchQuery, personas, filterTipo, filterEstado]);

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPersonas = filteredPersonas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleFilterTipo = (e) => {
        setFilterTipo(e.target.value);
    };

    const handleFilterEstado = (e) => {
        setFilterEstado(e.target.value);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterTipo('');
        setFilterEstado('');
    };

    const openModal = (mode, persona = null) => {
        setModalMode(mode);
        setSelectedPersona(persona);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedPersona(null);
    };

    const handleSavePersona = (personaData, usuarioData = null) => {
        // La lógica de guardado ya se maneja en PersonaForm
        // Aquí solo actualizamos la lista local y cerramos el modal
        if (modalMode === 'create') {
            // Agregar nueva persona a la lista local
            setPersonas(prev => [...prev, personaData]);

            // Si se creó un usuario también, mostrar mensaje de éxito
            if (usuarioData) {
                alert(`✅ Persona creada exitosamente!\n\n` +
                    `👤 Persona: ${personaData.nombre} ${personaData.apellido}\n`);
            } else {
                alert(`✅ Persona creada exitosamente!\n\n` +
                    `👤 ${personaData.nombre} ${personaData.apellido}`);
            }
        } else if (modalMode === 'edit') {
            // Actualizar persona en la lista local
            setPersonas(prev => prev.map(p =>
                p.idPersona === personaData.idPersona ? personaData : p
            ));
            alert('✅ Persona actualizada exitosamente!');
        }
        closeModal();
    };

    const handleDelete = async (personaId) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta persona?')) {
            try {
                await personaService.delete(personaId);
                setPersonas(prev => prev.filter(p => p.idPersona !== personaId));
                setSelectedPersonas(prev => prev.filter(id => id !== personaId));
                alert('✅ Persona eliminada exitosamente!');
            } catch (error) {
                console.error('Error al eliminar persona:', error);
                if (error.response?.data?.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else {
                    alert('Error al eliminar la persona. Por favor, inténtelo de nuevo.');
                }
            }
        }
    }; const handleBulkDelete = () => {
        if (selectedPersonas.length === 0) {
            alert('Seleccione al menos una persona para eliminar');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar ${selectedPersonas.length} persona(s)?`)) {
            setPersonas(prev => prev.filter(p => !selectedPersonas.includes(p.idPersona)));
            setSelectedPersonas([]);
        }
    };

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <i className="fas fa-users me-2"></i>
                        Gestión de Personas
                    </h1>
                    <p>Gestión de personas registradas en el sistema</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary-new"
                        onClick={() => openModal('create')}
                    >
                        <i className="fas fa-plus"></i>
                        Nueva Persona
                    </button>
                </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="filters-section">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido, documento o rol..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="search-input"
                    />
                </div>

                <div className="filter-actions">
                    <select
                        className="filter-select"
                        value={filterTipo}
                        onChange={handleFilterTipo}
                    >
                        <option value="">Todos los roles</option>
                        {/* TODO: Cargar roles dinámicamente desde el servicio */}
                        <option value="Alumno">Alumno</option>
                        <option value="Docente">Docente</option>
                        <option value="Administrador General">Administrador General</option>
                        <option value="Secretario Académico">Secretario Académico</option>
                    </select>

                    <select
                        className="filter-select"
                        value={filterEstado}
                        onChange={handleFilterEstado}
                    >
                        <option value="">Todos los estados</option>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                    </select>

                    {(searchQuery || filterTipo || filterEstado) && (
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
            {selectedPersonas.length > 0 && (
                <div className="bulk-actions">
                    <span className="selected-count">
                        {selectedPersonas.length} persona(s) seleccionada(s)
                    </span>
                    <div className="bulk-buttons">
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleBulkDelete}
                        >
                            <i className="fas fa-trash"></i>
                            Eliminar seleccionadas
                        </button>
                    </div>
                </div>
            )}

            {/* Indicador de resultados */}
            <div className="results-info">
                <span className="results-count">
                    Mostrando {filteredPersonas.length} de {personas.length} persona(s)
                    {(searchQuery || filterTipo || filterEstado) && (
                        <span className="filter-indicator"> (filtrado)</span>
                    )}
                </span>
            </div>

            {/* Tabla */}
            <div className="table-container">
                {loading ? (
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Cargando personas...</p>
                    </div>
                ) : (
                    <div className="scrollable-table">
                        <div className="table-body-scroll">
                            <table className="data-table">
                                <thead className="table-header-fixed">
                                    <tr>
                                        <th>Información Personal</th>
                                        <th>Documento</th>
                                        <th>Fecha Nacimiento</th>
                                        <th>Género</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPersonas.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="no-data">
                                                <p>No se encontraron personas</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentPersonas.map((persona) => (
                                            <tr key={persona.idPersona}>
                                                <td>
                                                    <div className="user-info">
                                                        <div className="user-avatar">
                                                            <i className="fas fa-user"></i>
                                                        </div>
                                                        <div>
                                                            <strong>{persona.nombre} {persona.apellido}</strong>
                                                            <small className="d-block">{persona.email}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {persona.dni}
                                                </td>
                                                <td>
                                                    {persona.fechaNacimiento ?
                                                        new Date(persona.fechaNacimiento).toLocaleDateString() :
                                                        'No registrada'
                                                    }
                                                </td>
                                                <td>
                                                    <span className="badge bg-secondary">
                                                        {persona.genero || 'No especificado'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`type-badge ${persona.habilitaCuentaUsuario === 'Sí' ? 'teacher' : 'student'}`}>
                                                        {persona.nombreRol || 'Sin rol'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className={`status-badge ${persona.estado.toLowerCase()}`}>
                                                        {persona.estado}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-action btn-view"
                                                            onClick={() => openModal('view', persona)}
                                                            title="Ver detalles"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button
                                                            className="btn-action btn-edit"
                                                            onClick={() => openModal('edit', persona)}
                                                            title="Editar"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn-action btn-delete"
                                                            onClick={() => handleDelete(persona.idPersona)}
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
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>

                    <div className="pagination-info">
                        Página {currentPage} de {totalPages} ({filteredPersonas.length} registros)
                    </div>

                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}

            {/* Modal para Persona */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content persona-modal">
                        <div className="modal-header">
                            <h3>
                                {modalMode === 'create' && (
                                    <>
                                        <i className="fas fa-user-plus me-2"></i>
                                        Nueva Persona
                                    </>
                                )}
                                {modalMode === 'edit' && (
                                    <>
                                        <i className="fas fa-user-edit me-2"></i>
                                        Editar Persona
                                    </>
                                )}
                                {modalMode === 'view' && (
                                    <>
                                        <i className="fas fa-user me-2"></i>
                                        Detalles de Persona
                                    </>
                                )}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <PersonaForm
                                persona={selectedPersona}
                                mode={modalMode}
                                onSave={handleSavePersona}
                                onCancel={closeModal}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaPersonas;