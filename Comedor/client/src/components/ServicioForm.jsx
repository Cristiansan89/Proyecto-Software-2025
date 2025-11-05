import { useState, useEffect } from 'react';
import servicioService from '../services/servicioService.js';
import turnoService from '../services/turnoService.js';
import servicioTurnoService from '../services/servicioTurnoService.js';

const ServicioForm = ({ servicio, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre: servicio?.nombre || '',
        descripcion: servicio?.descripcion || '',
        estado: servicio?.estado || 'Activo',
        idTurno: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [turnos, setTurnos] = useState([]);
    const [turnosAsignados, setTurnosAsignados] = useState([]);

    // Función para cargar los turnos disponibles
    const loadTurnos = async () => {
        try {
            const turnosData = await turnoService.getAll();
            setTurnos(turnosData);
        } catch (error) {
            console.error('Error al cargar turnos:', error);
        }
    };

    // Función para cargar los turnos ya asignados al servicio
    const loadTurnosAsignados = async (idServicio) => {
        try {
            const turnosAsignadosData = await servicioTurnoService.getTurnosByServicio(idServicio);
            setTurnosAsignados(turnosAsignadosData);
        } catch (error) {
            console.error('Error al cargar turnos asignados:', error);
        }
    };

    // Función para asignar un turno al servicio
    const handleAsignarTurno = async () => {
        if (!formData.idTurno || !servicio?.idServicio) return;

        try {
            await servicioTurnoService.create({
                idServicio: servicio.idServicio,
                idTurno: parseInt(formData.idTurno)
            });

            // Recargar turnos asignados
            await loadTurnosAsignados(servicio.idServicio);

            // Limpiar selección
            setFormData(prev => ({ ...prev, idTurno: '' }));

            alert('Turno asignado correctamente');
        } catch (error) {
            console.error('Error al asignar turno:', error);
            alert('Error al asignar el turno: ' + (error.response?.data?.message || error.message));
        }
    };

    // Función para desasignar un turno del servicio
    const handleDesasignarTurno = async (idTurno) => {
        if (!servicio?.idServicio) return;

        if (window.confirm('¿Está seguro de que desea desasignar este turno?')) {
            try {
                await servicioTurnoService.delete(servicio.idServicio, idTurno);

                // Recargar turnos asignados
                await loadTurnosAsignados(servicio.idServicio);

                alert('Turno desasignado correctamente');
            } catch (error) {
                console.error('Error al desasignar turno:', error);
                alert('Error al desasignar el turno: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validaciones requeridas
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.length > 100) {
            newErrors.nombre = 'El nombre no puede tener más de 100 caracteres';
        }

        if (!formData.descripcion.trim()) {
            newErrors.descripcion = 'La descripción es requerida';
        } else if (formData.descripcion.length > 100) {
            newErrors.descripcion = 'La descripción no puede tener más de 100 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Preparar datos para enviar al backend
            const servicioData = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                estado: formData.estado
            };

            let savedServicio;

            // Crear o actualizar servicio
            if (mode === 'create') {
                savedServicio = await servicioService.create(servicioData);
            } else {
                savedServicio = await servicioService.update(servicio.idServicio, servicioData);
            }

            onSave(savedServicio);
        } catch (error) {
            console.error('Error al guardar servicio:', error);

            // Mostrar error al usuario
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err => `${err.field}: ${err.message}`).join('\\n');
                alert(`Errores de validación:\\n${errorMessages}`);
            } else {
                alert('Error al guardar el servicio. Por favor, inténtelo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    useEffect(() => {
        // Cargar turnos al montar el componente
        loadTurnos();

        if (servicio) {
            setFormData({
                nombre: servicio.nombre || '',
                descripcion: servicio.descripcion || '',
                estado: servicio.estado || 'Activo',
                idTurno: ''
            });

            // Si estamos editando un servicio existente, cargar sus turnos asignados
            if (servicio.idServicio && mode !== 'create') {
                loadTurnosAsignados(servicio.idServicio);
            }
        }
    }, [servicio, mode]); return (
        <div className="servicio-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Información del Servicio */}
                    <div>
                        <h5 className="section-title">
                            <i className="fas fa-utensils me-2"></i>
                            Información del Servicio
                        </h5>

                        <div className="form-group">
                            <label htmlFor="nombre" className="form-label required mt-3">
                                Nombre del Servicio
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                value={formData.nombre}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                placeholder="Ej: Desayuno, Almuerzo, Merienda"
                                maxLength="100"
                            />
                            {errors.nombre && (
                                <div className="invalid-feedback">{errors.nombre}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="descripcion" className="form-label required mt-3">
                                Descripción
                            </label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                placeholder="Describe brevemente el servicio"
                                rows="3"
                                maxLength="100"
                            />
                            {errors.descripcion && (
                                <div className="invalid-feedback">{errors.descripcion}</div>
                            )}
                            <small className="form-text text-muted">
                                {formData.descripcion.length}/100 caracteres
                            </small>
                        </div>

                        {/* Gestión de Turnos */}
                        <div className="form-group">
                            <label className="form-label mt-3">
                                <i className="fas fa-clock me-2"></i>
                                Gestión de Turnos
                            </label>

                            {/* Mostrar turnos ya asignados */}
                            {mode !== 'create' && turnosAsignados.length > 0 && (
                                <div className="mb-3">
                                    <h6>Turnos Asignados:</h6>
                                    <div className="row">
                                        {turnosAsignados.map((turno) => (
                                            <div key={turno.idTurno} className="col-md-6 mb-2">
                                                <div className="card card-body p-2 d-flex flex-row justify-content-between align-items-center">
                                                    <span>
                                                        <strong>{turno.nombreTurno}</strong><br />
                                                        <small className="text-muted">
                                                            {turno.horaInicio} - {turno.horaFin}
                                                        </small>
                                                    </span>
                                                    {!isViewMode && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDesasignarTurno(turno.idTurno)}
                                                            title="Desasignar turno"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Asignar nuevo turno */}
                            {!isViewMode && mode !== 'create' && (
                                <div className="row">
                                    <div className="col-md-8">
                                        <select
                                            id="idTurno"
                                            name="idTurno"
                                            className="form-control"
                                            value={formData.idTurno}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Seleccione un turno para asignar</option>
                                            {turnos
                                                .filter(turno => !turnosAsignados.some(ta => ta.idTurno === turno.idTurno))
                                                .map((turno) => (
                                                    <option key={turno.idTurno} value={turno.idTurno}>
                                                        {turno.nombre} ({turno.horaInicio} - {turno.horaFin})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-success"
                                            onClick={handleAsignarTurno}
                                            disabled={!formData.idTurno}
                                        >
                                            <i className="fas fa-plus"></i> Asignar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mode === 'create' && (
                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Primero cree el servicio, luego podrá asignar turnos.
                                </div>
                            )}
                        </div>

                        {/* Estado */}
                        <div className="form-group">
                            <label htmlFor="estado" className="form-label mt-3">
                                Estado
                            </label>
                            <select
                                id="estado"
                                name="estado"
                                className="form-control"
                                value={formData.estado}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                            >
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="form-actions mt-4">
                    <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        <i className="fas fa-times"></i>
                        {isViewMode ? 'Cerrar' : 'Cancelar'}
                    </button>

                    {!isViewMode && (
                        <button
                            type="submit"
                            className="btn btn-primary me-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    {isCreateMode ? 'Crear Servicio' : 'Actualizar Servicio'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ServicioForm;