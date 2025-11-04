import { useState, useEffect } from 'react';
import AlumnoGradoForm from '../../components/AlumnoGradoForm';
import alumnoGradoService from '../../services/alumnoGradoService.js';

const ListaAlumnosGrados = () => {
    const [alumnos, setAlumnos] = useState([]);
    const [filteredAlumnos, setFilteredAlumnos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlumnos, setSelectedAlumnos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedAlumno, setSelectedAlumno] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [gradoFilter, setGradoFilter] = useState('');
    const [cicloFilter, setCicloFilter] = useState(new Date().getFullYear().toString());

    // Cargar alumnos al montar el componente
    useEffect(() => {
        loadAlumnos();
    }, []);

    const loadAlumnos = async () => {
        try {
            setLoading(true);
            const data = await alumnoGradoService.getAll();
            setAlumnos(data);
            setFilteredAlumnos(data);
        } catch (error) {
            console.error('Error al cargar los alumnos:', error);
            alert('Error al cargar la lista de alumnos');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar alumnos cuando cambien los filtros
    useEffect(() => {
        let filtered = alumnos;

        // Filtro por búsqueda de texto
        if (searchTerm.trim()) {
            filtered = filtered.filter(alumno =>
                alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                alumno.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                alumno.dni.includes(searchTerm) ||
                alumno.nombreGrado.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro por grado
        if (gradoFilter) {
            filtered = filtered.filter(alumno => alumno.nombreGrado === gradoFilter);
        }

        // Filtro por ciclo lectivo
        if (cicloFilter) {
            filtered = filtered.filter(alumno => alumno.cicloLectivo.toString() === cicloFilter);
        }

        setFilteredAlumnos(filtered);
    }, [searchTerm, gradoFilter, cicloFilter, alumnos]);

    // Operaciones CRUD
    const handleCreate = () => {
        setModalMode('create');
        setSelectedAlumno(null);
        setShowModal(true);
    };

    const handleEdit = (alumno) => {
        setModalMode('edit');
        setSelectedAlumno(alumno);
        setShowModal(true);
    };

    const handleView = (alumno) => {
        setModalMode('view');
        setSelectedAlumno(alumno);
        setShowModal(true);
    };

    const handleDelete = async (alumnoId) => {
        if (window.confirm('¿Está seguro de eliminar esta asignación de alumno?')) {
            try {
                await alumnoGradoService.delete(alumnoId);
                loadAlumnos();
                alert('✅ Asignación eliminada correctamente');
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

    const handleBulkDelete = async () => {
        if (selectedAlumnos.length === 0) {
            alert('Seleccione al menos una asignación para eliminar');
            return;
        }

        if (window.confirm(`¿Está seguro de que desea eliminar ${selectedAlumnos.length} asignación(es)?`)) {
            try {
                await Promise.all(selectedAlumnos.map(id => alumnoGradoService.delete(id)));
                setSelectedAlumnos([]);
                loadAlumnos();
                alert('✅ Asignaciones eliminadas correctamente');
            } catch (error) {
                console.error('Error al eliminar asignaciones:', error);
                alert('Error al eliminar algunas asignaciones');
            }
        }
    };

    const handleSave = (result) => {
        setShowModal(false);
        setSelectedAlumno(null);
        loadAlumnos();

        if (modalMode === 'create') {
            alert(`✅ Alumno asignado al grado correctamente!\n\nAlumno: ${result.nombre} ${result.apellido}\nGrado: ${result.nombreGrado}\nCiclo: ${result.cicloLectivo}`);
        } else {
            alert('✅ Asignación actualizada correctamente!');
        }
    };

    const handleCancel = () => {
        setShowModal(false);
        setSelectedAlumno(null);
    };

    // Obtener lista única de grados para el filtro
    const gradosUnicos = [...new Set(alumnos.map(alumno => alumno.nombreGrado))].sort();

    if (loading) {
        return (
            <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Cargando asignaciones de alumnos...</p>
            </div>
        );
    }

    return (
        <div className="alumnos-grados-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">
                        Alumnos por Grado
                    </h1>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary-new" onClick={handleCreate}>
                        <i className="fas fa-plus"></i>
                        Asignar Alumno
                    </button>
                </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="filters-section">
                <div className="search-bar">
                    <i className="fas fa-search"></i>
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
                    >
                        <option value="">Todos los grados</option>
                        {gradosUnicos.map(grado => (
                            <option key={grado} value={grado}>{grado}</option>
                        ))}
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

            {/* Acciones en lote */}
            {selectedAlumnos.length > 0 && (
                <div className="bulk-actions">
                    <span className="selected-count">
                        {selectedAlumnos.length} asignación(es) seleccionada(s)
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
                    Mostrando {filteredAlumnos.length} de {alumnos.length} asignación(es)
                    {(searchTerm || gradoFilter || cicloFilter !== new Date().getFullYear().toString()) && (
                        <span className="filter-indicator"> (filtrado)</span>
                    )}
                </span>
            </div>

            {/* Tabla */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Información del Alumno</th>
                            <th>Grado Asignado</th>
                            <th>Ciclo Lectivo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAlumnos.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    <p>No se encontraron asignaciones de alumnos</p>
                                </td>
                            </tr>
                        ) : (
                            filteredAlumnos.map((alumno) => (
                                <tr key={alumno.idAlumnoGrado}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                <i className="fas fa-user-graduate"></i>
                                            </div>
                                            <div>
                                                <strong>{alumno.nombre} {alumno.apellido}</strong>
                                                <small className="d-block">DNI: {alumno.dni}</small>
                                                <small className="d-block">
                                                    {alumno.genero} - {alumno.fechaNacimiento ?
                                                        new Date(alumno.fechaNacimiento).toLocaleDateString() :
                                                        'Sin fecha'
                                                    }
                                                </small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="type-badge student">
                                            {alumno.nombreGrado}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge bg-primary">
                                            {alumno.cicloLectivo}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${alumno.estadoPersona ? alumno.estadoPersona.toLowerCase() : 'activo'}`}>
                                            {alumno.estadoPersona || 'Activo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-action btn-view"
                                                onClick={() => handleView(alumno)}
                                                title="Ver detalles"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button
                                                className="btn-action btn-edit"
                                                onClick={() => handleEdit(alumno)}
                                                title="Editar asignación"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-action btn-delete"
                                                onClick={() => handleDelete(alumno.idAlumnoGrado)}
                                                title="Eliminar asignación"
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

            {/* Modal para AsignarAlumno */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content alumno-modal">
                        <div className="modal-header">
                            <h3>
                                {modalMode === 'create' && (
                                    <>
                                        <i className="fas fa-user-plus me-2"></i>
                                        Asignar Alumno a Grado
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
                            <AlumnoGradoForm
                                alumnoGrado={selectedAlumno}
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

export default ListaAlumnosGrados;
