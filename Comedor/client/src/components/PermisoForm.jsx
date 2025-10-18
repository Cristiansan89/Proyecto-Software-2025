import { useState } from 'react';

const PermisoForm = ({ permiso, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        nombrePermiso: permiso?.nombrePermiso || ''
    });

    const [errors, setErrors] = useState({});

    // Sugerencias de permisos comunes
    const sugerenciasPermisos = [
        'crear_usuarios',
        'editar_usuarios',
        'eliminar_usuarios',
        'ver_usuarios',
        'crear_personas',
        'editar_personas',
        'eliminar_personas',
        'ver_personas',
        'gestionar_inventario',
        'ver_inventario',
        'planificar_menus',
        'ver_menus',
        'crear_reportes',
        'ver_reportes',
        'gestionar_asistencias',
        'ver_asistencias',
        'configurar_sistema',
        'ver_dashboard'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombrePermiso.trim()) {
            newErrors.nombrePermiso = 'El nombre del permiso es requerido';
        } else if (formData.nombrePermiso.trim().length < 3) {
            newErrors.nombrePermiso = 'El nombre del permiso debe tener al menos 3 caracteres';
        } else if (!/^[a-z0-9_]+$/.test(formData.nombrePermiso.trim())) {
            newErrors.nombrePermiso = 'El nombre del permiso solo puede contener letras minúsculas, números y guiones bajos';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    const handleSugerenciaClick = (sugerencia) => {
        setFormData(prev => ({
            ...prev,
            nombrePermiso: sugerencia
        }));
        if (errors.nombrePermiso) {
            setErrors(prev => ({
                ...prev,
                nombrePermiso: null
            }));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-2">
                <label htmlFor="nombrePermiso" className="form-label mt-2">
                    Nombre del Permiso <span className="text-danger">*</span>
                </label>
                <input
                    type="text"
                    id="nombrePermiso"
                    name="nombrePermiso"
                    className={`form-control ${errors.nombrePermiso ? 'is-invalid' : ''}`}
                    value={formData.nombrePermiso}
                    onChange={handleChange}
                    placeholder="Ej: crear_usuarios, editar_reportes, gestionar_inventario"
                />
                {errors.nombrePermiso && (
                    <div className="invalid-feedback">
                        {errors.nombrePermiso}
                    </div>
                )}
                <div className="form-text">
                    Use solo letras minúsculas, números y guiones bajos.
                    Ej: crear_usuarios, ver_reportes
                </div>
            </div>

            {/* Sugerencias de permisos */}
            <div className="mb-2">
                <label className="form-label">Sugerencias de permisos comunes:</label>
                <div className="sugerencias-grid">
                    {sugerenciasPermisos.map(sugerencia => (
                        <button
                            key={sugerencia}
                            type="button"
                            className="btn btn-outline-info btn-sm"
                            onClick={() => handleSugerenciaClick(sugerencia)}
                            disabled={formData.nombrePermiso === sugerencia}
                        >
                            {sugerencia}
                        </button>
                    ))}
                </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onCancel}
                >
                    <i className="fas fa-times"></i>
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                >
                    {permiso ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    );
};

export default PermisoForm;