import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import RecetaForm from "../../components/cocinera/RecetaForm";
import "../../styles/CocineraRecetas.css";
import { showSuccess, showError, showWarning, showInfo, showToast, showConfirm } from "../../utils/alertService";

const CocineraRecetas = () => {
  const { user } = useAuth();
  const [recetas, setRecetas] = useState([]);
  const [filteredRecetas, setFilteredRecetas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedReceta, setSelectedReceta] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState("");

  useEffect(() => {
    loadRecetas();
    loadInsumos();
  }, []);

  const loadRecetas = async () => {
    try {
      setLoading(true);
      const response = await API.get("/recetas");

      // Cargar ingredientes para cada receta
      const recetasConIngredientes = await Promise.all(
        (response.data || []).map(async (receta) => {
          try {
            const ingredientesRes = await API.get(
              `/recetas/${receta.id_receta}/insumos`
            );

            // La API devuelve una receta con propiedad 'insumos'
            const ingredientes = ingredientesRes.data?.insumos || [];

            return {
              ...receta,
              ingredientes: ingredientes,
            };
          } catch (error) {
            console.error(
              `Error al cargar ingredientes para receta ${receta.id_receta}:`,
              error
            );
            return {
              ...receta,
              ingredientes: [],
            };
          }
        })
      );

      setRecetas(recetasConIngredientes);
    } catch (error) {
      console.error("Error al cargar recetas:", error);
      setRecetas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInsumos = async () => {
    try {
      const response = await API.get("/insumos");
      setInsumos(response.data || []);
    } catch (error) {
      console.error("Error al cargar insumos:", error);
      setInsumos([]);
    }
  };

  const loadRecetaIngredientes = async (recetaId) => {
    try {
      // Verificar si ya se cargaron los ingredientes para esta receta
      const recetaIndex = recetas.findIndex((r) => r.id_receta === recetaId);
      if (recetaIndex !== -1 && recetas[recetaIndex].ingredientes) {
        return; // Ya están cargados
      }

      const response = await API.get(`/recetas/${recetaId}/insumos`);

      // La API devuelve una receta con propiedad 'insumos'
      const ingredientes = response.data?.insumos || [];

      // Actualizar la receta con sus ingredientes
      setRecetas((prev) =>
        prev.map((receta) =>
          receta.id_receta === recetaId ? { ...receta, ingredientes } : receta
        )
      );

      // También actualizar en filteredRecetas si es necesario
      setFilteredRecetas((prev) =>
        prev.map((receta) =>
          receta.id_receta === recetaId ? { ...receta, ingredientes } : receta
        )
      );
    } catch (error) {
      console.error("Error al cargar ingredientes de la receta:", error);
      // Agregar ingredientes vacíos para evitar que se quede cargando indefinidamente
      setRecetas((prev) =>
        prev.map((receta) =>
          receta.id_receta === recetaId
            ? { ...receta, ingredientes: [] }
            : receta
        )
      );
    }
  };

  // Búsqueda y filtros
  useEffect(() => {
    let filtered = recetas;

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (receta) =>
          receta.nombreReceta
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          receta.instrucciones.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por estado
    if (filterEstado) {
      filtered = filtered.filter((receta) => receta.estado === filterEstado);
    }

    setFilteredRecetas(filtered);
    setCurrentPage(1);
  }, [searchQuery, recetas, filterEstado]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecetas = filteredRecetas.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredRecetas.length / itemsPerPage);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterEstado = (e) => {
    setFilterEstado(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterEstado("");
  };

  const openForm = (mode, receta = null) => {
    setFormMode(mode);
    setSelectedReceta(receta);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedReceta(null);
  };

  const handleSaveReceta = async () => {
    await loadRecetas();
    closeForm();
  };

  const handleDelete = async (receta) => {
    if (
      !confirm(
        `¿Está seguro de que desea eliminar la receta "${receta.nombreReceta}"?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await API.delete(`/recetas/${receta.id_receta}`);
      await loadRecetas();
      showSuccess("Éxito", "Receta eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar receta:", error);
      showError("Error", "Error al eliminar la receta");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando recetas...</p>
      </div>
    );
  }

  // Mostrar formulario si está activo
  if (showForm) {
    return (
      <div className="receta-form-container">
        <div className="form-header">
          <button className="btn btn-secondary mb-3" onClick={closeForm}>
            <i className="fas fa-arrow-left me-2"></i>
            Volver a la lista
          </button>
          <h2>
            {formMode === "create" && "Crear Nueva Receta"}
            {formMode === "edit" && "Editar Receta"}
            {formMode === "view" && "Ver Receta"}
          </h2>
        </div>

        <RecetaForm
          receta={selectedReceta}
          mode={formMode}
          insumos={insumos}
          onSave={handleSaveReceta}
          onCancel={closeForm}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-book-open me-2"></i>
            Gestión de Recetas
          </h1>
          <p className="page-subtitle">
            Administra las recetas del comedor escolar
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => openForm("create")}
          >
            <i className="fas fa-plus me-2"></i>
            Nueva Receta
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="search-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar por nombre o instrucciones..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterEstado}
                onChange={handleFilterEstado}
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
            <div className="col-md-1">
              {(searchQuery || filterEstado) && (
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={clearFilters}
                  title="Limpiar filtros"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de recetas en cards de acordeón */}
      {filteredRecetas.length === 0 ? (
        <div className="text-center py-4">
          <i className="fas fa-book-open fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No se encontraron recetas</h5>
          <p className="text-muted mb-3">
            {searchQuery || filterEstado
              ? "Intenta ajustar los filtros o crear una nueva receta"
              : "Comienza creando tu primera receta"}
          </p>
          {!searchQuery && !filterEstado && (
            <button
              className="btn btn-primary"
              onClick={() => openForm("create")}
            >
              <i className="fas fa-plus me-2"></i>
              Crear Primera Receta
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="row">
            {currentRecetas.map((receta, index) => (
              <div key={receta.id_receta} className="col-lg-3 col-md-6 mb-4">
                <div className="card">
                  <div className="p-0">
                    <div
                      className="accordion"
                      id={`accordion-${receta.id_receta}`}
                    >
                      {/* Header de la receta */}
                      <div className="accordion-item">
                        <h5 className="accordion-header bg-primary text-white p-3 mb-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <i className="fas fa-utensils me-2"></i>
                              <strong>{receta.nombreReceta}</strong>
                            </div>
                            <span
                              className={`badge ${
                                receta.estado === "Activo"
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
                            >
                              {receta.estado}
                            </span>
                          </div>
                          <small className="d-block mt-1 opacity-75">
                            {new Date(receta.fechaAlta).toLocaleDateString()}
                          </small>
                        </h5>
                      </div>

                      {/* Instrucciones */}
                      <div className="accordion-item">
                        <h2
                          className="accordion-header"
                          id={`heading-instrucciones-${receta.id_receta}`}
                        >
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#collapse-instrucciones-${receta.id_receta}`}
                            aria-expanded="false"
                            aria-controls={`collapse-instrucciones-${receta.id_receta}`}
                            onClick={(e) => e.currentTarget.blur()}
                          >
                            <i className="fas fa-clipboard-list me-2"></i>
                            Instrucciones de Preparación
                          </button>
                        </h2>
                        <div
                          id={`collapse-instrucciones-${receta.id_receta}`}
                          className="accordion-collapse collapse"
                          aria-labelledby={`heading-instrucciones-${receta.id_receta}`}
                          data-bs-parent={`#accordion-${receta.id_receta}`}
                        >
                          <div className="accordion-body">
                            <div className="small">
                              {(() => {
                                return null;
                              })()}
                              {receta.instrucciones
                                ?.split(".")
                                .filter((step) => step.trim())
                                .map((step, stepIndex) => (
                                  <div key={stepIndex} className="mb-2">
                                    <strong>{stepIndex + 1}. </strong>
                                    {step.trim()}.
                                  </div>
                                )) || (
                                <div className="text-muted">
                                  <i className="fas fa-info-circle me-2"></i>
                                  No hay instrucciones disponibles
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ingredientes */}
                      <div className="accordion-item">
                        <h2
                          className="accordion-header"
                          id={`heading-ingredientes-${receta.id_receta}`}
                        >
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#collapse-ingredientes-${receta.id_receta}`}
                            aria-expanded="false"
                            aria-controls={`collapse-ingredientes-${receta.id_receta}`}
                            onClick={(e) => {
                              e.currentTarget.blur();
                              loadRecetaIngredientes(receta.id_receta);
                            }}
                          >
                            <i className="fas fa-list me-2"></i>
                            Ingredientes
                            <span className="badge bg-info ms-2">
                              {receta.ingredientes?.length || "?"}
                            </span>
                          </button>
                        </h2>
                        <div
                          id={`collapse-ingredientes-${receta.id_receta}`}
                          className="accordion-collapse collapse"
                          aria-labelledby={`heading-ingredientes-${receta.id_receta}`}
                          data-bs-parent={`#accordion-${receta.id_receta}`}
                        >
                          <div className="accordion-body">
                            {receta.ingredientes &&
                            receta.ingredientes.length > 0 ? (
                              <div className="small">
                                {receta.ingredientes.map(
                                  (ingrediente, ingIndex) => (
                                    <div
                                      key={ingIndex}
                                      className="mb-2 d-flex justify-content-between"
                                    >
                                      <span>
                                        <strong>{ingIndex + 1}. </strong>
                                        {ingrediente.nombreInsumo}
                                      </span>
                                      <span className="text-muted">
                                        {ingrediente.cantidadPorPorcion}{" "}
                                        {ingrediente.unidadPorPorcion}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-muted">
                                <div
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Cargando...
                                  </span>
                                </div>
                                Cargando ingredientes...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="accordion-item">
                        <div className="p-3 bg-light">
                          <div className="row g-2">
                            <div className="col-4">
                              <button
                                className="btn btn-outline-info btn-sm w-100"
                                onClick={() => openForm("view", receta)}
                                title="Ver receta"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                            <div className="col-4">
                              <button
                                className="btn btn-outline-primary btn-sm w-100"
                                onClick={() => openForm("edit", receta)}
                                title="Editar receta"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </div>
                            <div className="col-4">
                              <button
                                className="btn btn-outline-danger btn-sm w-100"
                                onClick={() => handleDelete(receta)}
                                title="Eliminar receta"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <small className="text-muted">
                              <span className="badge bg-light text-dark">
                                {receta.unidadSalida}
                              </span>
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="showing-info">
                <small className="text-muted">
                  Mostrando {indexOfFirstItem + 1} a{" "}
                  {Math.min(indexOfLastItem, filteredRecetas.length)} de{" "}
                  {filteredRecetas.length} recetas
                </small>
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </button>
                  </li>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <li
                      key={page}
                      className={`page-item ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CocineraRecetas;
