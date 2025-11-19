import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from "../../services/api.js";
import '../../styles/RegistroAsistenciasDocente.css';

const RegistroAsistenciasDocente = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Estados principales
    const [servicios, setServicios] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [gradoDocente, setGradoDocente] = useState(null);
    
    // Estados del formulario
    const [formulario, setFormulario] = useState({
        fecha: new Date().toISOString().split('T')[0],
        idServicio: ''
    });

    const [asistencias, setAsistencias] = useState({});

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    useEffect(() => {
        if (formulario.idServicio && formulario.fecha) {
            cargarAsistenciasExistentes();
        }
    }, [formulario.idServicio, formulario.fecha]);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('👨‍🏫 Usuario docente:', user);

            // Cargar servicios disponibles y perfil del docente
            const serviciosResponse = await API.get('/servicios');
            console.log('📋 Servicios cargados:', serviciosResponse.data);
            setServicios(serviciosResponse.data);

            // Intentar obtener perfil del docente
            try {
                const docenteResponse = await API.get('/personas/perfil');
                console.log('👤 Perfil docente:', docenteResponse.data);

                // Obtener grado asignado al docente
                if (docenteResponse.data.gradosAsignados?.length > 0) {
                    const grado = docenteResponse.data.gradosAsignados[0]; // Por ahora tomamos el primer grado
                    setGradoDocente(grado);
                    await cargarAlumnosDelGrado(grado.nombreGrado || grado.idGrado);
                } else {
                    setError('No se encontró ningún grado asignado a este docente.');
                }
            } catch (perfilError) {
                console.warn('Error obteniendo perfil, usando datos del contexto:', perfilError);
                
                // Fallback: usar datos del contexto de autenticación o datos hardcodeados para prueba
                if (user?.gradosAsignados?.length > 0) {
                    const grado = user.gradosAsignados[0];
                    setGradoDocente(grado);
                    await cargarAlumnosDelGrado(grado.nombreGrado || grado.idGrado);
                } else {
                    // Para pruebas, usar un grado por defecto
                    console.warn('Usando datos de prueba para grado del docente');
                    const gradoPrueba = {
                        nombreGrado: '1° B',
                        idGrado: '1° B',
                        id_docenteTitular: 1
                    };
                    setGradoDocente(gradoPrueba);
                    await cargarAlumnosDelGrado(gradoPrueba.nombreGrado);
                }
            }

        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            setError('Error al cargar los datos iniciales. Verifique su conexión.');
        } finally {
            setLoading(false);
        }
    };

    const cargarAlumnosDelGrado = async (nombreGrado) => {
        try {
            // Usando el endpoint que ya existe en el sistema móvil
            const response = await API.get(`/alumnogrado/grado/${encodeURIComponent(nombreGrado)}`);
            console.log('👥 Alumnos del grado:', response.data);
            setAlumnos(response.data);
        } catch (error) {
            console.error('❌ Error cargando alumnos:', error);
            setError('Error al cargar la lista de alumnos.');
        }
    };

    const cargarAsistenciasExistentes = async () => {
        try {
            // Cargar asistencias ya registradas para la fecha y servicio seleccionados
            const response = await API.get(`/asistencias`, {
                params: {
                    fecha: formulario.fecha,
                    idServicio: formulario.idServicio,
                    nombreGrado: gradoDocente?.nombreGrado || gradoDocente?.idGrado
                }
            });

            console.log('📊 Asistencias existentes:', response.data);

            // Mapear asistencias existentes
            const asistenciasExistentes = {};
            alumnos.forEach(alumno => {
                const asistenciaExistente = response.data.find(a => 
                    a.id_alumnoGrado === alumno.id_alumnoGrado
                );
                asistenciasExistentes[alumno.id_alumnoGrado] = 
                    asistenciaExistente?.estado || 'No';
            });

            setAsistencias(asistenciasExistentes);

        } catch (error) {
            console.error('⚠️ Error cargando asistencias existentes:', error);
            // No es un error crítico, simplemente inicializar con valores por defecto
            const asistenciasIniciales = {};
            alumnos.forEach(alumno => {
                asistenciasIniciales[alumno.id_alumnoGrado] = 'No';
            });
            setAsistencias(asistenciasIniciales);
        }
    };

    const handleFormularioChange = (campo, valor) => {
        setFormulario(prev => ({
            ...prev,
            [campo]: valor
        }));
        setError('');
        setSuccess('');
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

            if (!formulario.idServicio) {
                setError('Debe seleccionar un servicio.');
                return;
            }

            if (Object.keys(asistencias).length === 0) {
                setError('No hay asistencias para guardar.');
                return;
            }

            // Preparar datos para enviar
            const asistenciasArray = Object.entries(asistencias).map(([idAlumnoGrado, estado]) => ({
                idAlumnoGrado: parseInt(idAlumnoGrado),
                estado,
                fecha: formulario.fecha,
                idServicio: parseInt(formulario.idServicio)
            }));

            console.log('💾 Guardando asistencias:', asistenciasArray);

            const response = await API.post('/asistencias/registro-docente', {
                asistencias: asistenciasArray,
                fecha: formulario.fecha,
                idServicio: parseInt(formulario.idServicio),
                nombreGrado: gradoDocente?.nombreGrado || gradoDocente?.idGrado
            });

            console.log('✅ Respuesta del servidor:', response.data);

            setSuccess(`✅ Asistencias guardadas correctamente. ${response.data.registradas} registros actualizados.`);

            // Recargar asistencias para mostrar el estado actualizado
            setTimeout(() => {
                cargarAsistenciasExistentes();
            }, 1000);

        } catch (error) {
            console.error('❌ Error al guardar asistencias:', error);
            if (error.response?.status === 400) {
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
            <div className="docente-asistencias-container">
                <div className="loading-docente">
                    <div className="spinner-docente"></div>
                    <p>Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (!gradoDocente) {
        return (
            <div className="docente-asistencias-container">
                <div className="error-docente">
                    <div className="error-icon">⚠️</div>
                    <h3>Sin Grado Asignado</h3>
                    <p>No se encontró ningún grado asignado a su cuenta.</p>
                    <p>Contacte al administrador para que le asigne un grado.</p>
                </div>
            </div>
        );
    }

    const conteos = contarAsistencias();

    return (
        <div className="docente-asistencias-container">
            {/* Header */}
            <div className="header-docente">
                <h1>📋 Registro de Asistencias</h1>
                <div className="info-grado">
                    <span className="badge-grado">
                        📚 {gradoDocente.nombreGrado || gradoDocente.idGrado}
                    </span>
                </div>
            </div>

            {/* Formulario de selección */}
            <div className="form-seleccion">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="fecha">📅 Fecha:</label>
                        <input
                            type="date"
                            id="fecha"
                            value={formulario.fecha}
                            onChange={(e) => handleFormularioChange('fecha', e.target.value)}
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="servicio">🍽️ Servicio:</label>
                        <select
                            id="servicio"
                            value={formulario.idServicio}
                            onChange={(e) => handleFormularioChange('idServicio', e.target.value)}
                            className="form-control"
                        >
                            <option value="">Seleccionar servicio...</option>
                            {servicios.map(servicio => (
                                <option key={servicio.id_servicio} value={servicio.id_servicio}>
                                    {servicio.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            {Object.keys(asistencias).length > 0 && (
                <div className="stats-docente">
                    <div className="stat-card stat-si">
                        <div className="stat-number">{conteos.Si}</div>
                        <div className="stat-label">Presentes</div>
                    </div>
                    <div className="stat-card stat-no">
                        <div className="stat-number">{conteos.No}</div>
                        <div className="stat-label">No Comen</div>
                    </div>
                    <div className="stat-card stat-ausente">
                        <div className="stat-number">{conteos.Ausente}</div>
                        <div className="stat-label">Ausentes</div>
                    </div>
                </div>
            )}

            {/* Lista de Alumnos */}
            {formulario.idServicio && (
                <div className="alumnos-container">
                    <h3>👥 Alumnos ({alumnos.length})</h3>
                    
                    <div className="alumnos-grid">
                        {alumnos.map((alumno) => (
                            <div key={alumno.id_alumnoGrado} className="alumno-card-docente">
                                <div className="alumno-info">
                                    <h4>{alumno.apellido}, {alumno.nombre}</h4>
                                    <p className="alumno-dni">DNI: {alumno.dni}</p>
                                </div>

                                <div className="opciones-asistencia-docente">
                                    <button
                                        type="button"
                                        className={`opcion-btn opcion-si ${asistencias[alumno.id_alumnoGrado] === 'Si' ? 'active' : ''}`}
                                        onClick={() => handleAsistenciaChange(alumno.id_alumnoGrado, 'Si')}
                                    >
                                        ✅ Presente
                                    </button>
                                    <button
                                        type="button"
                                        className={`opcion-btn opcion-no ${asistencias[alumno.id_alumnoGrado] === 'No' ? 'active' : ''}`}
                                        onClick={() => handleAsistenciaChange(alumno.id_alumnoGrado, 'No')}
                                    >
                                        🍽️ No Come
                                    </button>
                                    <button
                                        type="button"
                                        className={`opcion-btn opcion-ausente ${asistencias[alumno.id_alumnoGrado] === 'Ausente' ? 'active' : ''}`}
                                        onClick={() => handleAsistenciaChange(alumno.id_alumnoGrado, 'Ausente')}
                                    >
                                        🚫 Ausente
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
            {formulario.idServicio && Object.keys(asistencias).length > 0 && (
                <div className="acciones-docente">
                    <button
                        type="button"
                        className="btn-guardar-docente"
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
            )}
        </div>
    );
};

export default RegistroAsistenciasDocente;