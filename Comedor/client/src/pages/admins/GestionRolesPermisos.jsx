import { useState, useEffect } from 'react';
import { permisoService } from '../../services/permisoService';
import { rolService } from '../../services/rolService';
import { rolPermisoService } from '../../services/rolPermisoService';
import PermisoForm from '../../components/PermisoForm';
import AsignarPermisosForm from '../../components/AsignarPermisosForm';
import ErrorBoundary from '../../components/ErrorBoundary';

const GestionRolesPermisos = () => {
    // Verificación de funcionamiento básico
    console.log('GestionRolesPermisos componente se está renderizando...');

    const [vistaActiva, setVistaActiva] = useState('permisos'); // 'roles', 'permisos', 'permisos-avanzado', 'asignaciones'
    const [roles, setRoles] = useState([]);
    const [permisos, setPermisos] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);  // Vacío por ahora
    const [loading, setLoading] = useState(false);
    const [rolesConPermisos] = useState([]);
    const [asignacionesIndividuales, setAsignacionesIndividuales] = useState([]);
    const [error, setError] = useState(null);
    const [rolSeleccionadoParaEditar, setRolSeleccionadoParaEditar] = useState(null);

    // Cargar datos básicos al inicializar
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            console.log('Iniciando carga de datos iniciales...');
            setLoading(true);

            try {
                // Cargar roles y permisos básicos
                const resultados = await Promise.allSettled([
                    loadPermisos(),
                    loadRoles(),
                    loadAsignacionesIndividuales()
                ]);

                // Verificar si hubo errores
                const errores = resultados
                    .filter(r => r.status === 'rejected')
                    .map(r => r.reason);

                if (errores.length > 0) {
                    console.warn('Algunos datos no se pudieron cargar:', errores);
                    setError(`Error al cargar algunos datos: ${errores.map(e => e.message).join(', ')}`);
                } else {
                    console.log('Carga inicial completada exitosamente');
                    setError(null);
                }
            } catch (error) {
                console.error('Error en carga inicial:', error);
                setError(`Error crítico: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        cargarDatosIniciales();
    }, []);

    // Cargar asignaciones cuando se cambie a la vista de asignaciones
    useEffect(() => {
        if (vistaActiva === 'asignaciones') {
            loadAsignacionesIndividuales();
        }
    }, [vistaActiva]);

    const loadPermisos = async () => {
        try {
            console.log('Cargando permisos...');
            setLoading(true);

            const data = await Promise.race([
                permisoService.getAll(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout al cargar permisos')), 10000)
                )
            ]);

            setPermisos(data || []);
            console.log('Permisos cargados:', data?.length || 0);
        } catch (error) {
            console.error('Error al cargar permisos:', error);
            setPermisos([]);
            alert('Error al cargar permisos. Por favor, verifique la conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            console.log('Cargando roles...');
            setLoading(true);

            const data = await Promise.race([
                rolService.getAll(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout al cargar roles')), 10000)
                )
            ]);

            setRoles(data || []);
            console.log('Roles cargados:', data?.length || 0);
        } catch (error) {
            console.error('Error al cargar roles:', error);
            setRoles([]);
            alert('Error al cargar roles. Por favor, verifique la conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    // Estados para formularios
    const [mostrarFormularioRol, setMostrarFormularioRol] = useState(false);
    const [editandoRol, setEditandoRol] = useState(null);
    const [showAsignarPermisosForm, setShowAsignarPermisosForm] = useState(false);

    console.log('GestionRolesPermisos - Estado actual:', {
        vistaActiva,
        rolesCount: roles.length,
        permisosCount: permisos.length,
        rolesConPermisosCount: rolesConPermisos.length,
        loading,
        error,
        showAsignarPermisosForm,
        rolSeleccionadoParaEditar
    });

    // Estados para formulario de rol
    const [formRol, setFormRol] = useState({
        nombreRol: '',
        descripcion: '',
        habilitaCuentaUsuario: 'No',
        estado: 'Activo'
    });

    // Estados para la lista completa de permisos
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModulo, setFilterModulo] = useState('');
    const [filterAccion, setFilterAccion] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPermisos, setSelectedPermisos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedPermiso, setSelectedPermiso] = useState(null);

    const itemsPerPage = 10;



    // Simular carga de datos
    useEffect(() => {
        // Aquí cargarías los datos reales de la API
    }, []);

    // Funciones para gestión de roles
    const handleNuevoRol = () => {
        setFormRol({ nombreRol: '', descripcion: '', habilitaCuentaUsuario: 'No', estado: 'Activo' });
        setEditandoRol(null);
        setMostrarFormularioRol(true);
    };

    const handleEditarRol = (rol) => {
        setFormRol({
            nombreRol: rol.nombreRol,
            descripcion: rol.descripcionRol || rol.descripcion, // Manejar ambos nombres de campo
            habilitaCuentaUsuario: rol.habilitaCuentaUsuario || 'No',
            estado: rol.estado || 'Activo'
        });
        setEditandoRol(rol);
        setMostrarFormularioRol(true);
    };

    const handleGuardarRol = async () => {
        try {
            const rolData = {
                nombreRol: formRol.nombreRol,
                descripcionRol: formRol.descripcion, // Mapear descripcion a descripcionRol
                habilitaCuentaUsuario: formRol.habilitaCuentaUsuario,
                estado: formRol.estado
            };

            if (editandoRol) {
                // Actualizar rol existente
                await rolService.update(editandoRol.idRol, { ...rolData, idRol: editandoRol.idRol });
            } else {
                // Crear nuevo rol
                await rolService.create(rolData);
            }

            // Recargar la lista de roles
            await loadRoles();
            setMostrarFormularioRol(false);
            setEditandoRol(null);
        } catch (error) {
            console.error('Error al guardar rol:', error);
            alert('Error al guardar el rol');
        }
    };

    const handleEliminarRol = async (idRol) => {
        if (window.confirm('¿Está seguro de eliminar este rol?')) {
            try {
                await rolService.delete(idRol);
                await loadRoles();
                // También eliminar asignaciones relacionadas
                setAsignaciones(asignaciones.filter(a => a.idRol !== idRol));
            } catch (error) {
                console.error('Error al eliminar rol:', error);
                alert('Error al eliminar el rol');
            }
        }
    };


    // Funciones para gestión de asignaciones - Ahora usando el componente AsignarPermisosForm

    // Cargar todas las asignaciones individuales rol-permiso
    const loadAsignacionesIndividuales = async () => {
        try {
            console.log('Cargando asignaciones individuales...');
            setLoading(true);

            // Usar el endpoint que devuelve todas las relaciones rol-permiso
            const response = await fetch('http://localhost:3000/rol-permisos');
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const asignaciones = await response.json();
            console.log('Asignaciones cargadas:', asignaciones.length);
            setAsignacionesIndividuales(asignaciones);

        } catch (error) {
            console.error('Error al cargar asignaciones:', error);
            setError(`Error al cargar asignaciones: ${error.message}`);
            setAsignacionesIndividuales([]);
        } finally {
            setLoading(false);
        }
    };

    // Cargar roles con sus permisos asignados
    /*
    // Cargar roles con sus permisos asignados - Función deshabilitada temporalmente
    const loadRolesConPermisos = async () => {
        try {
            console.log('Iniciando carga de roles con permisos...');
            setLoading(true);
 
            const rolesData = await rolService.getAll();
            console.log('Roles cargados:', rolesData.length);
 
            // Para cada rol, obtener sus permisos asignados con timeout
            const rolesConPermisosData = await Promise.allSettled(
                rolesData.map(async (rol) => {
                    try {
                        const permisosDelRol = await Promise.race([
                            rolPermisoService.getPermisosByRol(rol.idRol),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout')), 5000)
                            )
                        ]);
                        console.log(`Permisos cargados para rol ${rol.nombreRol}:`, permisosDelRol.length);
                        return {
                            ...rol,
                            permisos: permisosDelRol
                        };
                    } catch (error) {
                        console.warn(`Error al cargar permisos del rol ${rol.nombreRol}:`, error.message);
                        return {
                            ...rol,
                            permisos: []
                        };
                    }
                })
            );
 
            const resultados = rolesConPermisosData.map(result =>
                result.status === 'fulfilled' ? result.value : result.reason
            );
 
            setRolesConPermisos(resultados);
            console.log('Carga de roles con permisos completada');
        } catch (error) {
            console.error('Error al cargar roles con permisos:', error);
            // Fallback: cargar solo roles sin permisos
            try {
                const rolesData = await rolService.getAll();
                setRolesConPermisos(rolesData.map(rol => ({ ...rol, permisos: [] })));
            } catch (fallbackError) {
                console.error('Error en fallback:', fallbackError);
                setRolesConPermisos([]);
            }
        } finally {
            setLoading(false);
        }
    };
    */    // Obtener permisos asignados a un rol (texto para mostrar)
    const _getPermisosAsignados = (idRol) => {
        const rol = rolesConPermisos.find(r => r.idRol === idRol);
        if (!rol || !rol.permisos || rol.permisos.length === 0) {
            return 'No hay permisos asignados';
        }
        return rol.permisos.map(p => p.nombrePermiso || p.descripcion).join(', ');
    };

    // Funciones para gestión de asignaciones
    const handleEditarRolPermiso = (asignacion) => {
        console.log('Editando asignación:', asignacion);
        // Establecer el rol para editar
        setRolSeleccionadoParaEditar(asignacion.id_rol);
        // Mostrar el formulario de asignación
        setShowAsignarPermisosForm(true);
    };


    // Nueva función para eliminar una asignación individual
    const handleEliminarAsignacionIndividual = async (idRol, idPermiso) => {
        console.log('handleEliminarAsignacionIndividual llamado con:', { idRol, idPermiso });

        if (!idRol || !idPermiso) {
            console.error('Error: idRol o idPermiso son undefined:', { idRol, idPermiso });
            alert('Error: Datos de asignación inválidos');
            return;
        }

        if (window.confirm('¿Está seguro de eliminar esta asignación específica?')) {
            try {
                await rolPermisoService.removerPermiso(idRol, idPermiso);
                await loadAsignacionesIndividuales(); // Recargar datos
            } catch (error) {
                console.error('Error al eliminar asignación:', error);
                alert('Error al eliminar la asignación');
            }
        }
    };

    // Renderizar vista de permisos
    const renderVistaPermisos = () => {
        // Obtener módulos únicos para el filtro
        const modulosUnicos = [...new Set(permisos.map(p => p.modulo))].sort();
        const accionesUnicas = [...new Set(permisos.map(p => p.accion))].sort();

        // Filtrar permisos
        const filteredPermisos = permisos.filter(permiso => {
            const matchSearch =
                (permiso.nombrePermiso || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (permiso.descripcionPermiso || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (permiso.modulo || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchModulo = filterModulo === '' || permiso.modulo === filterModulo;
            const matchAccion = filterAccion === '' || permiso.accion === filterAccion;
            const matchEstado = filterEstado === '' || permiso.estado === filterEstado;

            return matchSearch && matchModulo && matchAccion && matchEstado;
        });

        // Paginación
        const totalPages = Math.ceil(filteredPermisos.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPermisos = filteredPermisos.slice(startIndex, endIndex);

        const handleSearch = (e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
        };

        const handleFilterModulo = (e) => {
            setFilterModulo(e.target.value);
            setCurrentPage(1);
        };

        const handleFilterAccion = (e) => {
            setFilterAccion(e.target.value);
            setCurrentPage(1);
        };

        const handleFilterEstado = (e) => {
            setFilterEstado(e.target.value);
            setCurrentPage(1);
        };

        const clearFilters = () => {
            setSearchQuery('');
            setFilterModulo('');
            setFilterAccion('');
            setFilterEstado('');
            setCurrentPage(1);
        };

        // Funciones de selección eliminadas - no se usan en esta vista

        const openModal = (mode, permiso = null) => {
            setModalMode(mode);
            setSelectedPermiso(permiso);
            setShowModal(true);
        };

        const closeModal = () => {
            setShowModal(false);
            setSelectedPermiso(null);
            setModalMode('create');
        };

        const handleSavePermiso = async (permisoData) => {
            try {
                if (modalMode === 'create') {
                    await permisoService.create(permisoData);
                } else if (modalMode === 'edit') {
                    const permisoId = selectedPermiso.idPermiso || selectedPermiso.id_permiso;
                    await permisoService.update(permisoId, permisoData);
                }
                await loadPermisos();
                closeModal();
            } catch (error) {
                console.error('Error al guardar permiso:', error);
                // Aquí podrías mostrar un toast de error
            }
        };



        const handleDelete = async (permisoId) => {
            try {
                // Verificar si el permiso está siendo usado
                const asignacionesActuales = await fetch('http://localhost:3000/rol-permisos');
                const asignaciones = await asignacionesActuales.json();
                const usosPermiso = asignaciones.filter(a => a.id_permiso === permisoId).length;

                let confirmMessage = '¿Está seguro de que desea eliminar este permiso?';
                if (usosPermiso > 0) {
                    confirmMessage = `Este permiso está asignado a ${usosPermiso} rol(es). Para eliminarlo, primero debe quitar las asignaciones. ¿Desea continuar con la eliminación?`;
                }

                if (window.confirm(confirmMessage)) {
                    await permisoService.delete(permisoId);
                    await loadPermisos();
                    alert('Permiso eliminado correctamente');
                }
            } catch (error) {
                console.error('Error al eliminar permiso:', error);

                // Manejar errores específicos
                if (error.message && error.message.includes('asignado a')) {
                    alert(`No se puede eliminar el permiso: ${error.message}\n\nSugerencia: Vaya a la pestaña "Asignar Permisos" para eliminar las asignaciones primero.`);
                } else if (error.message && error.message.includes('Foreign key constraint')) {
                    alert('No se puede eliminar el permiso porque está asignado a uno o más roles.\n\nSugerencia: Vaya a la pestaña "Asignar Permisos" para eliminar las asignaciones primero.');
                } else {
                    alert('Error al eliminar el permiso. Por favor, inténtelo de nuevo.');
                }
            }
        }; const handleBulkDelete = async () => {
            if (window.confirm(`¿Está seguro de que desea eliminar ${selectedPermisos.length} permiso(s)?`)) {
                try {
                    await Promise.all(selectedPermisos.map(id => permisoService.delete(id)));
                    await loadPermisos();
                    setSelectedPermisos([]);
                } catch (error) {
                    console.error('Error al eliminar permisos:', error);
                }
            }
        };

        // Función de toggle estado eliminada - no se usa en esta vista

        const handlePageChange = (page) => {
            setCurrentPage(page);
        };

        return (
            <div className="vista-permisos">
                {/* Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            Lista de Permisos
                        </h1>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn btn-primary-new"
                            onClick={() => openModal('create')}
                        >
                            <i className="fas fa-plus me-2"></i>
                            Nuevo Permiso
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="page-header">
                    <div className="header-stats">
                        <div className="stat-card-users">
                            <div className="stat-number-users mx-1">{permisos.length}</div>
                            <div className="stat-label-users">Total Permisos</div>
                        </div>
                        <div className="stat-card-users">
                            <div className="stat-number-users">
                                {permisos.filter(p => p.estado === 'Activo').length}
                            </div>
                            <div className="stat-label-users">Activos</div>
                        </div>
                        <div className="stat-card-users">
                            <div className="stat-number-users">{modulosUnicos.length}</div>
                            <div className="stat-label-users">Módulos</div>
                        </div>
                    </div>
                </div>

                {/* Controles de búsqueda y filtros */}
                <div className="search-filters">
                    <div className="search-bar">
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar por descripción o módulo..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="filter-actions">
                        <select
                            className="filter-select"
                            value={filterModulo}
                            onChange={handleFilterModulo}
                        >
                            <option value="">Todos los módulos</option>
                            {modulosUnicos.map(modulo => (
                                <option key={modulo} value={modulo}>
                                    {modulo}
                                </option>
                            ))}
                        </select>

                        <select
                            className="filter-select"
                            value={filterAccion}
                            onChange={handleFilterAccion}
                        >
                            <option value="">Todas las acciones</option>
                            {accionesUnicas.map(accion => (
                                <option key={accion} value={accion}>
                                    {accion}
                                </option>
                            ))}
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

                        {(searchQuery || filterModulo || filterAccion || filterEstado) && (
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={clearFilters}
                                title="Limpiar filtros"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                </div>

                {/* Acciones en lote */}
                {selectedPermisos.length > 0 && (
                    <div className="bulk-actions">
                        <div className="selected-info">
                            <span>{selectedPermisos.length} permiso(s) seleccionado(s)</span>
                        </div>
                        <div className="bulk-buttons">
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={handleBulkDelete}
                            >
                                <i className="fas fa-trash me-1"></i>
                                Eliminar Seleccionados
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabla de permisos */}
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Nombre del Permiso</th>
                                <th>Descripción</th>
                                <th>Módulo</th>
                                <th>Acción</th>
                                <th>Estado</th>
                                <th>Fecha de Alta</th>
                                <th>Fecha de Modificación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPermisos.length > 0 ? (
                                currentPermisos.map(permiso => (
                                    <tr key={permiso.idPermiso || permiso.id_permiso}>
                                        <td>
                                            <strong>{permiso.nombrePermiso}</strong>
                                        </td>
                                        <td>
                                            <small className="text-muted">
                                                {permiso.descripcionPermiso || 'Sin descripción'}
                                            </small>
                                        </td>
                                        <td>
                                            <span className={`badge ${(permiso.modulo || '').toLowerCase() === 'sin módulo' ? 'bg-secondary' : 'bg-secondary'}`}>
                                                {permiso.modulo || 'Sin módulo'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${(permiso.accion || '').toLowerCase() === 'sin acción' ? 'bg-info' : 'bg-info'}`}>
                                                {permiso.accion || 'Sin acción'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${(permiso.estado || '').toLowerCase() === 'activo' ? 'bg-success' : 'bg-secondary'}`}>
                                                {permiso.estado || 'Sin estado'}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>
                                                {permiso.fechaAlta ? new Date(permiso.fechaAlta).toLocaleDateString() : 'N/A'}
                                            </strong>
                                        </td>
                                        <td>
                                            <strong>
                                                {permiso.fechaModificacion ? new Date(permiso.fechaModificacion).toLocaleDateString() : '---'}
                                            </strong>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn-action btn-view"
                                                    onClick={() => openModal('view', permiso)}
                                                    title="Ver detalles"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="btn-action btn-edit"
                                                    onClick={() => openModal('edit', permiso)}
                                                    title="Editar"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn-action btn-delete"
                                                    onClick={() => handleDelete(permiso.idPermiso || permiso.id_permiso)}
                                                    title="Eliminar"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center no-data">
                                        <p>No se encontraron permisos</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="pagination-container">
                        <div className="pagination-info">
                            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredPermisos.length)} de {filteredPermisos.length} permisos
                        </div>
                        <div className="pagination">
                            <button
                                className="page-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                className="page-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <i className={`fas ${modalMode === 'create' ? 'fa-plus' : modalMode === 'edit' ? 'fa-edit' : 'fa-eye'} me-2`}></i>
                                        {modalMode === 'create' ? 'Crear Permiso' :
                                            modalMode === 'edit' ? 'Editar Permiso' : 'Ver Permiso'}
                                    </h5>
                                    <button className="modal-close" onClick={closeModal}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <PermisoForm
                                        permiso={selectedPermiso}
                                        onSave={handleSavePermiso}
                                        onCancel={closeModal}
                                        mode={modalMode}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Renderizar vista de roles
    const renderVistaRoles = () => (

        <div className="vista-roles">
            <div className="table-header">
                <h4>Lista de Roles</h4>
                <button
                    className="btn btn-primary-new"
                    onClick={handleNuevoRol}
                >
                    <i className="fas fa-plus"></i> Nuevo Rol
                </button>
            </div>

            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Nombre del Rol</th>
                            <th>Descripción</th>
                            <th>Habilitación de Cuenta</th>

                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(rol => (
                            <tr key={rol.idRol}>
                                <td>{rol.nombreRol}</td>
                                <td>{rol.descripcionRol || rol.descripcion}</td>
                                <td>{rol.habilitaCuentaUsuario || 'No especificado'}</td>

                                <td>{rol.estado || 'No especificado'}</td>
                                <td>
                                    <div className="table-actions">
                                        <button
                                            className="btn-action btn-edit me-2"
                                            onClick={() => handleEditarRol(rol)}
                                            title="Editar"
                                        >

                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            className="btn-action btn-delete"
                                            onClick={() => handleEliminarRol(rol.idRol)}
                                            title="Eliminar"
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
    );

    // Renderizar vista de asignaciones
    const renderVistaAsignaciones = () => (
        <div className="vista-asignaciones">
            <div className="table-header">
                <h4>Asignación de Permisos a Roles</h4>
                <button
                    className="btn btn-primary-new"
                    onClick={() => {
                        console.log('Abriendo formulario para nueva asignación');
                        setRolSeleccionadoParaEditar(null);
                        setShowAsignarPermisosForm(true);
                    }}
                >
                    <i className="fas fa-plus"></i>
                    Asignar Permisos
                </button>
            </div>

            {/* Estadísticas */}
            <div className="page-header">
                <div className="header-stats">
                    <div className="stat-card-users">
                        <div className="stat-number-users">{rolesConPermisos.length}</div>
                        <div className="stat-label-users">Total Roles</div>
                    </div>
                    <div className="stat-card-users">
                        <div className="stat-number-users">
                            {rolesConPermisos.filter(r => r.permisos && r.permisos.length > 0).length}
                        </div>
                        <div className="stat-label-users">Con Permisos</div>
                    </div>
                    <div className="stat-card-users">
                        <div className="stat-number-users">
                            {rolesConPermisos.reduce((total, rol) => total + (rol.permisos?.length || 0), 0)}
                        </div>
                        <div className="stat-label-users">Total Asignaciones</div>
                    </div>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Nombre del Rol</th>
                            <th>Nombre del Permiso</th>
                            <th>Acción</th>
                            <th>Módulo</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {asignacionesIndividuales.length > 0 ? (
                            asignacionesIndividuales.map((asignacion, index) => (
                                <tr key={`${asignacion.id_rol}-${asignacion.id_permiso}-${index}`}>
                                    <td>
                                        <strong>{asignacion.nombreRol}</strong>
                                    </td>
                                    <td>
                                        {asignacion.nombrePermiso}
                                    </td>
                                    <td>
                                        <span className="badge bg-info">
                                            {asignacion.accion}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge bg-secondary">
                                            {asignacion.modulo}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="btn-action btn-edit me-2"
                                                onClick={() => handleEditarRolPermiso(asignacion)}
                                                title="Editar asignación"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-action btn-delete"
                                                onClick={() => handleEliminarAsignacionIndividual(asignacion.id_rol, asignacion.id_permiso)}
                                                title="Eliminar asignación"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center no-data">
                                    <p>No se encontraron asignaciones de roles y permisos</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal para asignar permisos */}
            {showAsignarPermisosForm && (
                <div className="modal fade show d-block" tabIndex="-1" >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-user-shield me-2"></i>
                                    Asignar Permisos a Rol
                                </h5>
                                <button
                                    className="modal-close"
                                    onClick={() => {
                                        setShowAsignarPermisosForm(false);
                                        setRolSeleccionadoParaEditar(null);
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <AsignarPermisosForm
                                    rolSeleccionado={rolSeleccionadoParaEditar}
                                    onClose={() => {
                                        setShowAsignarPermisosForm(false);
                                        setRolSeleccionadoParaEditar(null);
                                        // Recargar datos después de asignar permisos
                                        loadRoles();
                                        loadPermisos();
                                        loadAsignacionesIndividuales();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Manejo de errores críticos
    if (error && loading === false && roles.length === 0 && permisos.length === 0) {
        return (
            <div className="error-container">
                <div className="error-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Error al cargar los datos</h3>
                <p className="error-message">{error}</p>
                <div className="error-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setError(null);
                            setLoading(true);
                            window.location.reload();
                        }}
                    >
                        <i className="fas fa-redo me-2"></i>
                        Reintentar
                    </button>
                </div>
                <div className="debug-info">
                    <small className="text-muted">
                        Debug info: Backend should be running on http://localhost:3000
                        <br />
                        Frontend running on: {window.location.origin}
                    </small>
                </div>
                <style jsx>{`
                    .error-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 60vh;
                        text-align: center;
                        padding: 2rem;
                    }
                    .error-icon {
                        font-size: 4rem;
                        color: #dc3545;
                        margin-bottom: 1rem;
                    }
                    .error-message {
                        color: #721c24;
                        background: #f8d7da;
                        padding: 1rem;
                        border-radius: 6px;
                        margin: 1rem 0;
                        max-width: 500px;
                    }
                    .debug-info {
                        margin-top: 2rem;
                        max-width: 400px;
                    }
                `}</style>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p>Cargando gestión de roles y permisos...</p>
                <div className="loading-details">
                    <small className="text-muted">
                        Conectando con el servidor backend...
                        <br />
                        Si la carga toma mucho tiempo, verifique que el servidor esté ejecutándose en el puerto 3000.
                    </small>
                </div>
                <style jsx>{`
                    .loading-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 60vh;
                        text-align: center;
                        padding: 2rem;
                    }
                    .loading-details {
                        margin-top: 1rem;
                        max-width: 400px;
                    }
                    .spinner-border {
                        width: 3rem;
                        height: 3rem;
                        margin-bottom: 1rem;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="gestion-roles-container">
            {/* Alerta de error no crítico */}
            {error && (roles.length > 0 || permisos.length > 0) && (
                <div className="alert alert-warning alert-dismissible fade show" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Advertencia:</strong> {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError(null)}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">
                        <i className="fas fa-shield-alt me-2"></i>
                        Gestión de Seguridad
                    </h1>
                    <p>Administrar roles, permisos y sus asignaciones</p>
                </div>
            </div>

            {/* Botones de navegación */}
            <div className="navigation-buttons mb-4">
                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className={`btn ${vistaActiva === 'permisos' ? 'btn-lista' : 'btn-outline-secondary'}`}
                        onClick={() => setVistaActiva('permisos')}
                    >
                        <i className="fas fa-key me-2"></i>
                        Gestión de Permisos
                    </button>
                    <button
                        type="button"
                        className={`btn ${vistaActiva === 'roles' ? 'btn-lista' : 'btn-outline-secondary'}`}
                        onClick={() => setVistaActiva('roles')}
                    >
                        <i className="fas fa-users me-2"></i>
                        Gestión de Roles
                    </button>
                    <button
                        type="button"
                        className={`btn ${vistaActiva === 'asignaciones' ? 'btn-lista' : 'btn-outline-secondary'}`}
                        onClick={() => setVistaActiva('asignaciones')}
                    >
                        <i className="fas fa-link me-2"></i>
                        Asignar Permisos
                    </button>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="gestion-roles-container">
                {vistaActiva === 'roles' && renderVistaRoles()}
                {vistaActiva === 'permisos' && renderVistaPermisos()}
                {vistaActiva === 'asignaciones' && renderVistaAsignaciones()}
            </div>

            {/* Modal para formulario de rol */}
            {mostrarFormularioRol && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editandoRol ? 'Editar Rol' : 'Nuevo Rol'}
                                </h5>
                                <button className="modal-close" onClick={() => setMostrarFormularioRol(false)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Nombre del Rol</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formRol.nombreRol}
                                        onChange={(e) => setFormRol({ ...formRol, nombreRol: e.target.value })}
                                        placeholder="Ingrese el nombre del rol"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Descripción</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={formRol.descripcion}
                                        onChange={(e) => setFormRol({ ...formRol, descripcion: e.target.value })}
                                        placeholder="Ingrese la descripción del rol"
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Habilita Cuenta de Usuario</label>
                                    <select
                                        className="form-select"
                                        value={formRol.habilitaCuentaUsuario}
                                        onChange={(e) => setFormRol({ ...formRol, habilitaCuentaUsuario: e.target.value })}
                                    >
                                        <option value="Sí">Sí</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Estado</label>
                                    <select
                                        className="form-select"
                                        value={formRol.estado}
                                        onChange={(e) => setFormRol({ ...formRol, estado: e.target.value })}
                                    >
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setMostrarFormularioRol(false)}
                                >
                                    <i className="fas fa-times"></i>
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleGuardarRol}
                                    disabled={!formRol.nombreRol.trim()}
                                >
                                    <i className="fas fa-save"></i>
                                    {editandoRol ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Overlay para modales */}
            {(mostrarFormularioRol || showAsignarPermisosForm) && (
                <div className="modal-backdrop show"></div>
            )}
        </div>
    );
};

const GestionRolesPermisosWithErrorBoundary = () => (
    <ErrorBoundary>
        <GestionRolesPermisos />
    </ErrorBoundary>
);

export default GestionRolesPermisosWithErrorBoundary;