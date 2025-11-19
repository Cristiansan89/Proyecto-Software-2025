import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from "../../services/api.js";
import './RegistroAsistenciasMovil.css';

const RegistroAsistenciasMovil = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [guardando, setGuardando] = useState(false);

    const [datosRegistro, setDatosRegistro] = useState({
        tokenData: null,
        servicio: null,
        alumnos: []
    });

    const [asistencias, setAsistencias] = useState({});

    useEffect(() => {
        cargarDatosRegistro();
    }, [token]);

    const cargarDatosRegistro = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('🔄 Iniciando carga de datos con token:', token);
            const response = await API.get(`/asistencias/registro/${token}`);
            console.log('📥 Respuesta recibida:', response.data);
            
            const { tokenData, servicio, alumnos } = response.data;

            console.log('📊 Datos extraídos:', { 
                tokenData: tokenData, 
                servicio: servicio, 
                alumnosCount: alumnos?.length || 0,
                alumnos: alumnos 
            });

            setDatosRegistro({ tokenData, servicio, alumnos });

            // Inicializar asistencias con el estado actual
            const asistenciasIniciales = {};
            alumnos.forEach(alumno => {
                asistenciasIniciales[alumno.id_alumnoGrado] = alumno.estado || 'No';
            });
            setAsistencias(asistenciasIniciales);
            
            console.log('✅ Datos cargados exitosamente');

        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            console.error('🔍 Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            
            if (error.response?.status === 401) {
                setError('El enlace ha expirado o es inválido. Contacte al administrador.');
            } else {
                setError(`Error al cargar los datos: ${error.message}. Intente nuevamente.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAsistenciaChange = (idAlumnoGrado, nuevoEstado) => {
        setAsistencias(prev => ({
            ...prev,
            [idAlumnoGrado]: nuevoEstado
        }));
        setError('');
        setSuccess('');
    };

    const guardarAsistencias = async () => {
        try {
            setGuardando(true);
            setError('');
            setSuccess('');

            // Validar que hay asistencias para guardar
            if (Object.keys(asistencias).length === 0) {
                setError('No hay asistencias para guardar.');
                return;
            }

            // Preparar datos para enviar
            const asistenciasArray = Object.entries(asistencias).map(([idAlumnoGrado, estado]) => ({
                idAlumnoGrado: parseInt(idAlumnoGrado),
                estado
            }));

            console.log('💾 Guardando asistencias:', asistenciasArray);

            const response = await API.post(`/asistencias/registro/${token}`, {
                asistencias: asistenciasArray
            });

            console.log('✅ Respuesta del servidor:', response.data);

            setSuccess(`✅ Asistencias guardadas correctamente. ${response.data.registradas} registros actualizados.`);

            // Opcional: recargar datos para mostrar el estado actualizado
            setTimeout(() => {
                cargarDatosRegistro();
            }, 1500);

        } catch (error) {
            console.error('❌ Error al guardar asistencias:', error);
            console.error('🔍 Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            
            if (error.response?.status === 401) {
                setError('El enlace ha expirado. Contacte al administrador para obtener un nuevo enlace.');
            } else if (error.response?.status === 400) {
                setError(`Error en los datos: ${error.response.data.message || 'Datos inválidos'}`);
            } else if (error.response?.status === 500) {
                setError('Error interno del servidor. Intente nuevamente en unos momentos.');
            } else {
                setError(`Error al guardar las asistencias: ${error.message}. Intente nuevamente.`);
            }
        } finally {
            setGuardando(false);
        }
    };

    const contarAsistencias = () => {
        const conteos = { Si: 0, No: 0, Ausente: 0 };
        Object.values(asistencias).forEach(estado => {
            conteos[estado]++;
        });
        return conteos;
    };

    if (loading) {
        return (
            <div className="movil-container">
                <div className="loading-movil">
                    <div className="spinner-movil"></div>
                    <p>Cargando datos de asistencia...</p>
                </div>
            </div>
        );
    }

    if (error && !datosRegistro.alumnos.length) {
        return (
            <div className="movil-container">
                <div className="error-movil">
                    <div className="error-icon">⚠️</div>
                    <h3>Error de Acceso</h3>
                    <p>{error}</p>
                    <button
                        className="btn-retry"
                        onClick={cargarDatosRegistro}
                    >
                        Intentar Nuevamente
                    </button>
                </div>
            </div>
        );
    }

    const conteos = contarAsistencias();
    const fechaFormateada = datosRegistro.tokenData?.fecha 
        ? new Date(datosRegistro.tokenData.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Fecha no disponible';

    // Debug logs para renderizado
    console.log('🎨 Renderizando componente:', {
        loading,
        error,
        datosRegistroKeys: Object.keys(datosRegistro),
        alumnosLength: datosRegistro.alumnos?.length || 0,
        servicioNombre: datosRegistro.servicio?.nombre,
        tokenDataGrado: datosRegistro.tokenData?.nombreGrado
    });

    return (
        <div className="movil-container">
            {/* Header */}
            <div className="header-movil">
                <div className="header-content">
                    <h1>📋 Registro de Asistencia</h1>
                    <div className="info-header">
                        <div className="info-item">
                            <strong>🍽️ {datosRegistro.servicio?.nombre}</strong>
                        </div>
                        <div className="info-item">
                            <strong>📚 {datosRegistro.tokenData?.nombreGrado}</strong>
                        </div>
                        <div className="info-item">
                            <strong>📅 {fechaFormateada}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="stats-movil">
                <div className="stat-item stat-si">
                    <span className="stat-number">{conteos.Si}</span>
                    <span className="stat-label">Asisten</span>
                </div>
                <div className="stat-item stat-no">
                    <span className="stat-number">{conteos.No}</span>
                    <span className="stat-label">No Desean</span>
                </div>
                <div className="stat-item stat-ausente">
                    <span className="stat-number">{conteos.Ausente}</span>
                    <span className="stat-label">Ausentes</span>
                </div>
            </div>

            {/* Lista de Alumnos */}
            <div className="alumnos-lista">
                {datosRegistro.alumnos.map((alumno) => (
                    <div key={alumno.id_alumnoGrado} className="alumno-card">
                        <div className="alumno-info">
                            <h3>{alumno.apellido}, {alumno.nombre}</h3>
                            <p className="alumno-dni">DNI: {alumno.dni}</p>
                        </div>

                        <div className="opciones-asistencia">
                            <button
                                className={`opcion-btn opcion-si ${asistencias[alumno.id_alumnoGrado] === 'Si' ? 'active' : ''}`}
                                onClick={() => handleAsistenciaChange(alumno.id_alumnoGrado, 'Si')}
                            >
                                ✅ Sí
                            </button>
                            <button
                                className={`opcion-btn opcion-no ${asistencias[alumno.id_alumnoGrado] === 'No' ? 'active' : ''}`}
                                onClick={() => handleAsistenciaChange(alumno.id_alumnoGrado, 'No')}
                            >
                                ❌ No
                            </button>
                            <button
                                className={`opcion-btn opcion-ausente ${asistencias[alumno.id_alumnoGrado] === 'Ausente' ? 'active' : ''}`}
                                onClick={() => handleAsistenciaChange(alumno.id_alumnoGrado, 'Ausente')}
                            >
                                🚫 Ausente
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mensajes */}
            {error && (
                <div className="mensaje-error">
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="mensaje-success">
                    <p>{success}</p>
                </div>
            )}

            {/* Botón de Guardar */}
            <div className="footer-movil">
                <button
                    className="btn-guardar"
                    onClick={guardarAsistencias}
                    disabled={guardando}
                >
                    {guardando ? (
                        <>
                            <div className="spinner-btn"></div>
                            Guardando...
                        </>
                    ) : (
                        <>
                            💾 Guardar Asistencias
                        </>
                    )}
                </button>
            </div>
           
        </div>
    );
};

export default RegistroAsistenciasMovil;