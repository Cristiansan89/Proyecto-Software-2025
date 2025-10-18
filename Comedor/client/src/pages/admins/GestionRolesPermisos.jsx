import { useState, useEffect } from 'react';

// Datos de ejemplo - en producción vendrán de la API
const rolesEjemplo = [
    { idRol: '1', nombreRol: 'Administrador', descripcion: 'Acceso completo al sistema' },
    { idRol: '2', nombreRol: 'Cocinero', descripcion: 'Gestión de menús y recetas' },
    { idRol: '3', nombreRol: 'Secretario', descripcion: 'Gestión de personas y asistencias' }
];

const permisosEjemplo = [
    { idPermiso: '1', nombrePermiso: 'crear_usuarios' },
    { idPermiso: '2', nombrePermiso: 'editar_usuarios' },
    { idPermiso: '3', nombrePermiso: 'eliminar_usuarios' },
    { idPermiso: '4', nombrePermiso: 'ver_reportes' },
    { idPermiso: '5', nombrePermiso: 'gestionar_inventario' },
    { idPermiso: '6', nombrePermiso: 'planificar_menus' }
];

const asignacionesEjemplo = [
    { idRol: '1', nombreRol: 'Administrador', idPermiso: '1', nombrePermiso: 'crear_usuarios' },
    { idRol: '1', nombreRol: 'Administrador', idPermiso: '2', nombrePermiso: 'editar_usuarios' },
    { idRol: '1', nombreRol: 'Administrador', idPermiso: '3', nombrePermiso: 'eliminar_usuarios' },
    { idRol: '1', nombreRol: 'Administrador', idPermiso: '4', nombrePermiso: 'ver_reportes' },
    { idRol: '2', nombreRol: 'Cocinero', idPermiso: '5', nombrePermiso: 'gestionar_inventario' },
    { idRol: '2', nombreRol: 'Cocinero', idPermiso: '6', nombrePermiso: 'planificar_menus' }
];

const GestionRolesPermisos = () => {
    const [vistaActiva, setVistaActiva] = useState('roles'); // 'roles', 'permisos', 'asignaciones'
    const [roles, setRoles] = useState(rolesEjemplo);
    const [permisos, setPermisos] = useState(permisosEjemplo);
    const [asignaciones, setAsignaciones] = useState(asignacionesEjemplo);
    const [loading] = useState(false);

    // Estados para formularios
    const [mostrarFormularioRol, setMostrarFormularioRol] = useState(false);
    const [mostrarFormularioPermiso, setMostrarFormularioPermiso] = useState(false);
    const [mostrarFormularioAsignacion, setMostrarFormularioAsignacion] = useState(false);
    const [editandoRol, setEditandoRol] = useState(null);
    const [editandoPermiso, setEditandoPermiso] = useState(null);

    // Estados para formulario de rol
    const [formRol, setFormRol] = useState({
        nombreRol: '',
        descripcion: ''
    });

    // Estados para formulario de permiso
    const [formPermiso, setFormPermiso] = useState({
        nombrePermiso: ''
    });

    // Estados para formulario de asignación
    const [formAsignacion, setFormAsignacion] = useState({
        idRol: '',
        permisosSeleccionados: []
    });

    // Simular carga de datos
    useEffect(() => {
        // Aquí cargarías los datos reales de la API
    }, []);

    // Funciones para gestión de roles
    const handleNuevoRol = () => {
        setFormRol({ nombreRol: '', descripcion: '' });
        setEditandoRol(null);
        setMostrarFormularioRol(true);
    };

    const handleEditarRol = (rol) => {
        setFormRol({ nombreRol: rol.nombreRol, descripcion: rol.descripcion });
        setEditandoRol(rol);
        setMostrarFormularioRol(true);
    };

    const handleGuardarRol = () => {
        if (editandoRol) {
            // Actualizar rol existente
            setRoles(roles.map(r =>
                r.idRol === editandoRol.idRol
                    ? { ...r, ...formRol }
                    : r
            ));
        } else {
            // Crear nuevo rol
            const nuevoRol = {
                idRol: Date.now().toString(),
                ...formRol
            };
            setRoles([...roles, nuevoRol]);
        }
        setMostrarFormularioRol(false);
        setEditandoRol(null);
    };

    const handleEliminarRol = (idRol) => {
        if (window.confirm('¿Está seguro de eliminar este rol?')) {
            setRoles(roles.filter(r => r.idRol !== idRol));
            // También eliminar asignaciones relacionadas
            setAsignaciones(asignaciones.filter(a => a.idRol !== idRol));
        }
    };

    // Funciones para gestión de permisos
    const handleNuevoPermiso = () => {
        setFormPermiso({ nombrePermiso: '' });
        setEditandoPermiso(null);
        setMostrarFormularioPermiso(true);
    };

    const handleEditarPermiso = (permiso) => {
        setFormPermiso({ nombrePermiso: permiso.nombrePermiso });
        setEditandoPermiso(permiso);
        setMostrarFormularioPermiso(true);
    };

    const handleGuardarPermiso = () => {
        if (editandoPermiso) {
            // Actualizar permiso existente
            setPermisos(permisos.map(p =>
                p.idPermiso === editandoPermiso.idPermiso
                    ? { ...p, ...formPermiso }
                    : p
            ));
        } else {
            // Crear nuevo permiso
            const nuevoPermiso = {
                idPermiso: Date.now().toString(),
                ...formPermiso
            };
            setPermisos([...permisos, nuevoPermiso]);
        }
        setMostrarFormularioPermiso(false);
        setEditandoPermiso(null);
    };

    const handleEliminarPermiso = (idPermiso) => {
        if (window.confirm('¿Está seguro de eliminar este permiso?')) {
            setPermisos(permisos.filter(p => p.idPermiso !== idPermiso));
            // También eliminar asignaciones relacionadas
            setAsignaciones(asignaciones.filter(a => a.idPermiso !== idPermiso));
        }
    };

    // Funciones para gestión de asignaciones
    const handleNuevaAsignacion = () => {
        setFormAsignacion({ idRol: '', permisosSeleccionados: [] });
        setMostrarFormularioAsignacion(true);
    };

    const handleGuardarAsignacion = () => {
        const rolSeleccionado = roles.find(r => r.idRol === formAsignacion.idRol);
        if (!rolSeleccionado) return;

        // Eliminar asignaciones existentes para este rol
        const nuevasAsignaciones = asignaciones.filter(a => a.idRol !== formAsignacion.idRol);

        // Agregar nuevas asignaciones
        formAsignacion.permisosSeleccionados.forEach(idPermiso => {
            const permiso = permisos.find(p => p.idPermiso === idPermiso);
            if (permiso) {
                nuevasAsignaciones.push({
                    idRol: rolSeleccionado.idRol,
                    nombreRol: rolSeleccionado.nombreRol,
                    idPermiso: permiso.idPermiso,
                    nombrePermiso: permiso.nombrePermiso
                });
            }
        });

        setAsignaciones(nuevasAsignaciones);
        setMostrarFormularioAsignacion(false);
    };

    const handleEliminarAsignacion = (idRol, idPermiso) => {
        if (window.confirm('¿Está seguro de eliminar esta asignación?')) {
            setAsignaciones(asignaciones.filter(a =>
                !(a.idRol === idRol && a.idPermiso === idPermiso)
            ));
        }
    };

    // Obtener permisos asignados a un rol
    const getPermisosAsignados = (idRol) => {
        return asignaciones
            .filter(a => a.idRol === idRol)
            .map(a => a.nombrePermiso)
            .join(', ');
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
                            <th>Permisos Asignados</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(rol => (
                            <tr key={rol.idRol}>
                                <td>{rol.nombreRol}</td>
                                <td>{rol.descripcion}</td>
                                <td className="permisos-cell">
                                    {getPermisosAsignados(rol.idRol) || 'Sin permisos'}
                                </td>
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

    // Renderizar vista de permisos
    const renderVistaPermisos = () => (
        <div className="vista-permisos">
            <div className="table-header">
                <h4>Lista de Permisos</h4>
                <button
                    className="btn btn-primary-new"
                    onClick={handleNuevoPermiso}
                >
                    <i className="fas fa-plus"></i> Nuevo Permiso
                </button>
            </div>

            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Nombre del Permiso</th>
                            <th>Roles Asignados</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permisos.map(permiso => (
                            <tr key={permiso.idPermiso}>
                                <td>{permiso.nombrePermiso}</td>
                                <td className="roles-cell">
                                    {asignaciones
                                        .filter(a => a.idPermiso === permiso.idPermiso)
                                        .map(a => a.nombreRol)
                                        .join(', ') || 'Sin asignar'}
                                </td>
                                <td>
                                    <div className="table-actions">
                                        <button
                                            className="btn-action btn-edit me-2"
                                            onClick={() => handleEditarPermiso(permiso)}
                                            title="Editar"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            className="btn-action btn-delete me-2"
                                            onClick={() => handleEliminarPermiso(permiso.idPermiso)}
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
                <h4>Asignar Permisos a Roles</h4>
                <button
                    className="btn btn-primary-new"
                    onClick={handleNuevaAsignacion}
                >
                    <i className="fas fa-plus"></i> Asignar Permisos a Rol
                </button>
            </div>

            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Rol</th>
                            <th>Permiso</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {asignaciones.map((asignacion, index) => (
                            <tr key={`${asignacion.idRol}-${asignacion.idPermiso}-${index}`}>
                                <td>{asignacion.nombreRol}</td>
                                <td>{asignacion.nombrePermiso}</td>
                                <td>
                                    <button
                                        className="btn-action btn-delete"
                                        onClick={() => handleEliminarAsignacion(asignacion.idRol, asignacion.idPermiso)}
                                        title="Eliminar"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {asignaciones.length === 0 && (
                            <tr>
                                <td colSpan="3" className="text-center text-muted">
                                    No hay asignaciones configuradas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p>Cargando gestión de roles y permisos...</p>
            </div>
        );
    }

    return (
        <div className="gestion-roles-container">
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
                        className={`btn ${vistaActiva === 'roles' ? 'btn-lista' : 'btn-outline-secondary'}`}
                        onClick={() => setVistaActiva('roles')}
                    >
                        Lista Roles
                    </button>
                    <button
                        type="button"
                        className={`btn ${vistaActiva === 'permisos' ? 'btn-lista' : 'btn-outline-secondary'}`}
                        onClick={() => setVistaActiva('permisos')}
                    >
                        Lista Permisos
                    </button>
                    <button
                        type="button"
                        className={`btn ${vistaActiva === 'asignaciones' ? 'btn-lista' : 'btn-outline-secondary'}`}
                        onClick={() => setVistaActiva('asignaciones')}
                    >
                        Asignar Permiso a Rol
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

            {/* Modal para formulario de permiso */}
            {mostrarFormularioPermiso && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editandoPermiso ? 'Editar Permiso' : 'Nuevo Permiso'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setMostrarFormularioPermiso(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div >
                                    <label className="form-label">Nombre del Permiso</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formPermiso.nombrePermiso}
                                        onChange={(e) => setFormPermiso({ ...formPermiso, nombrePermiso: e.target.value })}
                                        placeholder="Ej: crear_usuarios, editar_reportes, etc."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setMostrarFormularioPermiso(false)}
                                >
                                    <i className="fas fa-times"></i>
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleGuardarPermiso}
                                    disabled={!formPermiso.nombrePermiso.trim()}
                                >
                                    <i className="fas fa-save"></i>
                                    {editandoPermiso ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para formulario de asignación */}
            {mostrarFormularioAsignacion && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Asignar Permisos a Rol</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setMostrarFormularioAsignacion(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Seleccionar Rol</label>
                                    <select
                                        className="form-select"
                                        value={formAsignacion.idRol}
                                        onChange={(e) => {
                                            const idRol = e.target.value;
                                            // Cargar permisos actuales del rol
                                            const permisosActuales = asignaciones
                                                .filter(a => a.idRol === idRol)
                                                .map(a => a.idPermiso);
                                            setFormAsignacion({
                                                idRol,
                                                permisosSeleccionados: permisosActuales
                                            });
                                        }}
                                    >
                                        <option value="">Seleccione un rol</option>
                                        {roles.map(rol => (
                                            <option key={rol.idRol} value={rol.idRol}>
                                                {rol.nombreRol}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Permisos</label>
                                    <div className="permisos-grid">
                                        {permisos.map(permiso => (
                                            <div key={permiso.idPermiso} className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    value={permiso.idPermiso}
                                                    checked={formAsignacion.permisosSeleccionados.includes(permiso.idPermiso)}
                                                    onChange={(e) => {
                                                        const idPermiso = e.target.value;
                                                        let nuevosPermisos = [...formAsignacion.permisosSeleccionados];
                                                        if (e.target.checked) {
                                                            nuevosPermisos.push(idPermiso);
                                                        } else {
                                                            nuevosPermisos = nuevosPermisos.filter(p => p !== idPermiso);
                                                        }
                                                        setFormAsignacion({
                                                            ...formAsignacion,
                                                            permisosSeleccionados: nuevosPermisos
                                                        });
                                                    }}
                                                />
                                                <label className="form-check-label">
                                                    {permiso.nombrePermiso}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setMostrarFormularioAsignacion(false)}
                                >
                                    <i className="fas fa-times"></i>
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleGuardarAsignacion}
                                    disabled={!formAsignacion.idRol}
                                >
                                    <i className="fas fa-save"></i>
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay para modales */}
            {(mostrarFormularioRol || mostrarFormularioPermiso || mostrarFormularioAsignacion) && (
                <div className="modal-backdrop show"></div>
            )}
        </div>
    );
};

export default GestionRolesPermisos;