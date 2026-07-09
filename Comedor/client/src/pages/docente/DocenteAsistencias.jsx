import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
import { showError } from "../../utils/alertService";
import DocenteStyle from "../../styles/Docente.module.css";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";

const DocenteAsistencias = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gradoDocente, setGradoDocente] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [asistenciasData, setAsistenciasData] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    cargarDatos();
  }, [user]);

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

    setFilteredAlumnos(filtered);
  }, [searchQuery, alumnos]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery("");
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar grado principal asignado al docente
      const gradosRes = await API.get(
        `/docente-grados/grados-by-docente?idPersona=${user.idPersona || user.id_persona}`,
      );
      const gradosDocente = gradosRes.data || [];
      const gradoPrincipal = gradosDocente.length > 0 ? gradosDocente[0] : null;

      // Cargar servicios disponibles
      const serviciosRes = await API.get("/servicios");
      const serviciosActivos =
        serviciosRes.data.filter((s) => s.estado === "Activo") || [];

      // Cargar alumnos del grado
      let alumnosGrado = [];
      if (gradoPrincipal?.nombreGrado) {
        const alumnosRes = await API.get(
          `/alumnos-grado?nombreGrado=${encodeURIComponent(gradoPrincipal.nombreGrado)}`,
        );
        alumnosGrado = alumnosRes.data || [];
      }

      // Cargar asistencias/consumos de los alumnos
      let asistencias = [];
      if (alumnosGrado.length > 0) {
        try {
          // CAMBIO: Usar /asistencias en lugar de /consumos
          const asistenciasRes = await API.get("/asistencias");
          // Asegurar que siempre sea un array
          if (Array.isArray(asistenciasRes.data)) {
            asistencias = asistenciasRes.data;
          } else if (
            asistenciasRes.data &&
            Array.isArray(asistenciasRes.data.data)
          ) {
            asistencias = asistenciasRes.data.data;
          } else {
            asistencias = [];
          }
        } catch (error) {
          console.error("Error al cargar asistencias:", error);
          asistencias = [];
        }
      }

      setGradoDocente(gradoPrincipal);
      setServicios(serviciosActivos);
      setAlumnos(alumnosGrado);
      setAsistenciasData(asistencias);
    } catch (error) {
      //console.error("Error al cargar datos:", error);
      showError(
        "Error",
        "Error al cargar los datos. Intenta recargar la página.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Calcular asistencias e inasistencias por alumno
  const calcularAsistencias = (idAlumnoGrado) => {
    if (!Array.isArray(asistenciasData) || asistenciasData.length === 0) {
      return { asistencias: 0, inasistencias: 0 };
    }

    if (!gradoDocente) {
      return { asistencias: 0, inasistencias: 0 };
    }

    // Filtrar PRIMERO por grado del docente
    const registrosPorGrado = asistenciasData.filter((c) => {
      const gradoAsistencia = (c.nombreGrado || "").toLowerCase().trim();
      const gradoDocenteNombre = (gradoDocente.nombreGrado || "")
        .toLowerCase()
        .trim();
      return gradoAsistencia === gradoDocenteNombre;
    });

    // Paso 1: Filtrar por alumno usando id_alumnoGrado (sin underscore en el alumno, con underscore en asistencias)
    const registrosAlumno = registrosPorGrado.filter((c) => {
      return c.id_alumnoGrado === idAlumnoGrado;
    });

    if (registrosAlumno.length === 0) {
      return { asistencias: 0, inasistencias: 0 };
    }

    // Paso 2: Filtrar por estado = 'Completado'
    const registrosCompletados = registrosAlumno.filter((c) => {
      const estado = (c.estado || "").toLowerCase().trim();
      return estado === "completado";
    });

    // Paso 3: Filtrar por servicios 1 o 3 (Desayuno/Merienda)
    const registrosValidos = registrosCompletados.filter((c) => {
      const idServicio = c.id_servicio;
      return idServicio === 1 || idServicio === 3;
    });

    // Paso 4: Contar inasistencias (tipoAsistencia = 'Ausente')
    const inasistenciasCount = registrosValidos.filter((c) => {
      const tipo = (c.tipoAsistencia || "").toLowerCase().trim();
      return tipo === "ausente";
    }).length;

    // Paso 5: Contar asistencias (tipoAsistencia = 'SI' o 'NO')
    const asistenciasCount = registrosValidos.filter((c) => {
      const tipo = (c.tipoAsistencia || "").toUpperCase().trim();
      return tipo === "SI" || tipo === "NO";
    }).length;

    return {
      asistencias: asistenciasCount,
      inasistencias: inasistenciasCount,
    };
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Datos de Asistencias...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-clipboard-list"></i>
            Asistencias
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Asistencia de tus alumnos para los servicios de comedor
          </p>
        </div>
      </div>

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
              {searchQuery && (
                <button
                  className="btn btn-outline-secondary btn-sm"
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

        {/* Lista de asistencias del grado */}
        <div className={`${ContenidoStyle.card} mb-4`}>
          <div className={TablaStyle.tableContainer}>
            {!gradoDocente ? (
              <div className={TablaStyle.emptyState}>
                <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                <h5>No tienes un grado asignado</h5>
                <p>Contacta al administrador para que te asigne un grado</p>
              </div>
            ) : alumnos.length === 0 ? (
              <div className={TablaStyle.emptyState}>
                <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                <h5>No se encontraron alumnos</h5>
                <p>No hay alumnos en este grado.</p>
              </div>
            ) : filteredAlumnos.length === 0 ? (
              <div className={TablaStyle.emptyState}>
                <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                <h5>No se encontraron alumnos</h5>
                <p>No hay alumnos que coincidan con tu búsqueda.</p>
              </div>
            ) : (
              <div className={TablaStyle.scrollableTable}>
                <div className={TablaStyle.tableBodyScroll}>
                  <table
                    className={`${TablaStyle.tableData} table table-striped`}
                  >
                    <thead className={TablaStyle.tableHeaderFixed}>
                      <tr>
                        <th className="text-center">#</th>
                        <th>Nombre y Apellido</th>
                        <th>Documento</th>
                        <th className="text-center">Inasistencias</th>
                        <th className="text-center">Asistencias</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlumnos.map((alumno, index) => {
                        const { asistencias, inasistencias } =
                          calcularAsistencias(alumno.idAlumnoGrado);
                        return (
                          <tr key={alumno.idAlumnoGrado || index}>
                            <td className="fw-bold text-center">{index + 1}</td>
                            <td>
                              <div>
                                <h6 className="mb-0">
                                  {alumno.nombre} {alumno.apellido}
                                </h6>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`${ContenidoStyle.badge} bg-secondary text-white`}
                              >
                                {alumno.dni || "N/A"}
                              </span>
                            </td>
                            <td className="text-center">
                              <span
                                className={`${ContenidoStyle.badge} bg-danger rounded-circle text-white`}
                              >
                                {inasistencias}
                              </span>
                            </td>
                            <td className="text-center">
                              <span
                                className={`${ContenidoStyle.badge} bg-success rounded-circle text-white`}
                              >
                                {asistencias}
                              </span>
                            </td>
                            <td>
                              {" "}
                              <div className={TablaStyle.actionButtons}>
                                <button
                                  className="btn-action btn-view"
                                  title="Ver detalles"
                                  onClick={() => {
                                    console.log("🔑 ALUMNO COMPLETO:", alumno);
                                    console.log(
                                      "idAlumnoGrado:",
                                      alumno.idAlumnoGrado,
                                    );
                                    navigate(
                                      `/docente/asistencia-alumno/${alumno.idAlumnoGrado}`,
                                    );
                                  }}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocenteAsistencias;
