import ComponenteStyle from "../../styles/Componentes.module.css";

const AsignarMenuForm = ({
  asignacion,
  recetasDisponibles = [],
  recetaSeleccionada = "",
  onRecetaChange,
  mode = "create",
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const isViewMode = mode === "view";

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  const isEditing = mode === "edit";
  const buttonLabel = isEditing ? "Cambiar Menú" : "Asignar Menú";

  return (
    <form onSubmit={handleSubmit} id="asignarMenuForm">
      <div className="row">
        <div className="mb-2">
          <label className={ComponenteStyle.formLabel}>
            <strong>
              {asignacion?.dia || ""}
              {asignacion?.dia && asignacion?.servicio?.nombre ? " - " : ""}
              {asignacion?.servicio?.nombre || ""}
            </strong>
          </label>
        </div>

        <div className="mb-3">
          <label className={ComponenteStyle.formLabel}>
            <strong>Fecha:</strong>{" "}
            {asignacion?.fecha?.toLocaleDateString("es-ES")}
          </label>
        </div>

        <div className="mb-3">
          <label className={ComponenteStyle.formLabel}>
            <strong>Servicio:</strong> {asignacion?.servicio?.descripcion || ""}
          </label>
        </div>

        <div className="mb-4">
          <label htmlFor="recetaSelect" className={ComponenteStyle.formLabel}>
            <i className="fas fa-book me-2"></i>
            Seleccionar Receta * ({asignacion?.servicio?.nombre || "servicio"})
          </label>

          <select
            id="recetaSelect"
            className={ComponenteStyle.formSelect}
            value={recetaSeleccionada}
            onChange={(event) => onRecetaChange?.(event.target.value)}
            disabled={isViewMode}
          >
            <option value="">-- Seleccione una receta --</option>
            {recetasDisponibles.map((receta) => (
              <option key={receta.id_receta} value={receta.id_receta}>
                {receta.nombreReceta}
              </option>
            ))}
          </select>

          {recetasDisponibles.length === 0 && (
            <div
              className={`${ComponenteStyle.alert} ${ComponenteStyle.alertWarning} mt-2 mb-0`}
            >
              <i className="fas fa-exclamation-triangle me-2"></i>
              No hay recetas disponibles para{" "}
              {asignacion?.servicio?.nombre || "este servicio"}. Cree recetas y
              asócielas a este servicio.
            </div>
          )}
        </div>

        <div className={`${ComponenteStyle.formActions} mt-3`}>
          <button
            type="button"
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel} me-2`}
            onClick={onCancel}
          >
            <i className="fas fa-times me-2"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
            disabled={!recetaSeleccionada || loading || isViewMode}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {isEditing ? "Cambiando..." : "Asignando..."}
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                {buttonLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AsignarMenuForm;
