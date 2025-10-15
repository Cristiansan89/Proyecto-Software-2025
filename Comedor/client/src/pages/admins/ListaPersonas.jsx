import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PersonaForm from '../../components/PersonaForm';

// Datos de ejemplo - en producción vendría de la API
const datosEjemplo = [
    {
        id: 1,
        nombre: 'María',
        apellido: 'García López',
        numeroDocumento: '12345678',
        tipoPersona: 'Alumno',
        grado: 'Primero',
        estado: 'Activo',
        fechaRegistro: '2024-01-15'
    },
    {
        id: 2,
        nombre: 'Carlos',
        apellido: 'Rodríguez Silva',
        numeroDocumento: '23456789',
        tipoPersona: 'Alumno',
        grado: 'Segundo',
        estado: 'Activo',
        fechaRegistro: '2024-01-20'
    },
    {
        id: 3,
        nombre: 'Ana',
        apellido: 'Martínez Pérez',
        numeroDocumento: '34567890',
        tipoPersona: 'Alumno',
        grado: 'Tercero',
        estado: 'Inactivo',
        fechaRegistro: '2024-02-01'
    },
    {
        id: 4,
        nombre: 'Luis',
        apellido: 'González Torres',
        numeroDocumento: '45678901',
        tipoPersona: 'Docente',
        telefono: '099456789',
        email: 'luis.gonzalez@escuela.edu.uy',
        direccion: 'Barrio Norte 321',
        estado: 'Activo',
        fechaRegistro: '2024-02-10'
    },
    {
        id: 5,
        nombre: 'Sofia',
        apellido: 'Fernández Ruiz',
        numeroDocumento: '56789012',
        tipoPersona: 'Docente',
        telefono: '099567890',
        email: 'sofia.fernandez@escuela.edu.uy',
        direccion: 'Zona Sur 654',
        estado: 'Activo',
        fechaRegistro: '2024-02-15'
    },
    {
        id: 6,
        nombre: 'Pedro',
        apellido: 'Jiménez Castro',
        numeroDocumento: '67890123',
        tipoPersona: 'Alumno',
        grado: 'Quinto',
        estado: 'Activo',
        fechaRegistro: '2024-02-20'
    }
];

const ListaPersonas = ({ onNavigate }) => {
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
        // Simular carga de datos
        setLoading(true);
        setTimeout(() => {
            setPersonas(datosEjemplo);
            setFilteredPersonas(datosEjemplo);
            setLoading(false);
        }, 1000);
    }, []);

    // Búsqueda y filtros
    useEffect(() => {
        let filtered = personas;

        // Filtro por búsqueda de texto
        if (searchQuery.trim()) {
            filtered = filtered.filter(persona =>
                persona.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                persona.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
                persona.numeroDocumento.includes(searchQuery) ||
                persona.tipoPersona.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (persona.grado && persona.grado.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Filtro por tipo de persona
        if (filterTipo) {
            filtered = filtered.filter(persona => persona.tipoPersona === filterTipo);
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

    const handleSelectPersona = (personaId) => {
        setSelectedPersonas(prev =>
            prev.includes(personaId)
                ? prev.filter(id => id !== personaId)
                : [...prev, personaId]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPersonas(currentPersonas.map(p => p.id));
        } else {
            setSelectedPersonas([]);
        }
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

    const handleSavePersona = (personaData) => {
        if (modalMode === 'create') {
            // Agregar nueva persona
            setPersonas(prev => [...prev, personaData]);
        } else if (modalMode === 'edit') {
            // Actualizar persona existente
            setPersonas(prev => prev.map(p =>
                p.id === personaData.id ? personaData : p
            ));
        }
        closeModal();
    };

    const handleDelete = (personaId) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta persona?')) {
            setPersonas(prev => prev.filter(p => p.id !== personaId));
            setSelectedPersonas(prev => prev.filter(id => id !== personaId));
        }
    }; const handleBulkDelete = () => {
        if (selectedPersonas.length === 0) {
            alert('Seleccione al menos una persona para eliminar');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar ${selectedPersonas.length} persona(s)?`)) {
            setPersonas(prev => prev.filter(p => !selectedPersonas.includes(p.id)));
            setSelectedPersonas([]);
        }
    };

    return (
        <AdminLayout onNavigate={onNavigate}>
            <div className="personas-container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h2>Lista de Personas</h2>
                        <p>Gestión de personas registradas en el sistema</p>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn btn-primary"
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
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellido, documento o tipo..."
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
                            <option value="">Todos los tipos</option>
                            <option value="Alumno">Alumno</option>
                            <option value="Docente">Docente</option>
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
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedPersonas.length === currentPersonas.length && currentPersonas.length > 0}
                                        />
                                    </th>
                                    <th>Nombre Completo</th>
                                    <th>Documento</th>
                                    <th>Tipo</th>
                                    <th>Teléfono</th>
                                    <th>Estado</th>
                                    <th>Fecha Registro</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPersonas.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="no-data">
                                            <i className="fas fa-users"></i>
                                            <p>No se encontraron personas</p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentPersonas.map((persona) => (
                                        <tr key={persona.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPersonas.includes(persona.id)}
                                                    onChange={() => handleSelectPersona(persona.id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="user-info">
                                                    <div className="user-avatar">
                                                        <i className="fas fa-user"></i>
                                                    </div>
                                                    <div>
                                                        <strong>{persona.nombre} {persona.apellido}</strong>
                                                        <small>{persona.email}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="document-badge">
                                                    {persona.tipoDocumento}: {persona.numeroDocumento}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`type-badge ${persona.tipoPersona === 'Docente' ? 'teacher' : 'student'}`}>
                                                    {persona.tipoPersona}
                                                    {persona.grado && (
                                                        <small className="grade-info"> - {persona.grado}</small>
                                                    )}
                                                </span>
                                            </td>
                                            <td>{persona.telefono}</td>
                                            <td>
                                                <span className={`status-badge ${persona.estado.toLowerCase()}`}>
                                                    {persona.estado}
                                                </span>
                                            </td>
                                            <td>{new Date(persona.fechaRegistro).toLocaleDateString()}</td>
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
                                                        onClick={() => handleDelete(persona.id)}
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
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content persona-modal" onClick={(e) => e.stopPropagation()}>
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
        </AdminLayout>
    );
};

export default ListaPersonas;