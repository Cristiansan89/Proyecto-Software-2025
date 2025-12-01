import { useState, useEffect } from "react";
import escuelaService from "../../services/escuelaService";

const ConfiguracionEscuela = () => {
  const [datos, setDatos] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const datosEscuela = await escuelaService.getDatos();
      setDatos(datosEscuela);
    } catch (error) {
      console.error("Error al cargar datos de la escuela:", error);
      alert("Error al cargar datos de la escuela: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos((prevDatos) => ({
      ...prevDatos,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      await escuelaService.actualizarDatos(datos);
      alert("Datos de la escuela actualizados exitosamente");
    } catch (error) {
      console.error("Error al guardar datos de la escuela:", error);
      alert("Error al guardar datos de la escuela: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-light text-dark">
              <h5 className="mb-0">
                <i className="fas fa-school me-2"></i>
                Configuración de la Escuela
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="nombre" className="form-label">
                      <i className="fas fa-school me-2"></i>
                      Nombre de la Institución *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="nombre"
                      name="nombre"
                      value={datos.nombre}
                      onChange={handleChange}
                      required
                      placeholder="Ej: Escuela Primaria N° 123"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">
                      <i className="fas fa-envelope me-2"></i>
                      Email Institucional *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={datos.email}
                      onChange={handleChange}
                      required
                      placeholder="contacto@escuela.edu.ar"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="telefono" className="form-label">
                      <i className="fas fa-phone me-2"></i>
                      Teléfono
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="telefono"
                      name="telefono"
                      value={datos.telefono}
                      onChange={handleChange}
                      placeholder="(011) 1234-5678"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="direccion" className="form-label">
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Dirección
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="direccion"
                      name="direccion"
                      value={datos.direccion}
                      onChange={handleChange}
                      placeholder="Av. Principal 123, Ciudad"
                    />
                  </div>
                </div>

                <hr className="my-4" />

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={cargarDatos}
                    disabled={guardando}
                  >
                    <i className="fas fa-undo me-2"></i>
                    Restablecer
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={guardando}
                  >
                    {guardando ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa de cómo se verá en documentos */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-light">
              <h6 className="mb-0">
                <i className="fas fa-eye me-2"></i>
                Vista Previa en Documentos
              </h6>
            </div>
            <div className="card-body bg-light">
              <div className="text-center border rounded p-3 bg-white">
                <h4 className="text-primary mb-2">
                  {datos.nombre || "Nombre de la Institución"}
                </h4>
                {datos.direccion && (
                  <p className="mb-1 text-muted">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    {datos.direccion}
                  </p>
                )}
                {(datos.telefono || datos.email) && (
                  <p className="mb-0 text-muted">
                    {datos.telefono && (
                      <>
                        <i className="fas fa-phone me-1"></i>
                        {datos.telefono}
                      </>
                    )}
                    {datos.telefono && datos.email && " | "}
                    {datos.email && (
                      <>
                        <i className="fas fa-envelope me-1"></i>
                        {datos.email}
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionEscuela;
