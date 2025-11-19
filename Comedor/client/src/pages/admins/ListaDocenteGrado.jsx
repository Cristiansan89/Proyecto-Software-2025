import { useState, useEffect } from 'react';
import DocenteGradoForm from '../../components/admin/DocenteGradoForm';
import docenteGradoService from '../../services/docenteGradoService.js';
import { gradoService } from '../../services/gradoService.js';
import { formatCicloLectivo } from '../../utils/dateUtils.js';

const ListaDocentesGrados = () => {
    const [docentes, setDocentes] = useState([]);
    const [filteredDocentes, setFilteredDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedDocente, setSelectedDocente] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [gradoFilter, setGradoFilter] = useState('');
    const [cicloFilter, setCicloFilter] = useState(new Date().getFullYear().toString());

    // Estados para filtros dinámicos
    const [grados, setGrados] = useState([]);
    const [loadingGrados, setLoadingGrados] = useState(false);

    // Cargar docentes al montar el componente
    useEffect(() => {
        loadDocentes();
        loadGrados();
    }, []);

    const loadGrados = async () => {
        try {
            setLoadingGrados(true);
            console.log('ListaDocentesGrados: Cargando grados...');
            const gradosData = await gradoService.getActivos();
            console.log('ListaDocentesGrados: Grados cargados:', gradosData);
            setGrados(Array.isArray(gradosData) ? gradosData : []);
        } catch (error) {
            console.error('Error al cargar grados:', error);
            setGrados([]);
        } finally {
            setLoadingGrados(false);
        }
    };

    const loadDocentes = async () => {
        try {
            setLoading(true);
            const data = await docenteGradoService.getAll();
            setDocentes(data);
            setFilteredDocentes(data);
        } catch (error) {
            console.error('Error al cargar los docentes:', error);
            alert('Error al cargar la lista de docentes');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar docentes cuando cambien los filtros
    useEffect(() => {
        let filtered = docentes;

        // Filtro por búsqueda de texto
        if (searchTerm.trim()) {
            filtered = filtered.filter(docente =>
                docente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                docente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                docente.dni.includes(searchTerm) ||
                docente.nombreGrado.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro por grado
        if (gradoFilter) {
            filtered = filtered.filter(docente => docente.nombreGrado === gradoFilter);
        }

        // Filtro por ciclo lectivo
        if (cicloFilter) {
            filtered = filtered.filter(docente => {
                const ciclo = formatCicloLectivo(docente.cicloLectivo).toString();
                return ciclo === cicloFilter;
            });
        }

        setFilteredDocentes(filtered);
    }, [searchTerm, gradoFilter, cicloFilter, docentes]);

    // Operaciones CRUD
    const handleCreate = () => {
        setModalMode('create');
        setSelectedDocente(null);
        setShowModal(true);
    };

    const handleEdit = (docente) => {
        setModalMode('edit');
        setSelectedDocente(docente);
        setShowModal(true);
    };

    const handleView = (docente) => {
        setModalMode('view');
        setSelectedDocente(docente);
        setShowModal(true);
    };

    const handleDelete = async (docente) => {
        if (window.confirm('¿Está seguro de eliminar esta asignación de docente?')) {
            try {
                await docenteGradoService.delete(
                    docente.idDocenteTitular,
                    docente.idPersona,
                    docente.nombreGrado
                );
                loadDocentes();
                alert('Asignación eliminada correctamente');
            } catch (error) {
                console.error('Error al eliminar la asignación:', error);
                if (error.response?.data?.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else {
                    alert('Error al eliminar la asignación. Por favor, inténtelo de nuevo.');
                }
            }
        }
    };

    const handleSave = (result) => {
        setShowModal(false);
        setSelectedDocente(null);
        loadDocentes();

        if (modalMode === 'create') {
            alert(`Docente asignado al grado correctamente!\n\nDocente: ${result.nombre} ${result.apellido}\nGrado: ${result.nombreGrado}\nCiclo: ${result.cicloLectivo}`);
        } else {
            alert('Asignación actualizada correctamente!');
        }
    };

    const handleCancel = () => {
        setShowModal(false);
        setSelectedDocente(null);
    };

    // Obtener lista única de grados para el filtro
    // const gradosUnicos = [...new Set(docentes.map(docente => docente.nombreGrado))].sort();

    if (loading) {
        return (
            <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Cargando asignaciones de docentes...</p>
            </div>
        );
    }

    return (
        <div className="docentes-grados-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-left">
                    <h2 className="page-title-sub">
                        Docentes por Grado
                    </h2>

                </div>
                <div className="header-actions">
                    <button className="btn btn-primary-new" onClick={handleCreate}>
                        <i className="fas fa-plus"></i>
                        Asignar Docente
                    </button>
                </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="filters-section">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido, DNI o grado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-actions">
                    <select
                        className="filter-select"
                        value={gradoFilter}
                        onChange={(e) => setGradoFilter(e.target.value)}
                        disabled={loadingGrados}
                    >
                        <option value="">Todos los grados</option>
                        {loadingGrados ? (
                            <option disabled>Cargando grados...</option>
                        ) : (
                            grados.map(grado => (
                                <option key={grado.idGrado || grado.id} value={grado.nombre}>
                                    {grado.nombre}
                                </option>
                            ))
                        )}
                    </select>

                    <select
                        className="filter-select"
                        value={cicloFilter}
                        onChange={(e) => setCicloFilter(e.target.value)}
                    >
                        <option value="">Todos los ciclos</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>

                    {(searchTerm || gradoFilter || cicloFilter !== new Date().getFullYear().toString()) && (
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setSearchTerm('');
                                setGradoFilter('');
                                setCicloFilter(new Date().getFullYear().toString());
                            }}
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
                    Mostrando {filteredDocentes.length} de {docentes.length} asignación(es)
                    {(searchTerm || gradoFilter || cicloFilter !== new Date().getFullYear().toString()) && (
                        <span className="filter-indicator"> (filtrado)</span>
                    )}
                </span>
            </div>

            {/* Tabla */}
            <div className="table-container">
                {filteredDocentes.length === 0 ? (
                    <div className="no-data">
                        <p>No se encontraron asignaciones de docentes</p>
                    </div>
                ) : (
                    <div className="scrollable-table">
                        <div className="table-body-scroll">
                            <table className="table table-striped data-table" style={{ width: '100%' }}>
                                <thead className="table-header-fixed">
                                    <tr>
                                        <th>Información del Docente</th>
                                        <th>Grado Asignado</th>
                                        <th>Fecha Asignación</th>
                                        <th>Ciclo Lectivo</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocentes.map((docente) => (
                                        <tr key={`${docente.idDocenteTitular}-${docente.idPersona}-${docente.nombreGrado}`}>
                                            <td>
                                                <div className="user-info">
                                                    <div>
                                                        <strong><h6>{docente.nombre} {docente.apellido}</h6></strong>
                                                        <small className="d-block">DNI: {docente.dni}</small>
                                                        <small className="d-block">
                                                            {docente.genero} - {docente.fechaNacimiento ?
                                                                new Date(docente.fechaNacimiento).toLocaleDateString() :
                                                                'Sin fecha'
                                                            }
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="type-badge teacher">
                                                    {docente.nombreGrado}
                                                </span>
                                            </td>
                                            <td>
                                                {docente.fechaAsignado ?
                                                    new Date(docente.fechaAsignado).toLocaleDateString() :
                                                    'No registrada'
                                                }
                                            </td>
                                            <td>
                                                <span className="badge-anual">
                                                    {formatCicloLectivo(docente.cicloLectivo)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${docente.estadoPersona ? docente.estadoPersona.toLowerCase() : 'activo'}`}>
                                                    {docente.estadoPersona || 'Activo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-action btn-view"
                                                        onClick={() => handleView(docente)}
                                                        title="Ver detalles"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button
                                                        className="btn-action btn-edit"
                                                        onClick={() => handleEdit(docente)}
                                                        title="Editar asignación"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        className="btn-action btn-delete"
                                                        onClick={() => handleDelete(docente)}
                                                        title="Eliminar asignación"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para AsignarDocente */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content docente-modal">
                        <div className="modal-header">
                            <h3>
                                {modalMode === 'create' && (
                                    <>
                                        <i className="fas fa-user-plus me-2"></i>
                                        Asignar Docente a Grado
                                    </>
                                )}
                                {modalMode === 'edit' && (
                                    <>
                                        <i className="fas fa-user-edit me-2"></i>
                                        Editar Asignación
                                    </>
                                )}
                                {modalMode === 'view' && (
                                    <>
                                        <i className="fas fa-user me-2"></i>
                                        Detalles de Asignación
                                    </>
                                )}
                            </h3>
                            <button className="modal-close" onClick={handleCancel}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <DocenteGradoForm
                                docenteGrado={selectedDocente}
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

export default ListaDocentesGrados;
