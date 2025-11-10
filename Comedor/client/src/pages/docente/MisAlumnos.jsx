import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from "../../services/api.js";

const MisAlumnos = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [gradoDocente, setGradoDocente] = useState(null);
    const [alumnos, setAlumnos] = useState([]);

    useEffect(() => {
        const cargarGradoDocente = async () => {
            try {
                setLoading(true);
                console.log('Usuario actual:', user);
                console.log('ID Persona:', user.idPersona || user.id_persona);

                const response = await API.get(`/docente-grados?idPersona=${user.idPersona || user.id_persona}`);
                console.log('Respuesta docente-grados:', response.data);
                const gradosData = response.data || [];

                // Tomar el primer grado como principal
                const gradoPrincipal = gradosData.length > 0 ? gradosData[0] : null;
                console.log('Grado principal seleccionado:', gradoPrincipal);
                setGradoDocente(gradoPrincipal);
            } catch (error) {
                console.error('Error al cargar grado del docente:', error);
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

                console.log('Cargando alumnos para grado:', gradoDocente.nombreGrado);
                const response = await API.get(`/alumnos-grado?nombreGrado=${encodeURIComponent(gradoDocente.nombreGrado)}`);
                console.log('Respuesta de alumnos:', response.data);
                setAlumnos(response.data || []);
            } catch (error) {
                console.error('Error al cargar alumnos:', error);
                setAlumnos([]);
            }
        };

        cargarAlumnos();
    }, [gradoDocente]);

    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return 'N/A';
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
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleDateString('es-ES');
    };

    const getInitials = (nombre, apellido) => {
        return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
    };

    if (loading) {
        return (
            <div className="mis-alumnos">
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3">Cargando información de alumnos...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="mis-alumnos">
                <div className="card">
                    <div className="card-body text-center">
                        <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
                        <h4>No hay usuario autenticado</h4>
                        <p>Por favor, inicia sesión para ver esta página</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mis-alumnos">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <i className="fas fa-graduation-cap me-2"></i>
                        Mis Alumnos
                    </h1>
                    <p>Información de los alumnos a tu cargo</p>
                </div>
            </div>

            {!gradoDocente ? (
                <div className="card">
                    <div className="card-body text-center">
                        <i className="fas fa-user-graduate fa-3x text-muted mb-3"></i>
                        <h4>No tienes un grado asignado</h4>
                        <p>Contacta al administrador para que te asigne un grado</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Información del Grado */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="grado-info">
                                    <h4 className="mb-0">📚 {gradoDocente.nombreGrado}</h4>
                                </div>
                                <div className="grado-badges">
                                    <span className="badge bg-info me-2">
                                        Ciclo {new Date(gradoDocente.cicloLectivo).getFullYear()}
                                    </span>
                                    <span className="badge bg-success">
                                        {gradoDocente.tipoDocente || 'Docente'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="stats-card">
                                        <div className="stats-number">{alumnos.length}</div>
                                        <div className="stats-label">Total Alumnos</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stats-card">
                                        <div className="stats-number">
                                            {alumnos.filter(alumno => alumno.genero === 'Masculino').length}
                                        </div>
                                        <div className="stats-label">Masculino</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stats-card">
                                        <div className="stats-number">
                                            {alumnos.filter(alumno => alumno.genero === 'Femenina').length}
                                        </div>
                                        <div className="stats-label">Femenino</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stats-card">
                                        <div className="stats-number">
                                            {Math.round(alumnos.reduce((sum, alumno) => sum + (calcularEdad(alumno.fechaNacimiento) || 0), 0) / alumnos.length) || 0}
                                        </div>
                                        <div className="stats-label">Edad Promedio</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Alumnos */}
                    <div className="card">
                        <div className="card-header">
                            <h4>📋 Lista de Alumnos</h4>
                        </div>
                        <div className="card-body">
                            {alumnos.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                                    <h5>No hay alumnos registrados</h5>
                                    <p className="text-muted">
                                        No se encontraron alumnos para este grado
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Vista de Grid - Desktop */}
                                    <div className="d-none d-lg-block">
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Alumno</th>
                                                        <th>Información Personal</th>
                                                        <th>Genero</th>
                                                        <th>Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {alumnos.map((alumno, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div>
                                                                        <h6 className="mb-0">
                                                                            {alumno.nombre} {alumno.apellido}
                                                                        </h6>
                                                                        <small className="text-muted">
                                                                            {alumno.dni || 'Sin documento'}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="info-personal">
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
                                                                    {alumno.genero || 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-success">
                                                                    {alumno.estadoPersona || 'Activo'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Vista de Cards - Mobile */}
                                    <div className="d-lg-none">
                                        <div className="row">
                                            {alumnos.map((alumno, index) => (
                                                <div key={index} className="col-12 mb-3">
                                                    <div className="card alumno-card">
                                                        <div className="card-body">
                                                            <div className="d-flex align-items-start">
                                                                <div className="avatar me-3">
                                                                    {getInitials(alumno.nombre, alumno.apellido)}
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <h6 className="card-title mb-2">
                                                                        {alumno.nombre} {alumno.apellido}
                                                                        <span className="badge bg-success ms-2">
                                                                            {alumno.estadoPersona || 'Activo'}
                                                                        </span>
                                                                    </h6>
                                                                    <div className="alumno-info">
                                                                        <div className="info-row">
                                                                            <span className="info-label">Documento:</span>
                                                                            <span className="info-value">{alumno.dni || 'Sin documento'}</span>
                                                                        </div>
                                                                        <div className="info-row">
                                                                            <span className="info-label">Edad:</span>
                                                                            <span className="info-value">{calcularEdad(alumno.fechaNacimiento)} años</span>
                                                                        </div>
                                                                        <div className="info-row">
                                                                            <span className="info-label">Género:</span>
                                                                            <span className="info-value">
                                                                                {alumno.genero || 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MisAlumnos;