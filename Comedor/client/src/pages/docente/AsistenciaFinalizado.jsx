import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/AsistenciaFinalizado.css";

const AsistenciaFinalizado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [conteos, setConteos] = useState({ Si: 0, No: 0, Ausente: 0 });

  useEffect(() => {
    // Obtener datos del estado de navegación
    if (location.state?.datos) {
      const datosRecibidos = location.state.datos;
      setDatos(datosRecibidos);

      // Calcular conteos
      const conteos = { Si: 0, No: 0, Ausente: 0 };
      Object.values(datosRecibidos.asistencias).forEach((estado) => {
        if (conteos[estado] !== undefined) {
          conteos[estado]++;
        }
      });
      setConteos(conteos);
    } else {
      // Si no hay datos, redirigir de vuelta
      navigate("/asistencias");
    }
  }, [location, navigate]);

  const handleSalir = () => {
    // Cerrar en Telegram si está disponible
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      // Fallback: cerrar la ventana o ir atrás
      try {
        window.close();
      } catch (err) {
        navigate("/asistencias");
      }
    }
  };

  if (!datos) {
    return (
      <div className="asistencia-finalizado-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="asistencia-finalizado-container">
      {/* Header */}
      <div className="header-finalizado">
        <div className="check-animation">
          <svg viewBox="0 0 100 100" className="check-circle">
            <circle cx="50" cy="50" r="45" />
            <polyline points="20 50 40 70 80 30" />
          </svg>
        </div>
        <h1>✅ Registro Completado</h1>
        <p className="subtitle">
          La asistencia ha sido registrada exitosamente
        </p>
      </div>

      {/* Contenido principal */}
      <div className="contenido-finalizado">
        {/* Tarjeta de información */}
        <div className="tarjeta-informacion">
          <div className="seccion-info">
            <h3>📋 Datos del Registro</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>📅 Fecha:</label>
                <span className="valor">{datos.fecha}</span>
              </div>
              <div className="info-item">
                <label>🍽️ Servicio:</label>
                <span className="valor">{datos.nombreServicio}</span>
              </div>
              <div className="info-item">
                <label>📚 Grado:</label>
                <span className="valor">{datos.nombreGrado}</span>
              </div>
              <div className="info-item">
                <label>👨‍🏫 Docente:</label>
                <span className="valor">{datos.nombreDocente}</span>
              </div>
            </div>
          </div>

          {/* Estadísticas de asistencia */}
          <div className="seccion-estadisticas">
            <h3>📊 Resumen de Asistencias</h3>
            <div className="estadisticas-grid">
              <div className="estadistica-card card-presente">
                <div className="numero">{conteos.Si}</div>
                <div className="etiqueta">Presentes</div>
                <div className="porcentaje">
                  {Math.round(
                    (conteos.Si /
                      (Object.keys(datos.asistencias).length || 1)) *
                      100
                  )}
                  %
                </div>
              </div>

              <div className="estadistica-card card-no-come">
                <div className="numero">{conteos.No}</div>
                <div className="etiqueta">No Comen</div>
                <div className="porcentaje">
                  {Math.round(
                    (conteos.No /
                      (Object.keys(datos.asistencias).length || 1)) *
                      100
                  )}
                  %
                </div>
              </div>

              <div className="estadistica-card card-ausente">
                <div className="numero">{conteos.Ausente}</div>
                <div className="etiqueta">Ausentes</div>
                <div className="porcentaje">
                  {Math.round(
                    (conteos.Ausente /
                      (Object.keys(datos.asistencias).length || 1)) *
                      100
                  )}
                  %
                </div>
              </div>
            </div>
          </div>

          {/* Detalle de alumnos */}
          <div className="seccion-detalle">
            <h3>👥 Detalle de Asistencias</h3>
            <div className="detalle-asistencias">
              {Object.entries(datos.asistencias).map(([id, estado]) => {
                const alumno = datos.alumnos.find(
                  (a) => a.id_alumnoGrado == id
                );
                return (
                  <div key={id} className="detalle-item">
                    <div className="detalle-alumno">
                      <span className="nombre">
                        {alumno?.apellido}, {alumno?.nombre}
                      </span>
                      <span className="dni">DNI: {alumno?.dni}</span>
                    </div>
                    <div
                      className={`detalle-estado estado-${estado.toLowerCase()}`}
                    >
                      {estado === "Si" && "✅ Presente"}
                      {estado === "No" && "🍽️ No Come"}
                      {estado === "Ausente" && "🚫 Ausente"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mensaje de confirmación */}
          <div className="mensaje-confirmacion">
            <p>
              📤 <strong>Datos enviados correctamente</strong> a la cocinera
            </p>
            <p className="subtexto">
              La información ha sido registrada en el sistema y las
              notificaciones se han enviado automáticamente.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="acciones-finalizado">
          <button className="btn-volver-telegram" onClick={handleSalir}>
            🔙 Volver a Telegram
          </button>
          <button
            className="btn-volver-registro"
            onClick={() => navigate("/docente/registro-asistencias")}
          >
            📝 Registrar otra asistencia
          </button>
        </div>

        {/* Footer */}
        <div className="footer-finalizado">
          <p>
            <i className="icon">ℹ️</i>
            Si cierra esta ventana automáticamente en{" "}
            <span className="tiempo">5 segundos...</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AsistenciaFinalizado;
