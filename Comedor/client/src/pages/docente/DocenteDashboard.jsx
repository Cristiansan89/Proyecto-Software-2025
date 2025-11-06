import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const DocenteDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [datos, setDatos] = useState({
        grados: [],
        servicios: [],
        asistenciasRecientes: []
    });

    useEffect(() => {
        cargarDatosDocente();
    }, [user]);

    const cargarDatosDocente = async () => {
        try {
            setLoading(true);

            // Cargar grados asignados al docente
            const gradosRes = await axios.get(`http://localhost:3000/docente-grados?idPersona=${user.idPersona || user.id_persona}`);

            // Cargar servicios disponibles
            const serviciosRes = await axios.get('http://localhost:3000/servicios');

            setDatos({
                grados: gradosRes.data || [],
                servicios: serviciosRes.data || [],
                asistenciasRecientes: []
            });

        } catch (error) {
            console.error('Error al cargar datos del docente:', error);
        } finally {
            setLoading(false);
        }
    };

    const generarEnlaceAsistencia = async (grado, servicio) => {
        try {
            const fechaHoy = new Date().toISOString().split('T')[0];

            const response = await axios.post('http://localhost:3000/asistencias/generar-token', {
                idPersonaDocente: user.idPersona || user.id_persona,
                nombreGrado: grado,
                fecha: fechaHoy,
                idServicio: servicio.id_servicio
            });

            // Abrir el enlace generado
            window.open(response.data.link, '_blank');

        } catch (error) {
            console.error('Error al generar enlace:', error);
            alert('Error al generar el enlace de asistencia');
        }
    };

    if (loading) {
        return (
            <div className="docente-dashboard">
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3">Cargando panel docente...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="docente-dashboard">
            {/* Header de Bienvenida */}
            <div className="welcome-header">
                <div className="welcome-content">
                    <h1>👨‍🏫 Bienvenido, {user?.nombres || user?.nombre}</h1>
                    <p className="welcome-subtitle">Panel de Control Docente</p>
                </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="stats-card">
                        <div className="stats-icon">
                            <i className="fas fa-chalkboard-teacher"></i>
                        </div>
                        <div className="stats-content">
                            <h3>{datos.grados.length}</h3>
                            <p>Grados Asignados</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="stats-card">
                        <div className="stats-icon">
                            <i className="fas fa-utensils"></i>
                        </div>
                        <div className="stats-content">
                            <h3>{datos.servicios.filter(s => s.estado === 'Activo').length}</h3>
                            <p>Servicios Disponibles</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="stats-card">
                        <div className="stats-icon">
                            <i className="fas fa-calendar-day"></i>
                        </div>
                        <div className="stats-content">
                            <h3>{new Date().toLocaleDateString('es-ES', { day: 'numeric' })}</h3>
                            <p>Hoy</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card action-card">
                        <div className="card-header">
                            <h3>📋 Registro de Asistencias</h3>
                            <p className="mb-0">Registra la asistencia de tus alumnos para los servicios de comedor</p>
                        </div>
                        <div className="card-body">
                            {datos.grados.length === 0 ? (
                                <div className="no-grados">
                                    <i className="fas fa-info-circle"></i>
                                    <p>No tienes grados asignados actualmente.</p>
                                </div>
                            ) : (
                                <div className="grados-grid">
                                    {datos.grados.map((gradoData, index) => (
                                        <div key={index} className="grado-card">
                                            <div className="grado-header">
                                                <h4>📚 {gradoData.nombreGrado}</h4>
                                                <span className="badge bg-info">
                                                    Ciclo {new Date(gradoData.cicloLectivo).getFullYear()}
                                                </span>
                                            </div>

                                            <div className="servicios-list">
                                                <p className="servicios-title">Registrar asistencia para:</p>
                                                {datos.servicios.filter(s => s.estado === 'Activo').map(servicio => (
                                                    <button
                                                        key={servicio.id_servicio}
                                                        className="btn btn-outline-primary btn-sm me-2 mb-2"
                                                        onClick={() => generarEnlaceAsistencia(gradoData.nombreGrado, servicio)}
                                                    >
                                                        🍽️ {servicio.nombre}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Información del Día */}
            <div className="row">
                <div className="col-md-6">
                    <div className="card info-card">
                        <div className="card-header">
                            <h4>📅 Información del Día</h4>
                        </div>
                        <div className="card-body">
                            <div className="info-item">
                                <strong>Fecha:</strong>
                                <span>{new Date().toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                            </div>
                            <div className="info-item">
                                <strong>Rol:</strong>
                                <span className="badge bg-success">{user?.rol}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card help-card">
                        <div className="card-header">
                            <h4>❓ ¿Cómo registrar asistencias?</h4>
                        </div>
                        <div className="card-body">
                            <ol className="help-steps">
                                <li>Selecciona tu grado en la sección "Registro de Asistencias"</li>
                                <li>Haz clic en el servicio para el cual quieres registrar asistencia</li>
                                <li>Se abrirá una nueva ventana optimizada para móvil</li>
                                <li>Marca cada alumno: ✅ Sí, ❌ No, 🚫 Ausente</li>
                                <li>Guarda los cambios</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocenteDashboard;