import { useState, useEffect } from 'react';
import UsuarioForm from '../../components/admin/UsuarioForm.jsx';
import usuarioService from '../../services/usuarioService.js';
import { rolService } from '../../services/rolService.js';
import { formatLastActivity } from '../../utils/dateUtils.js';

const ListaUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'create'
    const [itemsPerPage] = useState(10);
    const [selectedUsuario, setSelectedUsuario] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterRol, setFilterRol] = useState('');
    const [loading, setLoading] = useState(true);

    // Estados para filtros dinámicos
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);

    useEffect(() => {
        loadUsuarios();
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setLoadingRoles(true);
            console.log('ListaUsuarios: Cargando roles...');
            const rolesData = await rolService.getActivos();
            console.log('ListaUsuarios: Roles cargados:', rolesData);
            setRoles(Array.isArray(rolesData) ? rolesData : []);
        } catch (error) {
            console.error('Error al cargar roles:', error);
            setRoles([]);
        } finally {
            setLoadingRoles(false);
        }
    };

    const loadUsuarios = async () => {
        try {
            setLoading(true);
            console.log('ListaUsuarios: Iniciando carga de usuarios...');
            const data = await usuarioService.getAll();
            console.log('ListaUsuarios: Datos recibidos:', data);
            setUsuarios(data);
            setFilteredUsuarios(data);
            console.log('ListaUsuarios: Estado actualizado con', data.length, 'usuarios');
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            alert('Error al cargar usuarios: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Filtrado de usuarios
    useEffect(() => {
        let filtered = usuarios;

        // Filtrar por búsqueda
        if (searchQuery && searchQuery.trim()) {
            const searchLower = searchQuery.toLowerCase();
            filtered = filtered.filter(usuario => {
                try {
                    return (
                        (usuario.nombreUsuario && usuario.nombreUsuario.toLowerCase().includes(searchLower)) ||
                        (usuario.mail && usuario.mail.toLowerCase().includes(searchLower)) ||
                        (usuario.nombre && usuario.nombre.toLowerCase().includes(searchLower)) ||
                        (usuario.apellido && usuario.apellido.toLowerCase().includes(searchLower))
                    );
                } catch (error) {
                    console.error('Error al filtrar usuario:', usuario, error);
                    return false;
                }
            });
        }

        // Filtrar por estado
        if (filterEstado && filterEstado !== '') {
            filtered = filtered.filter(usuario => usuario.estado === filterEstado);
        }

        // Filtrar por rol
        if (filterRol && filterRol !== '') {
            filtered = filtered.filter(usuario => usuario.nombreRol === filterRol);
        }

        setFilteredUsuarios(filtered);
        setCurrentPage(1); // Resetear a la primera página al filtrar

    }, [searchQuery, filterEstado, filterRol, usuarios]);

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsuarios = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

    console.log('ListaUsuarios: Estado actual -', {
        usuarios: usuarios.length,
        filteredUsuarios: filteredUsuarios.length,
        currentUsuarios: currentUsuarios.length,
        searchQuery,
        filterEstado,
        filterRol,
        loading
    });

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    const handleFilterEstado = (e) => {
        setFilterEstado(e.target.value);
    }

    const handleFilterRol = (e) => {
        setFilterRol(e.target.value);
    }

    const clearFilters = () => {
        setSearchQuery('');
        setFilterEstado('');
        setFilterRol('');
    };

    const openModal = (mode, usuario = null) => {
        setModalMode(mode);
        setSelectedUsuario(usuario);
        setShowModal(true);
    }

    const closeModal = () => {
        setShowModal(false);
        setSelectedUsuario(null);
    }


    const handleToggleUsuarioEstado = async (usuario) => {
        const isActive = usuario.estado === 'Activo';
        const action = isActive ? 'deshabilitar' : 'activar';
        const newState = isActive ? 'Inactivo' : 'Activo';

        if (window.confirm(`¿Está seguro de que desea ${action} este usuario?`)) {
            try {
                const updatedData = { estado: newState };
                await usuarioService.update(usuario.idUsuario, updatedData);
                alert(`Usuario ${action === 'deshabilitar' ? 'deshabilitado' : 'activado'} correctamente.`);
                loadUsuarios(); // Recargar la lista después de la actualización
            } catch (error) {
                console.error(`Error al ${action} usuario:`, error);
                alert(`Error al ${action} usuario: ` + error.message);
            }
        }
    }

    return (
        <div >
            <div className="page-header">
                <div className="header-left mt-2 mx-2">
                    <h1 className="page-title-sub">
                        Lista de Usuarios
                    </h1>
                </div>
            </div>

            {/* Filtros de búsqueda y estado */}
            <div className="search-filters">
                <div className="search-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por usuario, nombre, apellido o email..."
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

                    {(searchQuery || filterEstado || filterRol) && (
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
                    Mostrando {filteredUsuarios.length} usuario{filteredUsuarios.length !== 1 ? 's' : ''} encontrado{filteredUsuarios.length !== 1 ? 's' : ''}
                    {(searchQuery || filterEstado || filterRol) && (
                        <span className="filter-indicator"> (filtrado)</span>
                    )}
                </span>
            </div>

            {/* Lista de usuarios */}
            <div className="table-container" style={{ minHeight: '400px', overflow: 'auto' }}>
                {loading ? (
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Cargando usuarios...</p>
                    </div>
                ) : (
                    <div className="scrollable-table" style={{ width: '100%' }}>
                        <div className="table-body-scroll" style={{ width: '100%' }}>
                            <table className="data-table table table-striped" style={{ width: '100%', minWidth: '800px' }}>
                                <thead className="table-header-fixed">
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Email</th>
                                        <th>Teléfono</th>
                                        <th>Fecha Alta</th>
                                        <th>Última Actividad</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentUsuarios.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="no-data">
                                                <p>No se encontraron usuarios.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentUsuarios.map((usuario, index) => (
                                            <tr key={usuario.idUsuario || `usuario-${index}`}>
                                                <td>
                                                    <div className="user-info">
                                                        <div>
                                                            <strong>{usuario.nombreUsuario || 'Sin usuario'}</strong>
                                                            <small>{(usuario.nombre || '') + ' ' + (usuario.apellido || '')}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{usuario.mail || 'N/A'}</td>
                                                <td>{usuario.telefono || 'N/A'}</td>
                                                <td>{usuario.fechaAlta ? new Date(usuario.fechaAlta).toLocaleDateString('es-ES') : 'N/A'}</td>
                                                <td>
                                                    {(() => {
                                                        const activity = formatLastActivity(usuario.fechaUltimaActividad);
                                                        if (activity.isNever) {
                                                            return <span style={{ color: '#999', fontStyle: 'italic' }}>Nunca</span>;
                                                        }
                                                        return (
                                                            <div>
                                                                <div style={{
                                                                    fontWeight: activity.isRecent ? 'bold' : 'normal',
                                                                    color: activity.isRecent ? '#2563eb' : 'inherit'
                                                                }}>
                                                                    {activity.relativeTime}
                                                                </div>
                                                                <small style={{ color: '#666' }}>
                                                                    {activity.fecha} • {activity.hora}
                                                                </small>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${usuario.estado ? usuario.estado.toLowerCase() : 'unknown'}`}>
                                                        {usuario.estado || 'Desconocido'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="btn-action btn-view" onClick={() => openModal('view', usuario)}>
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button className="btn-action btn-edit" onClick={() => openModal('edit', usuario)}>
                                                            <i className="fas fa-pencil-alt"></i>
                                                        </button>
                                                        <button
                                                            className={`btn-action ${usuario.estado === 'Activo' ? 'btn-disable' : 'btn-enable'}`}
                                                            onClick={() => handleToggleUsuarioEstado(usuario)}
                                                            title={usuario.estado === 'Activo' ? 'Deshabilitar usuario' : 'Activar usuario'}
                                                        >
                                                            <i className={`fas ${usuario.estado === 'Activo' ? 'fa-user-slash' : 'fa-user-check'}`}></i>
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
                        Página {currentPage} de {totalPages} ({filteredUsuarios.length} usuario{filteredUsuarios.length !== 1 ? 's' : ''})
                    </div>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )
            }

            {/* Modal para Usuario */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                {modalMode === 'view' && (
                                    <>
                                        <i className="fas fa-eye"></i> Detalle del Usuario
                                    </>
                                )}
                                {modalMode === 'edit' && (
                                    <>
                                        <i className="fas fa-pencil-alt"></i> Editar Usuario
                                    </>
                                )}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <UsuarioForm
                                usuario={selectedUsuario}
                                mode={modalMode}
                                onCancel={() => {
                                    closeModal();
                                    loadUsuarios(); // Recargar la lista después de cerrar el modal
                                }}
                            />
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );

};

export default ListaUsuarios;