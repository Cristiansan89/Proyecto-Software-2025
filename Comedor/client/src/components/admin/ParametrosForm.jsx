import { useState } from "react";
import ComponenteStyle from "../../styles/Componentes.module.css";

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
    <form onSubmit={handleSubmit}>
      <div className={ComponenteStyle.formGrid}>
        <div className={ComponenteStyle.formGroup}>
          <label
            htmlFor="nombreParametro"
            className={ComponenteStyle.formLabel}
          >
            Nombre del Parámetro <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={ComponenteStyle.formControl}
            id="nombreParametro"
            name="nombreParametro"
            value={formData.nombreParametro}
            onChange={handleInputChangeName}
            placeholder="Ej: HORA_PEDIDO_AUTOMATICO"
            required
          />
        </div>

        <div className={ComponenteStyle.formGroup}>
          <label htmlFor="valor" className={ComponenteStyle.formLabel}>
            Valor <span className="text-danger">*</span>
          </label>
          <textarea
            className={ComponenteStyle.formControl}
            id="valor"
            name="valor"
            value={formData.valor}
            onChange={handleInputChange}
            placeholder="Ingrese el valor del parámetro"
            rows="3"
            required
          ></textarea>
        </div>

        <div className={ComponenteStyle.formGroup}>
          <label htmlFor="tipoParametro" className={ComponenteStyle.formLabel}>
            Tipo de Parámetro
          </label>
          <select
            className={ComponenteStyle.formSelect}
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

        <div className={ComponenteStyle.formGroup}>
          <label htmlFor="estado" className={ComponenteStyle.formLabel}>
            Estado
          </label>
          <select
            className={ComponenteStyle.formSelect}
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleInputChange}
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {serverError && (
          <div
            className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
            role="alert"
          >
            <i className="fas fa-exclamation-circle me-2"></i>
            <strong className="me-1">Error:</strong> {serverError}
          </div>
        )}

        <div className={ComponenteStyle.formActions}>
          <button
            type="button"
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel}`}
            onClick={onCerrarModal}
          >
            <i className="fas fa-times"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
          >
            <i className="fas fa-save"></i>
            {editandoId ? "Actualizar" : "Crear"} Parámetro
          </button>
        </div>
      </div>
    </form>
  );
};

export default ParametrosForm;
