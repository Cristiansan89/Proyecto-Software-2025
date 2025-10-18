import { useState, useEffect } from 'react';

const AsignarInsumosForm = ({ proveedor, onSave, onCancel }) => {
    const [availableInsumos, setAvailableInsumos] = useState([]);
    const [assignedInsumos, setAssignedInsumos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredInsumos, setFilteredInsumos] = useState([]);
    const [loading, setLoading] = useState(false);

    // Datos de ejemplo de insumos disponibles
    const mockInsumos = [
        {
            idInsumo: '1',
            nombreInsumo: 'Arroz',
            descripcion: 'Arroz blanco de grano largo',
            unidadDeMedida: 'kg'
        },
        {
            idInsumo: '2',
            nombreInsumo: 'Aceite de Cocina',
            descripcion: 'Aceite vegetal para cocinar',
            unidadDeMedida: 'litros'
        },
        {
            idInsumo: '3',
            nombreInsumo: 'Sal',
            descripcion: 'Sal de mesa refinada',
            unidadDeMedida: 'kg'
        },
        {
            idInsumo: '4',
            nombreInsumo: 'Azúcar',
            descripcion: 'Azúcar blanca refinada',
            unidadDeMedida: 'kg'
        },
        {
            idInsumo: '5',
            nombreInsumo: 'Cebolla',
            descripcion: 'Cebolla blanca fresca',
            unidadDeMedida: 'kg'
        },
        {
            idInsumo: '6',
            nombreInsumo: 'Tomate',
            descripcion: 'Tomate rojo fresco',
            unidadDeMedida: 'kg'
        },
        {
            idInsumo: '7',
            nombreInsumo: 'Pollo',
            descripcion: 'Pollo entero fresco',
            unidadDeMedida: 'kg'
        },
        {
            idInsumo: '8',
            nombreInsumo: 'Pasta',
            descripcion: 'Pasta tipo espagueti',
            unidadDeMedida: 'paquetes'
        }
    ];

    const calificaciones = [
        { value: 'Excelente', label: 'Excelente', color: 'success' },
        { value: 'Aceptable', label: 'Aceptable', color: 'warning' },
        { value: 'Poco Eficiente', label: 'Poco Eficiente', color: 'danger' }
    ];

    useEffect(() => {
        loadInsumos();
        initializeAssignedInsumos();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        filterInsumos();
    }, [availableInsumos, searchTerm, assignedInsumos]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadInsumos = async () => {
        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 300));
            setAvailableInsumos(mockInsumos);
        } catch (error) {
            console.error('Error al cargar insumos:', error);
        }
    };

    const initializeAssignedInsumos = () => {
        if (proveedor?.insumos) {
            // Convertir insumos del proveedor al formato interno
            const assigned = proveedor.insumos.map(insumo => ({
                ...insumo,
                calificacion: insumo.calificacion || 'Aceptable'
            }));
            setAssignedInsumos(assigned);
        }
    };

    const filterInsumos = () => {
        let filtered = availableInsumos;

        // Filtrar por término de búsqueda
        if (searchTerm.trim()) {
            filtered = filtered.filter(insumo =>
                insumo.nombreInsumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                insumo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                insumo.unidadDeMedida.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Excluir insumos ya asignados
        const assignedIds = assignedInsumos.map(item => item.idInsumo);
        filtered = filtered.filter(insumo => !assignedIds.includes(insumo.idInsumo));

        setFilteredInsumos(filtered);
    };

    const handleAssignInsumo = (insumo) => {
        const newAssignment = {
            idInsumo: insumo.idInsumo,
            nombreInsumo: insumo.nombreInsumo,
            descripcion: insumo.descripcion,
            unidadDeMedida: insumo.unidadDeMedida,
            calificacion: 'Aceptable' // Calificación por defecto
        };

        setAssignedInsumos(prev => [...prev, newAssignment]);
    };

    const handleUnassignInsumo = (idInsumo) => {
        setAssignedInsumos(prev => prev.filter(item => item.idInsumo !== idInsumo));
    };

    const handleCalificacionChange = (idInsumo, calificacion) => {
        setAssignedInsumos(prev => prev.map(item =>
            item.idInsumo === idInsumo
                ? { ...item, calificacion }
                : item
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Enviar solo los datos necesarios para la relación
            const insumosToSave = assignedInsumos.map(item => ({
                idInsumo: item.idInsumo,
                nombreInsumo: item.nombreInsumo,
                calificacion: item.calificacion
            }));

            onSave(insumosToSave);
        } catch (error) {
            console.error('Error al asignar insumos:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCalificacionBadge = (calificacion) => {
        const calif = calificaciones.find(c => c.value === calificacion);
        return calif ? `bg-${calif.color}` : 'bg-secondary';
    };

    return (
        <div className="asignar-insumos-form">
            <form onSubmit={handleSubmit}>
                {/* Información del proveedor */}
                <div className="proveedor-info">
                    <div className="alert alert-info">
                        <div className="d-flex align-items-center">
                            <div>
                                <h6 className="mb-1">Asignando insumos a:</h6>
                                <i className="fas fa-info-circle me-1 mx-2"></i>
                                <strong>{proveedor?.razonSocial}</strong>
                                <div className="text-muted small mx-2">
                                    <i className="fas fa-map-marker-alt me-1"></i>
                                    {proveedor?.direccion}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* Panel izquierdo - Insumos disponibles */}
                    <div className="col-md-6">
                        <div className="panel-section">
                            <h5 className="section-title">
                                <i className="fas fa-boxes me-2"></i>
                                Insumos Disponibles
                                <span className="badge bg-primary ms-2">{filteredInsumos.length}</span>
                            </h5>

                            <div className="search-bar mb-2 mt-3">
                                <i className="fas fa-search search-icon"></i>
                                <input
                                    type="text"
                                    className="form-control search-input"
                                    placeholder="Buscar insumos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="insumos-available-list">
                                {filteredInsumos.map((insumo) => (
                                    <div key={insumo.idInsumo} className="insumo-available-item">
                                        <div className="insumo-info">
                                            <div className="insumo-name">{insumo.nombreInsumo}</div>
                                            <div className="insumo-details">
                                                <span className="badge bg-secondary me-2">{insumo.unidadDeMedida}</span>
                                                <small className="text-muted">{insumo.descripcion}</small>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleAssignInsumo(insumo)}
                                            title="Asignar insumo"
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                    </div>
                                ))}

                                {filteredInsumos.length === 0 && (
                                    <div className="empty-panel">
                                        <i className="fas fa-search text-muted"></i>
                                        <p className="text-muted mb-0">
                                            {searchTerm ? 'No se encontraron insumos' : 'Todos los insumos están asignados'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Panel derecho - Insumos asignados */}
                    <div className="col-md-6">
                        <div className="panel-section">
                            <h5 className="section-title">
                                <i className="fas fa-check-circle me-2"></i>
                                Insumos Asignados
                                <span className="badge bg-success ms-2">{assignedInsumos.length}</span>
                            </h5>

                            <div className="insumos-assigned-list">
                                {assignedInsumos.map((insumo) => (
                                    <div key={insumo.idInsumo} className="insumo-assigned-item">
                                        <div className="insumo-info">
                                            <div className="insumo-name">{insumo.nombreInsumo}</div>
                                            <div className="insumo-details">
                                                <span className="badge bg-secondary me-2">{insumo.unidadDeMedida}</span>
                                                <small className="text-muted">{insumo.descripcion}</small>
                                            </div>
                                        </div>

                                        <div className="calificacion-controls">
                                            <select
                                                className="form-select form-select-sm"
                                                value={insumo.calificacion}
                                                onChange={(e) => handleCalificacionChange(insumo.idInsumo, e.target.value)}
                                                title="Calificación del proveedor para este insumo"
                                            >
                                                {calificaciones.map(cal => (
                                                    <option key={cal.value} value={cal.value}>
                                                        {cal.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <span className={`badge ms-2 ${getCalificacionBadge(insumo.calificacion)}`}>
                                                {insumo.calificacion}
                                            </span>

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger ms-2"
                                                onClick={() => handleUnassignInsumo(insumo.idInsumo)}
                                                title="Desasignar insumo"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {assignedInsumos.length === 0 && (
                                    <div className="empty-panel">
                                        <i className="fas fa-box-open text-muted"></i>
                                        <p className="text-muted mb-0">No hay insumos asignados</p>
                                        <small className="text-muted">
                                            Selecciona insumos de la lista de la izquierda
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen */}
                {assignedInsumos.length > 0 && (
                    <div className="assignment-summary mt-4">
                        <div className="alert alert-success">
                            <h6 className="mb-2">
                                <i className="fas fa-chart-pie me-2"></i>
                                Resumen de Asignaciones
                            </h6>
                            <div className="row">
                                {calificaciones.map(cal => {
                                    const count = assignedInsumos.filter(i => i.calificacion === cal.value).length;
                                    return (
                                        <div key={cal.value} className="col-md-4">
                                            <span className={`badge bg-${cal.color} me-2`}>{cal.label}</span>
                                            <span>{count} insumo{count !== 1 ? 's' : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Botones */}
                <div className="form-actions mt-4">
                    <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        <i className="fas fa-times"></i>
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || assignedInsumos.length === 0}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i>
                                Guardar Asignaciones ({assignedInsumos.length})
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AsignarInsumosForm;