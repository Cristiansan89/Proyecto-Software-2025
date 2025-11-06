import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const DocenteAsistencias = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [grados, setGrados] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        cargarDatos();
    }, [user]);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Cargar grados asignados al docente
            const gradosRes = await axios.get(`http://localhost:3000/docente-grados?idPersona=${user.idPersona || user.id_persona}`);

            // Cargar servicios disponibles
            const serviciosRes = await axios.get('http://localhost:3000/servicios');

            setGrados(gradosRes.data || []);
            setServicios(serviciosRes.data.filter(s => s.estado === 'Activo') || []);

        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const generarEnlaceAsistencia = async (nombreGrado, servicio) => {
        try {
            const response = await axios.post('http://localhost:3000/asistencias/generar-token', {
                idPersonaDocente: user.idPersona || user.id_persona,
                nombreGrado,
                fecha: fechaSeleccionada,
                idServicio: servicio.id_servicio
            });

            // Abrir el enlace generado en una nueva ventana
            const nuevaVentana = window.open(response.data.link, '_blank', 'width=400,height=700');

            if (!nuevaVentana) {
                // Si no se pudo abrir la ventana emergente, mostrar el enlace
                prompt('Copia este enlace para registrar asistencias:', response.data.link);
            }

        } catch (error) {
            console.error('Error al generar enlace:', error);
            alert('Error al generar el enlace de asistencia. Intenta nuevamente.');
        }
    };

    if (loading) {
        return (
            <div className="docente-asistencias">
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3">Cargando información de asistencias...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="docente-asistencias">
            <div className="page-header">
                <h2>📋 Gestión de Asistencias</h2>
                <p>Registra la asistencia de tus alumnos para los servicios de comedor</p>
            </div>

            {/* Selector de Fecha */}
            <div className="card mb-4">
                <div className="card-header">
                    <h4>📅 Seleccionar Fecha</h4>
                </div>
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <label className="form-label">Fecha para registro de asistencias:</label>
                            <input
                                type="date"
                                className="form-control"
                                value={fechaSeleccionada}
                                onChange={(e) => setFechaSeleccionada(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <div className="fecha-info">
                                <strong>Fecha seleccionada:</strong>
                                <p className="mb-0">
                                    {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grados y Servicios */}
            {grados.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center">
                        <i className="fas fa-info-circle fa-3x text-muted mb-3"></i>
                        <h4>No tienes grados asignados</h4>
                        <p>Contacta al administrador para que te asigne grados</p>
                    </div>
                </div>
            ) : (
                <div className="grados-container">
                    {grados.map((gradoData, index) => (
                        <div key={index} className="card grado-card mb-4">
                            <div className="card-header">
                                <div className="grado-header-content">
                                    <h4>📚 {gradoData.nombreGrado}</h4>
                                    <div className="grado-badges">
                                        <span className="badge bg-info me-2">
                                            Ciclo {new Date(gradoData.cicloLectivo).getFullYear()}
                                        </span>
                                        <span className="badge bg-success">
                                            {gradoData.tipoDocente || 'Docente'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                <h5 className="mb-3">🍽️ Servicios Disponibles</h5>

                                {servicios.length === 0 ? (
                                    <p className="text-muted">No hay servicios disponibles</p>
                                ) : (
                                    <div className="servicios-grid">
                                        {servicios.map(servicio => (
                                            <div key={servicio.id_servicio} className="servicio-item">
                                                <div className="servicio-info">
                                                    <h6>{servicio.nombre}</h6>
                                                    <p className="text-muted mb-2">{servicio.descripcion}</p>
                                                </div>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => generarEnlaceAsistencia(gradoData.nombreGrado, servicio)}
                                                >
                                                    📱 Registrar Asistencia
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Información de ayuda */}
            <div className="card mt-4">
                <div className="card-header">
                    <h4>💡 Instrucciones</h4>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <h6>📱 ¿Cómo funciona?</h6>
                            <ol>
                                <li>Selecciona la fecha para la cual registrar asistencias</li>
                                <li>Haz clic en "Registrar Asistencia" del servicio deseado</li>
                                <li>Se abrirá una ventana optimizada para móvil</li>
                                <li>Marca cada alumno según corresponda</li>
                                <li>Guarda los cambios</li>
                            </ol>
                        </div>
                        <div className="col-md-6">
                            <h6>📝 Estados de Asistencia</h6>
                            <ul className="list-unstyled">
                                <li><span className="badge bg-success me-2">✅ Sí</span> El alumno asiste al servicio</li>
                                <li><span className="badge bg-warning me-2">❌ No</span> El alumno no desea asistir</li>
                                <li><span className="badge bg-danger me-2">🚫 Ausente</span> El alumno no se presentó</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocenteAsistencias;