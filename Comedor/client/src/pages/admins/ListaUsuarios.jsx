import React, { useState, useEffect } from 'react';
import UsuarioForm from '../../components/usuarios/UsuarioForm';

// Lista de roles disponibles
const roles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Cocinero' },
    { id: 3, nombre: 'Nutricionista' },
    { id: 4, nombre: 'Supervisor' }
];

// Datos de ejemplo (en producción vendrían de una API)
const usuariosEjemplo = [
    {
        id: 1,
        nombreUsuario: 'admin',
        email: 'admin@comedor.com',
        telefono: '12345678',
        rol: 1,
        estado: 'Activo',
        fechaRegistro: '2025-01-15',
        ultimoAcceso: '2025-10-15T08:30:00Z'
    },
    {
        id: 2,
        nombreUsuario: 'cocinero1',
        email: 'cocinero@comedor.com',
        telefono: '87654321',
        rol: 2,
        estado: 'Activo',
        fechaRegistro: '2025-02-10',
        ultimoAcceso: '2025-10-14T14:45:30Z'
    },
    {
        id: 3,
        nombreUsuario: 'nutricionista',
        email: 'nutricion@comedor.com',
        telefono: '11223344',
        rol: 3,
        estado: 'Inactivo',
        fechaRegistro: '2025-03-05',
        ultimoAcceso: '2025-09-28T16:20:15Z'
    },
    {
        id: 4,
        nombreUsuario: 'supervisor',
        email: 'supervisor@comedor.com',
        telefono: '99887766',
        rol: 4,
        estado: 'Activo',
        fechaRegistro: '2025-04-20',
        ultimoAcceso: '2025-10-15T12:15:30Z'
    },
    {
        id: 5,
        nombreUsuario: 'nuevousuario',
        email: 'nuevo@comedor.com',
        telefono: '55443322',
        rol: 2,
        estado: 'Activo',
        fechaRegistro: '2025-10-10',
        ultimoAcceso: null // Usuario que nunca se ha conectado
    }
];

const ListaUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRol, setFilterRol] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUsuarios, setSelectedUsuarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedUsuario, setSelectedUsuario] = useState(null);

    const itemsPerPage = 10;

    useEffect(() => {
        // Simular carga de datos
        setTimeout(() => {
            setUsuarios(usuariosEjemplo);
            setLoading(false);
        }, 1000);
    }, []);

    const getRolNombre = (rolId) => {
        const rol = roles.find(r => r.id === parseInt(rolId));
        return rol ? rol.nombre : 'Sin rol';
    };

    const getTimeAgo = (dateString) => {
        if (!dateString) return null;

        const now = new Date();
        const accessDate = new Date(dateString);
        const diffInSeconds = Math.floor((now - accessDate) / 1000);

        if (diffInSeconds < 60) {
            return 'Hace unos segundos';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `Hace ${days} día${days > 1 ? 's' : ''}`;
        } else {
            return accessDate.toLocaleDateString();
        }
    };

    // Filtrar usuarios
    const filteredUsuarios = usuarios.filter(usuario => {
        const matchSearch =
            usuario.nombreUsuario.toLowerCase().includes(searchQuery.toLowerCase()) ||
            usuario.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getRolNombre(usuario.rol).toLowerCase().includes(searchQuery.toLowerCase());

        const matchRol = filterRol === '' || usuario.rol.toString() === filterRol;
        const matchEstado = filterEstado === '' || usuario.estado === filterEstado;

        return matchSearch && matchRol && matchEstado;
    });

    // Paginación
    const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterRol = (e) => {
        setFilterRol(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterEstado = (e) => {
        setFilterEstado(e.target.value);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterRol('');
        setFilterEstado('');
        setCurrentPage(1);
    };

    const handleSelectUsuario = (usuarioId) => {
        setSelectedUsuarios(prev => {
            if (prev.includes(usuarioId)) {
                return prev.filter(id => id !== usuarioId);
            } else {
                return [...prev, usuarioId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedUsuarios.length === currentUsuarios.length) {
            setSelectedUsuarios([]);
        } else {
            setSelectedUsuarios(currentUsuarios.map(u => u.id));
        }
    };

    const openModal = (mode, usuario = null) => {
        setModalMode(mode);
        setSelectedUsuario(usuario);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUsuario(null);
        setModalMode('create');
    };

    const handleSaveUsuario = async (usuarioData) => {
        try {
            if (modalMode === 'create') {
                // Agregar nuevo usuario
                const newUsuario = {
                    ...usuarioData,
                    id: Date.now() // En producción vendría del backend
                };
                setUsuarios(prev => [...prev, newUsuario]);
            } else if (modalMode === 'edit') {
                // Actualizar usuario existente
                setUsuarios(prev =>
                    prev.map(u => u.id === usuarioData.id ? usuarioData : u)
                );
            }
            closeModal();
        } catch (error) {
            console.error('Error al guardar usuario:', error);
        }
    };

    const handleDelete = (usuarioId) => {
        if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
            setUsuarios(prev => prev.filter(u => u.id !== usuarioId));
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`¿Está seguro de que desea eliminar ${selectedUsuarios.length} usuario(s)?`)) {
            setUsuarios(prev => prev.filter(u => !selectedUsuarios.includes(u.id)));
            setSelectedUsuarios([]);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p>Cargando usuarios...</p>
            </div>
        );
    }

    return (
        <div>
            <div>
                {/* Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <i className="fas fa-users me-2"></i>
                            Gestión de Usuarios
                        </h1>
                        <p className="page-subtitle">
                            Administre los usuarios del sistema
                        </p>

                    </div>
                    <div className="header-actions">
                        <button
                            className="btn btn-primary-new"
                            onClick={() => openModal('create')}
                        >
                            <i className="fas fa-plus me-2"></i>
                            Nuevo Usuario
                        </button>
                    </div>
                </div>
                <div className="page-header">
                    <div className="header-stats">
                        <div className="stat-card-users">
                            <div className="stat-number-users">{usuarios.length}</div>
                            <div className="stat-label-users">Total Usuarios</div>
                        </div>
                        <div className="stat-card-users">
                            <div className="stat-number-users">
                                {usuarios.filter(u => u.estado === 'Activo').length}
                            </div>
                            <div className="stat-label-users">Activos</div>
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
                            placeholder="Buscar por nombre, email o rol..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="filter-actions">
                        <select
                            className="filter-select"
                            value={filterRol}
                            onChange={handleFilterRol}
                        >
                            <option value="">Todos los roles</option>
                            {roles.map(rol => (
                                <option key={rol.id} value={rol.id}>
                                    {rol.nombre}
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

                        {(searchQuery || filterRol || filterEstado) && (
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
                {selectedUsuarios.length > 0 && (
                    <div className="bulk-actions">
                        <div className="selected-info">
                            <span>{selectedUsuarios.length} usuario(s) seleccionado(s)</span>
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

                {/* Tabla de usuarios */}
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsuarios.length === currentUsuarios.length && currentUsuarios.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Fecha Registro</th>
                                <th>Último Acceso</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentUsuarios.length > 0 ? (
                                currentUsuarios.map(usuario => (
                                    <tr key={usuario.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsuarios.includes(usuario.id)}
                                                onChange={() => handleSelectUsuario(usuario.id)}
                                            />
                                        </td>
                                        <td>
                                            <div className="user-info">
                                                <i className="fas fa-user text-primary"></i>
                                                <strong>{usuario.nombreUsuario}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            {usuario.email}
                                        </td>
                                        <td>

                                            {usuario.telefono}
                                        </td>
                                        <td>
                                            <span className={`badge role-badge role-${usuario.rol}`}>
                                                {getRolNombre(usuario.rol)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${usuario.estado.toLowerCase()}`}>
                                                {usuario.estado}
                                            </span>

                                        </td>
                                        <td>{new Date(usuario.fechaRegistro).toLocaleDateString()}</td>
                                        <td>
                                            <div className="ultimo-acceso">
                                                {usuario.ultimoAcceso ? (
                                                    <>
                                                        <div className="tiempo-transcurrido">
                                                            <i className="fas fa-history me-2 text-primary"></i>
                                                            <strong>{getTimeAgo(usuario.ultimoAcceso)}</strong>
                                                        </div>
                                                        <div className="fecha-exacta">
                                                            <i className="fas fa-calendar-alt me-1 text-muted"></i>
                                                            {new Date(usuario.ultimoAcceso).toLocaleDateString()}
                                                            <span>
                                                                <i className="fas fa-clock me-1 text-muted"></i>
                                                                {new Date(usuario.ultimoAcceso).toLocaleTimeString([],
                                                                    { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-muted">
                                                        <i className="fas fa-minus me-1"></i>
                                                        Sin acceso
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn-action btn-view"
                                                    onClick={() => openModal('view', usuario)}
                                                    title="Ver detalles"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="btn-action btn-edit"
                                                    onClick={() => openModal('edit', usuario)}
                                                    title="Editar"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn-action btn-delete"
                                                    onClick={() => handleDelete(usuario.id)}
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
                                    <td colSpan="9" className="text-center no-data">
                                        <i className="fas fa-users fa-3x text-muted mb-3"></i>
                                        <p>No se encontraron usuarios</p>
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
                            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsuarios.length)} de {filteredUsuarios.length} usuarios
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
                                        {modalMode === 'create' ? 'Crear Usuario' :
                                            modalMode === 'edit' ? 'Editar Usuario' : 'Ver Usuario'}
                                    </h5>
                                    <button className="modal-close" onClick={closeModal}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {modalMode === 'view' ? (
                                        <div className="usuario-details">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label"><strong>Nombre de Usuario:</strong></label>
                                                    <p>{selectedUsuario?.nombreUsuario}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label"><strong>Email:</strong></label>
                                                    <p>{selectedUsuario?.email}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label"><strong>Teléfono:</strong></label>
                                                    <p>{selectedUsuario?.telefono}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label"><strong>Rol:</strong></label>
                                                    <p>{getRolNombre(selectedUsuario?.rol)}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label"><strong>Estado:</strong></label>
                                                    <p>
                                                        <span className={`status-badge status-${selectedUsuario?.estado.toLowerCase()}`}>
                                                            {selectedUsuario?.estado}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label"><strong>Fecha de Registro:</strong></label>
                                                    <p>{new Date(selectedUsuario?.fechaRegistro).toLocaleDateString()}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label"><strong>Último Acceso:</strong></label>
                                                    <p>
                                                        {selectedUsuario?.ultimoAcceso ? (
                                                            <div className="ultimo-acceso-detalle">
                                                                <div>
                                                                    <i className="fas fa-calendar-alt me-2 text-primary"></i>
                                                                    {new Date(selectedUsuario.ultimoAcceso).toLocaleDateString()}
                                                                </div>
                                                                <div className="mt-1">
                                                                    <i className="fas fa-clock me-2 text-success"></i>
                                                                    {new Date(selectedUsuario.ultimoAcceso).toLocaleTimeString()}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">
                                                                <i className="fas fa-minus me-1"></i>
                                                                Sin acceso registrado
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <UsuarioForm
                                            usuario={selectedUsuario}
                                            onSave={handleSaveUsuario}
                                            onCancel={closeModal}
                                            mode={modalMode}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListaUsuarios;