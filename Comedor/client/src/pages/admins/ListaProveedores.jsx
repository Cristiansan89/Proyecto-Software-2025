import { useState, useEffect } from 'react';
import ProveedorForm from '../../components/ProveedorForm';
import AsignarInsumosForm from '../../components/AsignarInsumosForm';

const ListaProveedores = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showInsumosModal, setShowInsumosModal] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProveedores, setFilteredProveedores] = useState([]);
    const [estadoFilter, setEstadoFilter] = useState('todos');

    // Datos de ejemplo - en producción vendrían del backend
    const mockProveedores = [
        {
            idProveedor: '1',
            razonSocial: 'Distribuidora El Buen Gusto S.A.',
            direccion: 'Av. Principal 123, Ciudad',
            telefono: '555-0123',
            estado: 'Activo',
            insumos: [
                { idInsumo: '1', nombreInsumo: 'Arroz', calificacion: 'Excelente' },
                { idInsumo: '3', nombreInsumo: 'Sal', calificacion: 'Aceptable' }
            ],
            fechaRegistro: '2024-01-15'
        },
        {
            idProveedor: '2',
            razonSocial: 'Abarrotes Los Hermanos Ltda.',
            direccion: 'Calle Comercio 456, Centro',
            telefono: '555-0456',
            estado: 'Activo',
            insumos: [
                { idInsumo: '2', nombreInsumo: 'Aceite de Cocina', calificacion: 'Excelente' },
                { idInsumo: '4', nombreInsumo: 'Azúcar', calificacion: 'Aceptable' },
                { idInsumo: '5', nombreInsumo: 'Cebolla', calificacion: 'Excelente' }
            ],
            fechaRegistro: '2024-02-10'
        },
        {
            idProveedor: '3',
            razonSocial: 'Verduras Frescas del Campo',
            direccion: 'Mercado Central Local 78',
            telefono: '555-0789',
            estado: 'Activo',
            insumos: [
                { idInsumo: '5', nombreInsumo: 'Cebolla', calificacion: 'Aceptable' }
            ],
            fechaRegistro: '2024-03-20'
        },
        {
            idProveedor: '4',
            razonSocial: 'Productos Básicos del Sur',
            direccion: 'Zona Industrial 45',
            telefono: '555-0321',
            estado: 'Inactivo',
            insumos: [
                { idInsumo: '1', nombreInsumo: 'Arroz', calificacion: 'Poco Eficiente' }
            ],
            fechaRegistro: '2023-12-05'
        }
    ];

    useEffect(() => {
        loadProveedores();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        filterProveedores();
    }, [proveedores, searchTerm, estadoFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadProveedores = async () => {
        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 500));
            setProveedores(mockProveedores);
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterProveedores = () => {
        let filtered = proveedores;

        // Filtrar por estado
        if (estadoFilter !== 'todos') {
            filtered = filtered.filter(proveedor => proveedor.estado === estadoFilter);
        }

        // Filtrar por término de búsqueda
        if (searchTerm.trim()) {
            filtered = filtered.filter(proveedor =>
                proveedor.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                proveedor.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                proveedor.telefono?.includes(searchTerm) ||
                proveedor.insumos?.some(insumo =>
                    insumo.nombreInsumo.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        setFilteredProveedores(filtered);
    };

    const handleCreate = () => {
        setSelectedProveedor(null);
        setModalMode('create');
        setShowModal(true);
    };

    const handleEdit = (proveedor) => {
        setSelectedProveedor(proveedor);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (proveedor) => {
        setSelectedProveedor(proveedor);
        setModalMode('view');
        setShowModal(true);
    };

    const handleAssignInsumos = (proveedor) => {
        setSelectedProveedor(proveedor);
        setShowInsumosModal(true);
    };

    const handleDelete = async (proveedorId) => {
        if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
            try {
                // Simular llamada a API
                await new Promise(resolve => setTimeout(resolve, 500));
                setProveedores(prev => prev.filter(proveedor => proveedor.idProveedor !== proveedorId));
                console.log('Proveedor eliminado exitosamente');
            } catch (error) {
                console.error('Error al eliminar proveedor:', error);
            }
        }
    };

    const handleSaveProveedor = async (proveedorData) => {
        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (modalMode === 'create') {
                const newProveedor = {
                    ...proveedorData,
                    idProveedor: Date.now().toString(),
                    insumos: [],
                    fechaRegistro: new Date().toISOString().split('T')[0]
                };
                setProveedores(prev => [newProveedor, ...prev]);
                console.log('Proveedor creado exitosamente');
            } else if (modalMode === 'edit') {
                setProveedores(prev => prev.map(proveedor =>
                    proveedor.idProveedor === selectedProveedor.idProveedor
                        ? { ...proveedor, ...proveedorData }
                        : proveedor
                ));
                console.log('Proveedor actualizado exitosamente');
            }

            setShowModal(false);
        } catch (error) {
            console.error('Error al guardar proveedor:', error);
        }
    };

    const handleSaveInsumosAsignados = async (insumosData) => {
        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 1000));

            setProveedores(prev => prev.map(proveedor =>
                proveedor.idProveedor === selectedProveedor.idProveedor
                    ? { ...proveedor, insumos: insumosData }
                    : proveedor
            ));

            setShowInsumosModal(false);
            console.log('Insumos asignados exitosamente');
        } catch (error) {
            console.error('Error al asignar insumos:', error);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProveedor(null);
    };

    const handleCloseInsumosModal = () => {
        setShowInsumosModal(false);
        setSelectedProveedor(null);
    };

    const getCalificacionBadge = (calificacion) => {
        const badges = {
            'Excelente': 'bg-success',
            'Aceptable': 'bg-warning',
            'Poco Eficiente': 'bg-danger'
        };
        return badges[calificacion] || 'bg-secondary';
    };

    const getEstadoBadge = (estado) => {
        return estado === 'Activo' ? 'bg-success' : 'bg-secondary';
    };

    if (loading) {
        return (
            <div>
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="title-section">
                        <h1 className="page-title">
                            <i className="fas fa-truck me-2"></i>
                            Gestión de Proveedores
                        </h1>
                        <p className="page-subtitle">
                            Administra los proveedores y sus insumos disponibles
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary-new"
                        onClick={() => handleCreate('create')}
                    >
                        <i className="fas fa-plus me-2"></i>
                        Nuevo Proveedor
                    </button>
                </div>

            </div>
            <div className="page-header">
                <div className="header-stats">
                    <div className="stat-card-proveedor">
                        <div>
                            <div className="summary-number-proveedor mx-1">
                                <i className="fas fa-truck mx-1" style={{ color: '#1F48F9' }}></i>
                                {proveedores.length}
                            </div>
                            <div className="summary-label-proveedor">Total Proveedores</div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Filtros y Búsqueda */}
            <div className="filters-section">

                <div className="search-bar">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        className="form-control search-input"
                        placeholder="Buscar por razón social, dirección, teléfono o insumos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-md-3">
                    <select
                        className="form-control"
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="Activo">Activos</option>
                        <option value="Inactivo">Inactivos</option>
                    </select>
                </div>
            </div>
            {/* Tabla de Proveedores */}
            <div className="vista-proveedores">
                <div className="table-container">
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Proveedor</th>
                                    <th>Contacto</th>
                                    <th>Insumos Asignados</th>
                                    <th>Estado</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProveedores.map((proveedor) => (
                                    <tr key={proveedor.idProveedor}>
                                        <td>
                                            <div className="item-info">
                                                <div>
                                                    <div className="item-name">{proveedor.razonSocial}</div>
                                                    <div className="item-detail text-muted">
                                                        <i className="fas fa-map-marker-alt me-1"></i>
                                                        {proveedor.direccion}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info">
                                                <div>
                                                    {proveedor.telefono}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="insumos-list">
                                                {proveedor.insumos.length > 0 ? (
                                                    <div>
                                                        {proveedor.insumos.slice(0, 5).map((insumo, index) => (
                                                            <div key={index} className="insumo-item">
                                                                <span className="insumo-name">{insumo.nombreInsumo}</span>
                                                                <span className={`badge ms-2 ${getCalificacionBadge(insumo.calificacion)}`}>
                                                                    {insumo.calificacion}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {proveedor.insumos.length > 5 && (
                                                            <small className="text-muted">
                                                                +{proveedor.insumos.length - 5} más
                                                            </small>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Sin insumos asignados</span>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <span className={`badge ${getEstadoBadge(proveedor.estado)}`}>
                                                {proveedor.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-action btn-view"
                                                    onClick={() => handleView(proveedor)}
                                                    title="Ver detalles"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="btn-action btn-edit"
                                                    onClick={() => handleEdit(proveedor)}
                                                    title="Editar"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn-action btn-assign"
                                                    onClick={() => handleAssignInsumos(proveedor)}
                                                    title="Asignar Insumos"
                                                >
                                                    <i className="fas fa-boxes"></i>
                                                </button>
                                                <button
                                                    className="btn-action btn-delete"
                                                    onClick={() => handleDelete(proveedor.idProveedor)}
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

                    {filteredProveedores.length === 0 && (
                        <div className="empty-state">
                            <i className="fas fa-search empty-icon"></i>
                            <h5>No se encontraron proveedores</h5>
                            <p>No hay proveedores que coincidan con tu búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* Modal para Proveedor */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content-proveedores-insumos proveedor-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-truck me-2"></i>
                                {modalMode === 'create' && 'Nuevo Proveedor'}
                                {modalMode === 'edit' && 'Editar Proveedor'}
                                {modalMode === 'view' && 'Detalles del Proveedor'}
                            </h5>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <ProveedorForm
                                proveedor={selectedProveedor}
                                mode={modalMode}
                                onSave={handleSaveProveedor}
                                onCancel={handleCloseModal}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Asignar Insumos */}
            {showInsumosModal && (
                <div className="modal-overlay">
                    <div className="modal-content insumos-asignacion-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-boxes me-2"></i>
                                Asignar Insumos - {selectedProveedor?.razonSocial}
                            </h5>
                            <button className="modal-close" onClick={handleCloseInsumosModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <AsignarInsumosForm
                                proveedor={selectedProveedor}
                                onSave={handleSaveInsumosAsignados}
                                onCancel={handleCloseInsumosModal}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaProveedores;