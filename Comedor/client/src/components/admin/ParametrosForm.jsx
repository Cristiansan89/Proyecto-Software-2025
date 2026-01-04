import { useState } from "react";

const ParametrosForm = ({
  modalParametro,
  editandoId,
  formData,
  onCerrarModal,
  onGuardar,
  onInputChange,
  onInputChangeName,
  serverError,
  onServerErrorClear,
}) => {
  const [errors, setErrors] = useState({});

  const handleInputChangeName = (e) => {
    const { name, value } = e.target;
    let valorPermitido = value;

    if (name === "nombreParametro") {
      // Permitir solo letras, números, guiones y espacios para nombres de parámetros
      valorPermitido = value.replace(/[^A-ZÑÁÉÍÓÚ\s_-]/g, "");
    }

    onInputChangeName({ target: { name, value: valorPermitido } });

    // Limpiar error del campo y error del servidor
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      onServerErrorClear();
    }
  };

  const handleInputChange = (e) => {
    onInputChange(e);

    // Limpiar error del campo y error del servidor
    const { name } = e.target;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      onServerErrorClear();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(e);
  };

  if (!modalParametro) return null;

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">
              <i className="fas fa-cogs me-2"></i>
              {editandoId ? "Editar Parámetro" : "Nuevo Parámetro"}
            </h3>
            <button className="modal-close text-white" onClick={onCerrarModal}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="nombreParametro" className="form-label">
                  Nombre del Parámetro <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nombreParametro"
                  name="nombreParametro"
                  value={formData.nombreParametro}
                  onChange={handleInputChangeName}
                  placeholder="Ej: HORA_PEDIDO_AUTOMATICO"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="valor" className="form-label">
                  Valor <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  id="valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleInputChange}
                  placeholder="Ingrese el valor del parámetro"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="tipoParametro" className="form-label">
                    Tipo de Parámetro
                  </label>
                  <select
                    className="form-select"
                    id="tipoParametro"
                    name="tipoParametro"
                    value={formData.tipoParametro}
                    onChange={handleInputChange}
                  >
                    <option value="Texto">Texto</option>
                    <option value="Numero">Número</option>
                    <option value="Booleano">Booleano (Verdadero/Falso)</option>
                    <option value="Fecha">Fecha</option>
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="estado" className="form-label">
                    Estado
                  </label>
                  <select
                    className="form-select"
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {serverError && (
                <div
                  className="alert alert-danger alert-dismissible fade show"
                  role="alert"
                >
                  <i className="fas fa-exclamation-circle me-2"></i>
                  <strong className="me-1">Error:</strong> {serverError}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={onCerrarModal}
                >
                  <i className="fas fa-times"></i>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i>
                  {editandoId ? "Actualizar" : "Crear"} Parámetro
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParametrosForm;
