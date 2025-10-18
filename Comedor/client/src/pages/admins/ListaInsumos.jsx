import { useState, useEffect } from 'react';
import InsumoForm from '../../components/InsumoForm';


// Datos de ejemplo - en producción vendrían del backend
const mockInsumos = [
    {
        idInsumo: '1',
        nombreInsumo: 'Arroz',
        descripcion: 'Arroz blanco de grano largo',
        unidadDeMedida: 'kg',
        stockMinimo: 50,
        stockActual: 120
    },
    {
        idInsumo: '2',
        nombreInsumo: 'Aceite de Cocina',
        descripcion: 'Aceite vegetal para cocinar',
        unidadDeMedida: 'litros',
        stockMinimo: 20,
        stockActual: 45
    },
    {
        idInsumo: '3',
        nombreInsumo: 'Sal',
        descripcion: 'Sal de mesa refinada',
        unidadDeMedida: 'kg',
        stockMinimo: 10,
        stockActual: 25
    },
    {
        idInsumo: '4',
        nombreInsumo: 'Azúcar',
        descripcion: 'Azúcar blanca refinada',
        unidadDeMedida: 'kg',
        stockMinimo: 30,
        stockActual: 8
    },
    {
        idInsumo: '5',
        nombreInsumo: 'Cebolla',
        descripcion: 'Cebolla blanca fresca',
        unidadDeMedida: 'kg',
        stockMinimo: 15,
        stockActual: 22
    }
];

const ListaInsumos = () => {
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedInsumo, setSelectedInsumo] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredInsumos, setFilteredInsumos] = useState([]);



    useEffect(() => {
        loadInsumos();
    }, []);

    useEffect(() => {
        filterInsumos();
    }, [insumos, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadInsumos = async () => {
        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 500));
            setInsumos(mockInsumos);
        } catch (error) {
            console.error('Error al cargar insumos:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterInsumos = () => {
        if (!searchTerm.trim()) {
            setFilteredInsumos(insumos);
        } else {
            const filtered = insumos.filter(insumo =>
                insumo.nombreInsumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                insumo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                insumo.unidadDeMedida.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredInsumos(filtered);
        }
    };

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

    const handleDelete = async (insumoId) => {
        if (window.confirm('¿Está seguro de que desea eliminar este insumo?')) {
            try {
                // Simular llamada a API
                await new Promise(resolve => setTimeout(resolve, 500));
                setInsumos(prev => prev.filter(insumo => insumo.idInsumo !== insumoId));
                console.log('Insumo eliminado exitosamente');
            } catch (error) {
                console.error('Error al eliminar insumo:', error);
            }
        }
    };

    const handleSaveInsumo = async (insumoData) => {
        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (modalMode === 'create') {
                const newInsumo = {
                    ...insumoData,
                    idInsumo: Date.now().toString()
                };
                setInsumos(prev => [newInsumo, ...prev]);
                console.log('Insumo creado exitosamente');
            } else if (modalMode === 'edit') {
                setInsumos(prev => prev.map(insumo =>
                    insumo.idInsumo === selectedInsumo.idInsumo
                        ? { ...insumo, ...insumoData }
                        : insumo
                ));
                console.log('Insumo actualizado exitosamente');
            }

            setShowModal(false);
        } catch (error) {
            console.error('Error al guardar insumo:', error);
        }
    };

    const handleCloseModal = () => {
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
                        onClick={() => handleCreate('create')}
                    >
                        <i className="fas fa-plus me-2"></i>
                        Nuevo Insumo
                    </button>
                </div>
            </div>
            <div className="page-header">
                <div className="header-stats">
                    <div className="stat-card-stock">

                        <div className="summary-number-stock mx-1">
                            <i className="fas fa-boxes text-primary mx-1"></i>
                            {insumos.length}
                        </div>
                        <div className="summary-label-stock">Total Insumos</div>
                    </div>

                    <div className="stat-card-alert">

                        <div className="summary-number-alert mx-1">
                            <i className="fas fa-exclamation-triangle text-danger mx-1"></i>
                            {insumos.filter(i => i.stockActual <= i.stockMinimo).length}

                        </div>
                        <div className="summary-label-alert">Stock Bajo</div>
                    </div>
                </div>
            </div>
            {/* Filtros y búsqueda */}
            <div className="filters-section">
                <div className="search-bar">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por nombre, descripción o unidad..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div >
                <div className="vista-insumos">
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Nombre del Insumo</th>
                                    <th>Descripción</th>
                                    <th>Unidad de Medida</th>
                                    <th>Stock Mínimo</th>
                                    <th>Stock Actual</th>
                                    <th>Estado</th>
                                    <th >Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInsumos.map((insumo) => {
                                    const stockStatus = getStockStatus(insumo);
                                    return (
                                        <tr key={insumo.idInsumo}>
                                            <td>
                                                <div className="item-info">

                                                    <div>
                                                        <div className="item-name">{insumo.nombreInsumo}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-muted">
                                                    {insumo.descripcion || 'Sin descripción'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="bd-indigo-500">
                                                    {insumo.unidadDeMedida}
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
                                                        onClick={() => handleDelete(insumo.idInsumo)}
                                                        title="Eliminar"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredInsumos.length === 0 && (
                        <div className="empty-state">
                            <i className="fas fa-search empty-icon"></i>
                            <h5>No se encontraron insumos</h5>
                            <p>No hay insumos que coincidan con tu búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>
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
                                    onClick={handleCloseModal}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <InsumoForm
                                    insumo={selectedInsumo}
                                    mode={modalMode}
                                    onSave={handleSaveInsumo}
                                    onCancel={handleCloseModal}
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