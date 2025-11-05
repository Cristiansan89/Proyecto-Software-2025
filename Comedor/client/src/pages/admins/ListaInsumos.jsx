import { useState, useEffect } from 'react';
import InsumoForm from '../../components/InsumoForm';
import insumoService from '../../services/insumoService';

const ListaInsumos = () => {
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedInsumo, setSelectedInsumo] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');



    useEffect(() => {
        loadInsumos();
    }, []);

    const loadInsumos = async () => {
        console.log('ListaInsumos: Iniciando loadInsumos');
        try {
            setLoading(true);
            const data = await insumoService.getAll();
            console.log('ListaInsumos: Datos recibidos:', data);
            setInsumos(data);
        } catch (error) {
            console.error('Error al cargar insumos:', error);
            alert('Error al cargar los insumos');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar insumos
    const filteredInsumos = insumos.filter(insumo => {
        const matchesSearch = insumo.nombreInsumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (insumo.descripcion && insumo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
            insumo.unidadMedida.toLowerCase().includes(searchTerm.toLowerCase()) ||
            insumo.categoria.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'todos' || insumo.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreate = () => {
        setSelectedInsumo(null);
        setModalMode('create');
        setShowModal(true);
    };

    const handleEdit = (insumo) => {
        setSelectedInsumo(insumo);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (insumo) => {
        setSelectedInsumo(insumo);
        setModalMode('view');
        setShowModal(true);
    };

    const handleDelete = async (insumo) => {
        if (window.confirm(`¿Está seguro de eliminar el insumo "${insumo.nombreInsumo}"?`)) {
            try {
                await insumoService.delete(insumo.idInsumo);
                alert('Insumo eliminado correctamente');
                loadInsumos();
            } catch (error) {
                console.error('Error al eliminar insumo:', error);
                if (error.response?.data?.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else {
                    alert('Error al eliminar el insumo');
                }
            }
        }
    };

    const handleChangeStatus = async (insumo, nuevoEstado) => {
        try {
            await insumoService.cambiarEstado(insumo.idInsumo, nuevoEstado);
            alert(`Insumo ${nuevoEstado.toLowerCase()} correctamente`);
            loadInsumos();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('Error al cambiar el estado del insumo');
        }
    };

    const handleSave = () => {
        setShowModal(false);
        setSelectedInsumo(null);
        loadInsumos();
        alert(`Insumo ${modalMode === 'create' ? 'creado' : 'actualizado'} correctamente`);
    };

    const handleCancel = () => {
        setShowModal(false);
        setSelectedInsumo(null);
    };

    const getStockStatus = (insumo) => {
        if (insumo.stockActual <= insumo.stockMinimo) {
            return { status: 'low', color: 'text-danger', icon: 'fa-exclamation-triangle' };
        } else if (insumo.stockActual <= insumo.stockMinimo * 1.5) {
            return { status: 'medium', color: 'text-warning', icon: 'fa-exclamation-circle' };
        } else {
            return { status: 'good', color: 'text-success', icon: 'fa-check-circle' };
        }
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
                            <i className="fas fa-boxes me-2"></i>
                            Gestión de Insumos
                        </h1>
                        <p className="page-subtitle">
                            Administra los insumos disponibles en el comedor
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary-new"
                        onClick={handleCreate}
                    >
                        <i className="fas fa-plus me-2"></i>
                        Nuevo Insumo
                    </button>
                </div>
            </div>
            <div className="page-header">
                <div className="header-stats">
                    <div className="stat-card-users">
                        <div className="stat-number-users">{insumos.length}</div>
                        <div className="stat-label-users">Total</div>
                    </div>
                    <div className="stat-card-stock">
                        <div className="summary-number-stock">{insumos.filter(i => i.estado === 'Activo').length}</div>
                        <div className="summary-label-stock">Activos</div>
                    </div>
                    <div className="stat-card-alert">
                        <div className="summary-number-alert">{insumos.filter(i => i.stockActual <= i.stockMinimo).length}</div>
                        <div className="summary-label-alert">Stock Bajo</div>
                    </div>
                    <div className="stat-card-users">
                        <div className="stat-number-users">{insumos.filter(i => i.estado === 'Inactivo').length}</div>
                        <div className="stat-label-users">Inactivos</div>
                    </div>
                </div>
            </div>
            {/* Filtros y búsqueda */}
            <div className="search-filters">
                <div className="search-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por nombre, descripción, unidad o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-actions">
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="Activo">Activos</option>
                        <option value="Inactivo">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Información de resultados */}
            <div className="results-info">
                <div className="results-count">
                    <span>Mostrando {filteredInsumos.length} de {insumos.length} insumos</span>
                    {searchTerm && <span className="filter-indicator">filtrado por "{searchTerm}"</span>}
                </div>
            </div>



            <div className="table-container">
                {loading ? (
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Cargando grados...</p>
                    </div>
                ) : (
                    <div className="scrollable-table">
                        <div className="table-body-scroll">
                            <table className="data-table">
                                <thead className="table-header-fixed">
                                    <tr>
                                        <th>Insumo</th>
                                        <th>Descripción</th>
                                        <th>Categoría</th>
                                        <th>Unidad Medida</th>
                                        <th>Stock Mínimo</th>
                                        <th>Stock Actual</th>
                                        <th>Estado del Stock</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInsumos.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="no-data">
                                                <p>No se encontraron insumos</p>
                                            </td>
                                        </tr>

                                    )}
                                    {filteredInsumos.map((insumo) => {
                                        const stockStatus = getStockStatus(insumo);
                                        return (
                                            <tr key={insumo.idInsumo}>
                                                <td>
                                                    <div className="insumo-name">
                                                        <i className="fas fa-box me-2"></i>
                                                        {insumo.nombreInsumo}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="insumo-description">
                                                        {insumo.descripcion || 'Sin descripción'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="categoria-badge">
                                                        {insumo.categoria}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="unidad-medida">
                                                        {insumo.unidadMedida}
                                                    </span>
                                                </td>
                                                <td>{insumo.stockMinimo}</td>
                                                <td>
                                                    <span className={`fw-bold ${stockStatus.color}`}>
                                                        {insumo.stockActual}
                                                    </span>
                                                </td>
                                                <td>
                                                    <i className={`fas ${stockStatus.icon} ${stockStatus.color} me-1`}></i>
                                                    <span className={stockStatus.color}>
                                                        {stockStatus.status === 'low' ? 'Stock Bajo' :
                                                            stockStatus.status === 'medium' ? 'Stock Medio' : 'Stock Bueno'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge-insumo ${insumo.estado.toLowerCase()}`}>
                                                        {insumo.estado}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-action btn-view"
                                                            onClick={() => handleView(insumo)}
                                                            title="Ver detalles"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button
                                                            className="btn-action btn-edit"
                                                            onClick={() => handleEdit(insumo)}
                                                            title="Editar"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn-action btn-delete"
                                                            onClick={() => handleDelete(insumo)}
                                                            title="Eliminar"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                        <button
                                                            className={`btn-action ${insumo.estado === 'Activo' ? 'btn-delete' : 'btn-assign'}`}
                                                            onClick={() => handleChangeStatus(insumo, insumo.estado === 'Activo' ? 'Inactivo' : 'Activo')}
                                                            title={insumo.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                                        >
                                                            <i className={`fas ${insumo.estado === 'Activo' ? 'fa-times' : 'fa-check'}`}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                )
                };
            </div >
            {/* Modal */}
            {
                showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content insumo-modal">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-box me-2"></i>
                                    {modalMode === 'create' && 'Nuevo Insumo'}
                                    {modalMode === 'edit' && 'Editar Insumo'}
                                    {modalMode === 'view' && 'Detalles del Insumo'}
                                </h5>
                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={handleCancel}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <InsumoForm
                                    insumo={selectedInsumo}
                                    mode={modalMode}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ListaInsumos;