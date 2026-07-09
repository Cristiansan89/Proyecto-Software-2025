import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api.js";
import MovilStyle from "../../styles/Movil.module.css";

const RegistroAsistenciasMovil = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [datosRegistro, setDatosRegistro] = useState({
    tokenData: null,
    servicio: null,
    alumnos: [],
  });

  const [asistencias, setAsistencias] = useState({});
  const [datosExito, setDatosExito] = useState({
    registradas: 0,
    servicio: "",
  });

  useEffect(() => {
    cargarDatosRegistro();
  }, [token]);

  // Navegar automáticamente si el registro fue completado
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      navigate("/registro-exitoso", {
        replace: true,
        state: {
          mensaje: success,
          registradas: datosExito.registradas,
          servicio: datosExito.servicio,
        },
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [success, datosExito, navigate]);

  const cargarDatosRegistro = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(`/asistencias/registro/${token}`);

      const { tokenData, servicio, alumnos } = response.data;

      setDatosRegistro({ tokenData, servicio, alumnos });

      // Inicializar asistencias con el estado actual (tipoAsistencia)
      // Si ya existe un registro, usar el valor existente, sino usar 'No' por defecto
      const asistenciasIniciales = {};
      alumnos.forEach((alumno) => {
        // Verificar si el alumno ya tiene un registro de asistencia previo
        let tipoAsistenciaActual = alumno.tipoAsistencia;

        // Si es null, undefined, string vacío o 'No' (para registros nuevos), permitir selección libre
        if (
          !tipoAsistenciaActual ||
          tipoAsistenciaActual === "" ||
          tipoAsistenciaActual === "null" ||
          tipoAsistenciaActual === null ||
          tipoAsistenciaActual === undefined
        ) {
          // Para registros sin asistencia previa, no forzar ningún valor
          // El usuario debe seleccionar explícitamente
          tipoAsistenciaActual = "No"; // Valor visual por defecto, pero el usuario puede cambiar
        }

        // Validar que sea un valor válido
        if (!["Si", "No", "Ausente"].includes(tipoAsistenciaActual)) {
          console.warn(
            `⚠️ Valor inválido de tipoAsistencia para alumno ${alumno.nombre}: ${tipoAsistenciaActual}, usando 'No'`,
          );
          tipoAsistenciaActual = "No";
        }

        asistenciasIniciales[alumno.id_alumnoGrado] = tipoAsistenciaActual;
      });
      setAsistencias(asistenciasIniciales);

      // ✅ Validación de estado: Si ya fue completado, mostrar pantalla de éxito
      if (tokenData?.estado === "Completado") {
        setSuccess("¡Asistencias ya fueron registradas!");
        setDatosExito({
          registradas: alumnos.length,
          servicio:
            servicio?.nombre || servicio?.nombre_servicio || "Servicio escolar",
        });
      }
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      console.error("🔍 Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        setError(
          "El enlace ha expirado o es inválido. Contacte al administrador.",
        );
      } else {
        setError(
          `Error al cargar los datos: ${error.message}. Intente nuevamente.`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAsistenciaChange = (idAlumnoGrado, nuevoEstado) => {
    setAsistencias((prev) => ({
      ...prev,
      [idAlumnoGrado]: nuevoEstado,
    }));
    setError("");
    setSuccess("");
  };

  const guardarAsistencias = async () => {
    try {
      setGuardando(true);
      setError("");

      const asistenciasArray = Object.entries(asistencias).map(
        ([idAlumnoGrado, tipoAsistencia]) => ({
          idAlumnoGrado: parseInt(idAlumnoGrado),
          tipoAsistencia,
        }),
      );

      const response = await API.post(
        `/asistencias/registro/${token}`,
        { asistencias: asistenciasArray },
        { headers: { "Cache-Control": "no-cache" } },
      );

      const registradas = response.data.registradas ?? asistenciasArray.length;
      const nombreServicio =
        datosRegistro.servicio?.nombre ||
        datosRegistro.servicio?.nombre_servicio ||
        "Servicio escolar";

      setDatosExito({ registradas, servicio: nombreServicio });

      // Actualizar estado local para marcar como completado
      setDatosRegistro((prev) => ({
        ...prev,
        tokenData: { ...prev.tokenData, estado: "Completado" },
      }));

      // El useEffect([success]) manejará la navegación automáticamente
      setSuccess("¡Asistencias registradas con éxito!");
    } catch (err) {
      console.error("❌ Error al guardar asistencias:", err);
      setError(
        err.response?.data?.message || "Error al conectar con el servidor.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const contarAsistencias = () => {
    const conteos = { Si: 0, No: 0, Ausente: 0 };
    Object.values(asistencias).forEach((estado) => {
      conteos[estado]++;
    });
    return conteos;
  };

  if (loading) {
    return (
      <div className={MovilStyle.containerMovil}>
        <div className={MovilStyle.loadingMovil}>
          <div className={MovilStyle.spinnerMovil}></div>
          <p>Cargando datos de asistencia...</p>
        </div>
      </div>
    );
  }

  if (error && !datosRegistro.alumnos.length) {
    return (
      <div className={MovilStyle.containerMovil}>
        <div className={MovilStyle.errorMovil}>
          <div className={MovilStyle.errorIcon}>⚠️</div>
          <h3>Error de Acceso</h3>
          <p>{error}</p>
          <button className={MovilStyle.btnRetry} onClick={cargarDatosRegistro}>
            Intentar Nuevamente
          </button>
        </div>
      </div>
    );
  }

  const conteos = contarAsistencias();
  const fechaFormateada = datosRegistro.tokenData?.fecha
    ? new Date(datosRegistro.tokenData.fecha + "T00:00:00").toLocaleDateString(
        "es-ES",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )
    : "Fecha no disponible";

  return (
    <div className={MovilStyle.containerMovil}>
      {!success ? (
        /* ── INTERFAZ DE FORMULARIO ── */
        <>
          {/* Header */}
          <div className={MovilStyle.headerMovil}>
            <div className={MovilStyle.headerContent}>
              <h1>📋 Registro de Asistencia</h1>
              <div className={MovilStyle.headerInfo}>
                <div className={MovilStyle.itemInfo}>
                  <strong>🍽️ {datosRegistro.servicio?.nombre}</strong>
                </div>
                <div className={MovilStyle.itemInfo}>
                  <strong>📚 {datosRegistro.tokenData?.nombreGrado}</strong>
                </div>
                <div className={MovilStyle.itemInfo}>
                  <strong>📅 {fechaFormateada}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={MovilStyle.mensajeError}>
              <p>{error}</p>
            </div>
          )}

          {/* Estadísticas */}
          <div className={MovilStyle.statsMovil}>
            <div className={`${MovilStyle.statItem} ${MovilStyle.statSi}`}>
              <span className={MovilStyle.statNumber}>{conteos.Si}</span>
              <span className={MovilStyle.statLabel}>Asisten</span>
            </div>
            <div className={`${MovilStyle.statItem} ${MovilStyle.statNo}`}>
              <span className={MovilStyle.statNumber}>{conteos.No}</span>
              <span className={MovilStyle.statLabel}>No Desean</span>
            </div>
            <div className={`${MovilStyle.statItem} ${MovilStyle.statAusente}`}>
              <span className={MovilStyle.statNumber}>{conteos.Ausente}</span>
              <span className={MovilStyle.statLabel}>Ausentes</span>
            </div>
          </div>

          {/* Lista de Alumnos */}
          <div className={MovilStyle.listaAlumnos}>
            {datosRegistro.alumnos.map((alumno) => (
              <div
                key={alumno.id_alumnoGrado}
                className={MovilStyle.cardAlumno}
              >
                <div className={MovilStyle.infoAlumno}>
                  <h3>
                    {alumno.apellido}, {alumno.nombre}
                  </h3>
                  <p className={AsistenciStyle.dniAlumno}>DNI: {alumno.dni}</p>
                </div>

                <div className={MovilStyle.opcionesAsistencia}>
                  <button
                    className={`${MovilStyle.btnOpcion} ${MovilStyle.opcionSi} ${
                      asistencias[alumno.id_alumnoGrado] === "Si"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleAsistenciaChange(alumno.id_alumnoGrado, "Si")
                    }
                  >
                    ✅ Sí
                  </button>
                  <button
                    className={`${MovilStyle.btnOpcion} ${MovilStyle.opcionNo} ${
                      asistencias[alumno.id_alumnoGrado] === "No"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleAsistenciaChange(alumno.id_alumnoGrado, "No")
                    }
                  >
                    ❌ No
                  </button>
                  <button
                    className={`${MovilStyle.btnOpcion} ${MovilStyle.opcionAusente} ${
                      asistencias[alumno.id_alumnoGrado] === "Ausente"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleAsistenciaChange(alumno.id_alumnoGrado, "Ausente")
                    }
                  >
                    🚫 Ausente
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Botón de Guardar */}
          <div className={MovilStyle.footerMovil}>
            <button
              className={MovilStyle.btnGuardar}
              onClick={guardarAsistencias}
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <div className={MovilStyle.btnSpinner}></div>
                  Guardando...
                </>
              ) : (
                <>💾 Guardar Asistencias</>
              )}
            </button>
          </div>
        </>
      ) : (
        /* ── INTERFAZ DE ÉXITO ── */
        <div className={MovilStyle.errorMovil}>
          <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>✅</div>
          <h2>¡Registro Completado!</h2>
          <p style={{ margin: "1rem 0" }}>{success}</p>
          <p>
            Se actualizaron <strong>{datosExito.registradas}</strong> registros
            para <strong>{datosExito.servicio}</strong>.
          </p>
          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div className={MovilStyle.spinnerMovil}></div>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>
              Redirigiendo en 1.5 segundos...
            </p>
          </div>
          <br />
          <button
            className={MovilStyle.btnGuardar}
            onClick={() =>
              navigate("/registro-exitoso", {
                state: {
                  mensaje: success,
                  registradas: datosExito.registradas,
                  servicio: datosExito.servicio,
                },
              })
            }
          >
            Finalizar ahora
          </button>
        </div>
      )}
    </div>
  );
};

export default RegistroAsistenciasMovil;
