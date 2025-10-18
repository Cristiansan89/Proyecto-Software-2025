import { useState } from 'react';

const RolForm = ({ rol, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        nombreRol: rol?.nombreRol || '',
        descripcion: rol?.descripcion || ''
    });

    const [errors, setErrors] = useState({});

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

        if (!formData.nombreRol.trim()) {
            newErrors.nombreRol = 'El nombre del rol es requerido';
        } else if (formData.nombreRol.trim().length < 3) {
            newErrors.nombreRol = 'El nombre del rol debe tener al menos 3 caracteres';
        }

        if (!formData.descripcion.trim()) {
            newErrors.descripcion = 'La descripción es requerida';
        } else if (formData.descripcion.trim().length < 10) {
            newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
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

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="nombreRol" className="form-label">
                    Nombre del Rol <span className="text-danger">*</span>
                </label>
                <input
                    type="text"
                    id="nombreRol"
                    name="nombreRol"
                    className={`form-control ${errors.nombreRol ? 'is-invalid' : ''}`}
                    value={formData.nombreRol}
                    onChange={handleChange}
                    placeholder="Ej: Administrador, Cocinero, Secretario"
                />
                {errors.nombreRol && (
                    <div className="invalid-feedback">
                        {errors.nombreRol}
                    </div>
                )}
            </div>

            <div className="mb-3">
                <label htmlFor="descripcion" className="form-label">
                    Descripción <span className="text-danger">*</span>
                </label>
                <textarea
                    id="descripcion"
                    name="descripcion"
                    className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                    rows="3"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Describe las responsabilidades y alcance de este rol"
                />
                {errors.descripcion && (
                    <div className="invalid-feedback">
                        {errors.descripcion}
                    </div>
                )}
            </div>

            <div className="d-flex justify-content-end gap-2">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onCancel}
                >

                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                >
                    {rol ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    );
};

export default RolForm;