import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
import { showError, showSuccess } from "../../utils/alertService";
import DocenteStyle from "../../styles/Docente.module.css";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";

const MisAlumnos = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gradoDocente, setGradoDocente] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [updatingAlumnoId, setUpdatingAlumnoId] = useState(null);

  useEffect(() => {
    const cargarGradoDocente = async () => {
      try {
        setLoading(true);
        //console.log('Usuario actual:', user);
        //console.log('ID Persona:', user.idPersona || user.id_persona);

        const response = await API.get(
          `/docente-grados/grados-by-docente?idPersona=${user.idPersona || user.id_persona}`,
        );
        //console.log('Respuesta docente-grados:', response.data);
        const gradosData = response.data || [];

        // Tomar el primer grado como principal
        const gradoPrincipal = gradosData.length > 0 ? gradosData[0] : null;
        //console.log('Grado principal seleccionado:', gradoPrincipal);
        setGradoDocente(gradoPrincipal);
      } catch (error) {
        //console.error('Error al cargar grado del docente:', error);
        showError(
          "Error",
          "❌ Ocurrió un error al cargar la información del grado asignado. Por favor, intente nuevamente más tarde.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (user?.idPersona || user?.id_persona) {
      cargarGradoDocente();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        if (!gradoDocente?.nombreGrado) return;

        //console.log('Cargando alumnos para grado:', gradoDocente.nombreGrado);
        const response = await API.get(
          `/alumnos-grado?nombreGrado=${encodeURIComponent(
            gradoDocente.nombreGrado,
          )}`,
        );
        //console.log('Respuesta de alumnos:', response.data);
        setAlumnos(response.data || []);
      } catch (error) {
        //console.error('Error al cargar alumnos:', error);
        showError(
          "Error",
          "❌ Ocurrió un error al cargar la información de los alumnos. Por favor, intente nuevamente más tarde.",
        );
        setAlumnos([]);
      }
    };

    cargarAlumnos();
  }, [gradoDocente]);

  // Filtrar alumnos
  useEffect(() => {
    let filtered = alumnos;

    // Filtrar por búsqueda
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((alumno) => {
        return (
          (alumno.nombre &&
            alumno.nombre.toLowerCase().includes(searchLower)) ||
          (alumno.apellido &&
            alumno.apellido.toLowerCase().includes(searchLower)) ||
          (alumno.dni && alumno.dni.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filtrar por estado
    if (filterEstado && filterEstado !== "") {
      filtered = filtered.filter(
        (alumno) => alumno.estadoPersona === filterEstado,
      );
    }

    setFilteredAlumnos(filtered);
  }, [searchQuery, filterEstado, alumnos]);

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "N/A";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-ES");
  };

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

  const toggleEstadoAlumno = async (alumno) => {
    try {
      setUpdatingAlumnoId(alumno.id_alumno || alumno.idAlumno);
      const nuevoEstado =
        alumno.estadoPersona === "Activo" ? "Inactivo" : "Activo";
      const idPersona = alumno.id_persona || alumno.idPersona;

      await API.patch(`/personas/${idPersona}/estado`, {
        estado: nuevoEstado,
      });

      // Actualizar lista de alumnos - usar id_persona para comparación confiable
      setAlumnos(
        alumnos.map((a) =>
          a.id_persona === idPersona || a.idPersona === idPersona
            ? { ...a, estadoPersona: nuevoEstado }
            : a,
        ),
      );

      showSuccess(
        "Éxito",
        `Alumno ${nuevoEstado === "Activo" ? "activado" : "desactivado"} correctamente`,
      );
    } catch (error) {
      showError(
        "Error",
        `Error al cambiar el estado del alumno: ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setUpdatingAlumnoId(null);
    }
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Datos de Alumnos...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-graduation-cap"></i>
            Mis Alumnos:{" "}
            <em className="text-primary">{gradoDocente.nombreGrado}</em>
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Información de los alumnos a tu cargo
          </p>
        </div>
      </div>

      {!gradoDocente ? (
        <div className={ContenidoStyle.card}>
          <div className={`${ContenidoStyle.cardBody} text-center`}>
            <i className="fas fa-user-graduate text-muted mb-3"></i>
            <h4>No tienes un grado asignado</h4>
            <p>Contacta al administrador para que te asigne un grado</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Información del Grado */}
          <div className="row">
            <div className="col-md-3">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.alumnos}`}
              >
                <div className="fs-3">{alumnos.length}</div>
                <div>Total Alumnos</div>
              </div>
            </div>
            <div className="col-md-3">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.masculino}`}
              >
                <div className="fs-3">
                  {
                    alumnos.filter((alumno) => alumno.genero === "Masculino")
                      .length
                  }
                </div>
                <div>Masculino</div>
              </div>
            </div>
            <div className="col-md-3">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.femenino}`}
              >
                <div className="fs-3">
                  {
                    alumnos.filter((alumno) => alumno.genero === "Femenina")
                      .length
                  }
                </div>
                <div>Femenino</div>
              </div>
            </div>
            <div className="col-md-3">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.inactivo}`}
              >
                <div className="fs-3">
                  {
                    alumnos.filter(
                      (alumno) => alumno.estadoPersona === "Inactivo",
                    ).length
                  }
                </div>
                <div>Inactivos</div>
              </div>
            </div>
          </div>

          {/* Lista de Alumnos */}
          <div className={`${ContenidoStyle.tabContent} mt-4`}>
            <div className={ContenidoStyle.headerLeft}>
              <div className={ContenidoStyle.searchFilters}>
                <div className={ContenidoStyle.searchBar}>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o documento..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className={ContenidoStyle.searchInput}
                  />
                </div>

                <div className={ContenidoStyle.filterActions}>
                  <select
                    className={ContenidoStyle.filterSelect}
                    value={filterEstado}
                    onChange={handleFilterEstado}
                  >
                    <option value="">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>

                  {(searchQuery || filterEstado) && (
                    <button
                      className={ContenidoStyle.btnOutlineSecondary}
                      onClick={clearFilters}
                      title="Limpiar filtros"
                    >
                      <i className="fas fa-times"></i>
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de alumnos del grado */}
            <div className={TablaStyle.tableContainer}>
              {filteredAlumnos.length === 0 ? (
                <div className={TablaStyle.emptyState}>
                  <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                  <h5>No se encontraron Alumno del Grados</h5>
                  <p>No hay Alumnos que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                <div className={TablaStyle.scrollableTable}>
                  <div className={TablaStyle.tableBodyScroll}>
                    <table
                      className={`${TablaStyle.tableData} table table-striped`}
                    >
                      <thead className={TablaStyle.tableHeaderFixed}>
                        <tr>
                          <th>#</th>
                          <th>Alumno</th>
                          <th>Información Personal</th>
                          <th>Genero</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAlumnos.length === 0 ? (
                          <tr>
                            <td colSpan={12}>
                              <div className={TablaStyle.emptyState}>
                                <i
                                  className={`fas fa-search ${TablaStyle.emptyIcon}`}
                                ></i>
                                <h5>No se encontraron alumnos</h5>
                                <p>
                                  No hay alumnos que coincidan con tu búsqueda.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredAlumnos.map((alumno, index) => (
                            <tr key={index}>
                              <td className="fw-bold">{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div>
                                    <h6 className="mb-0">
                                      {alumno.nombre} {alumno.apellido}
                                    </h6>
                                    <small className="text-muted">
                                      {alumno.dni || "Sin documento"}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="mb-1">
                                    <i className="fas fa-birthday-cake text-muted me-1"></i>
                                    {calcularEdad(alumno.fechaNacimiento)} años
                                  </div>

                                  <div>
                                    <i className="fas fa-calendar text-muted me-1"></i>
                                    {formatearFecha(alumno.fechaNacimiento)}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="mb-1">
                                  <i className="fas fa-venus-mars text-muted me-1"></i>
                                  {alumno.genero || "N/A"}
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`${TablaStyle.statusBadge} ${
                                    alumno.estadoPersona.toLowerCase() ===
                                    "activo"
                                      ? TablaStyle.activo
                                      : TablaStyle.inactivo
                                  }`}
                                >
                                  {alumno.estadoPersona}
                                </span>
                              </td>
                              <td>
                                <div className={TablaStyle.actionButtons}>
                                  <button
                                    className={`${TablaStyle.btnAction} ${
                                      alumno.estadoPersona === "Activo"
                                        ? TablaStyle.btnDisable
                                        : TablaStyle.btnEnable
                                    }`}
                                    onClick={() => toggleEstadoAlumno(alumno)}
                                    disabled={
                                      updatingAlumnoId ===
                                      (alumno.id_alumno || alumno.idAlumno)
                                    }
                                    title={
                                      alumno.estado === "Activo"
                                        ? "Deshabilitar alumno"
                                        : "Activar alumno"
                                    }
                                  >
                                    <i
                                      className={`fas ${
                                        alumno.estadoPersona === "Activo"
                                          ? "fa-user-slash"
                                          : "fa-user-check"
                                      }`}
                                    ></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisAlumnos;
