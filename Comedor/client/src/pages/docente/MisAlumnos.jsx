import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const MisAlumnos = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [grados, setGrados] = useState([]);
    const [gradoSeleccionado, setGradoSeleccionado] = useState('');
    const [alumnos, setAlumnos] = useState([]);

    useEffect(() => {
        const cargarGrados = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:3000/docente-grados?idPersona=${user.idPersona || user.id_persona}`);
                const gradosData = response.data || [];
                setGrados(gradosData);

                // Seleccionar automáticamente el primer grado si existe
                if (gradosData.length > 0) {
                    setGradoSeleccionado(gradosData[0].nombreGrado);
                }
            } catch (error) {
                console.error('Error al cargar grados:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarGrados();
    }, [user.idPersona, user.id_persona]);

    useEffect(() => {
        const cargarAlumnos = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/alumnos-grado?nombreGrado=${encodeURIComponent(gradoSeleccionado)}`);
                setAlumnos(response.data || []);
            } catch (error) {
                console.error('Error al cargar alumnos:', error);
                setAlumnos([]);
            }
        };

        if (gradoSeleccionado) {
            cargarAlumnos();
        }
    }, [gradoSeleccionado]);

    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return 'N/A';
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();

        if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        return edad;
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES');
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

    return (
        <div className="mis-alumnos">
            <div className="page-header">
                <h2>👥 Mis Alumnos</h2>
                <p>Información de los alumnos a tu cargo</p>
            </div>

            {grados.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center">
                        <i className="fas fa-user-graduate fa-3x text-muted mb-3"></i>
                        <h4>No tienes grados asignados</h4>
                        <p>Contacta al administrador para que te asigne grados</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Selector de Grado */}
                    {grados.length > 1 && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h4>📚 Seleccionar Grado</h4>
                            </div>
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-md-6">
                                        <select
                                            className="form-select"
                                            value={gradoSeleccionado}
                                            onChange={(e) => setGradoSeleccionado(e.target.value)}
                                        >
                                            {grados.map((grado, index) => (
                                                <option key={index} value={grado.nombreGrado}>
                                                    {grado.nombreGrado}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="grado-info">
                                            {grados.find(g => g.nombreGrado === gradoSeleccionado) && (
                                                <>
                                                    <span className="badge bg-info me-2">
                                                        Ciclo {new Date(grados.find(g => g.nombreGrado === gradoSeleccionado).cicloLectivo).getFullYear()}
                                                    </span>
                                                    <span className="badge bg-success">
                                                        {grados.find(g => g.nombreGrado === gradoSeleccionado).tipoDocente || 'Docente'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lista de Alumnos */}
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4>👥 Alumnos de {gradoSeleccionado}</h4>
                            <span className="badge bg-primary fs-6">
                                Total: {alumnos.length} alumnos
                            </span>
                        </div>
                        <div className="card-body">
                            {alumnos.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                                    <h5>No hay alumnos registrados</h5>
                                    <p className="text-muted">
                                        {gradoSeleccionado ?
                                            `No se encontraron alumnos para el grado ${gradoSeleccionado}` :
                                            'Selecciona un grado para ver los alumnos'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-dark">
                                            <tr>
                                                <th scope="col">#</th>
                                                <th scope="col">Foto</th>
                                                <th scope="col">Nombre Completo</th>
                                                <th scope="col">DNI</th>
                                                <th scope="col">Edad</th>
                                                <th scope="col">Fecha Nacimiento</th>
                                                <th scope="col">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {alumnos.map((alumno, index) => (
                                                <tr key={alumno.id_persona}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <div className="avatar-container">
                                                            {alumno.foto ? (
                                                                <img
                                                                    src={alumno.foto}
                                                                    alt={`${alumno.nombre} ${alumno.apellido}`}
                                                                    className="avatar-img"
                                                                />
                                                            ) : (
                                                                <div className="avatar-placeholder">
                                                                    <i className="fas fa-user"></i>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="student-name">
                                                            <strong>{alumno.apellido}, {alumno.nombre}</strong>
                                                            {alumno.segundo_nombre && (
                                                                <small className="text-muted d-block">
                                                                    {alumno.segundo_nombre}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light text-dark">
                                                            {alumno.dni || 'Sin DNI'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="edad-badge">
                                                            {calcularEdad(alumno.fecha_nacimiento)} años
                                                        </span>
                                                    </td>
                                                    <td>{formatearFecha(alumno.fecha_nacimiento)}</td>
                                                    <td>
                                                        <span className={`badge ${alumno.estado === 'Activo' ? 'bg-success' : 'bg-secondary'
                                                            }`}>
                                                            {alumno.estado || 'Activo'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Estadísticas */}
                    {alumnos.length > 0 && (
                        <div className="row mt-4">
                            <div className="col-md-3">
                                <div className="card bg-primary text-white">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-users fa-2x me-3"></i>
                                            <div>
                                                <h5 className="mb-0">{alumnos.length}</h5>
                                                <small>Total Alumnos</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-success text-white">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-user-check fa-2x me-3"></i>
                                            <div>
                                                <h5 className="mb-0">
                                                    {alumnos.filter(a => a.estado === 'Activo' || !a.estado).length}
                                                </h5>
                                                <small>Activos</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-info text-white">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-birthday-cake fa-2x me-3"></i>
                                            <div>
                                                <h5 className="mb-0">
                                                    {Math.round(alumnos.reduce((acc, alumno) =>
                                                        acc + calcularEdad(alumno.fecha_nacimiento), 0) / alumnos.length) || 0}
                                                </h5>
                                                <small>Edad Promedio</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-warning text-white">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-id-card fa-2x me-3"></i>
                                            <div>
                                                <h5 className="mb-0">
                                                    {alumnos.filter(a => a.dni && a.dni.trim()).length}
                                                </h5>
                                                <small>Con DNI</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <style jsx>{`
                .avatar-container {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f8f9fa;
                    border: 2px solid #dee2e6;
                }

                .avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-placeholder {
                    color: #6c757d;
                    font-size: 1.2rem;
                }

                .student-name strong {
                    color: #2c3e50;
                }

                .edad-badge {
                    font-weight: 600;
                    color: #495057;
                }

                .loading-container {
                    text-align: center;
                    padding: 3rem;
                }

                .card {
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
                    border: 1px solid rgba(0, 0, 0, 0.125);
                }

                .table th {
                    border-top: none;
                    font-weight: 600;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .table td {
                    vertical-align: middle;
                    padding: 0.75rem;
                }

                .table-hover tbody tr:hover {
                    background-color: rgba(0, 123, 255, 0.05);
                }
            `}</style>
        </div>
    );
};

export default MisAlumnos;