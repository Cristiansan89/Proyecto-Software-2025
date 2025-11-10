import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/DocenteHorarios.css';
import API from "../../services/api.js";

const Horarios = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [horarios, setHorarios] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [grados, setGrados] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);

                // Cargar servicios
                const serviciosRes = await API.get('/servicios');
                setServicios(serviciosRes.data || []);

                // Cargar grados asignados al docente
                const gradosRes = await API.get(`/docente-grados?idPersona=${user.idPersona || user.id_persona}`);
                setGrados(gradosRes.data || []);

                // Cargar horarios (simulados por ahora)
                const horariosSimulados = generarHorariosSimulados(serviciosRes.data || []);
                setHorarios(horariosSimulados);

            } catch (error) {
                console.error('Error al cargar datos:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [user.idPersona, user.id_persona]);

    const generarHorariosSimulados = (serviciosData) => {
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const horarios = [];

        diasSemana.forEach(dia => {
            serviciosData.forEach(servicio => {
                if (servicio.estado === 'Activo') {
                    horarios.push({
                        id: `${dia}-${servicio.id_servicio}`,
                        dia,
                        servicio: servicio.nombre,
                        hora_inicio: getHoraServicio(servicio.nombre, 'inicio'),
                        hora_fin: getHoraServicio(servicio.nombre, 'fin'),
                        descripcion: servicio.descripcion,
                        tipo: 'servicio'
                    });
                }
            });
        });

        return horarios;
    };

    const getHoraServicio = (nombreServicio, tipo) => {
        const horariosPorServicio = {
            'Desayuno': { inicio: '07:30', fin: '08:30' },
            'Almuerzo': { inicio: '12:00', fin: '13:00' },
            'Merienda': { inicio: '15:30', fin: '16:30' },
            'Cena': { inicio: '19:00', fin: '20:00' }
        };

        const servicio = Object.keys(horariosPorServicio).find(key =>
            nombreServicio.toLowerCase().includes(key.toLowerCase())
        );

        return servicio ? horariosPorServicio[servicio][tipo] : '00:00';
    };

    const getDiaActual = () => {
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return diasSemana[new Date().getDay()];
    };

    const getHorariosPorDia = (dia) => {
        return horarios.filter(h => h.dia === dia).sort((a, b) =>
            a.hora_inicio.localeCompare(b.hora_inicio)
        );
    };

    const esHoraActual = (horaInicio, horaFin) => {
        const ahora = new Date();
        const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
        return horaActual >= horaInicio && horaActual <= horaFin;
    };

    if (loading) {
        return (
            <div className="horarios">
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3">Cargando horarios...</p>
                </div>
            </div>
        );
    }

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const diaActual = getDiaActual();

    return (
        <div className="horarios">
            <div className="page-header">
                <h2>🕐 Horarios</h2>
                <p>Horarios de servicios de comedor para la semana</p>
            </div>

            {/* Información del docente */}
            <div className="card mb-4">
                <div className="card-header">
                    <h4>👨‍🏫 Información del Docente</h4>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <p><strong>Nombre:</strong> {user.nombre} {user.apellido}</p>
                            <p><strong>Grados Asignados:</strong></p>
                            <div className="grados-badges">
                                {grados.length > 0 ? (
                                    grados.map((grado, index) => (
                                        <span key={index} className="badge bg-primary me-2 mb-2">
                                            {grado.nombreGrado}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-muted">No hay grados asignados</span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="hora-actual-card">
                                <h5>🕒 Hora Actual</h5>
                                <p className="hora-actual">
                                    {new Date().toLocaleString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Horarios por día */}
            <div className="horarios-semana">
                {diasSemana.map(dia => {
                    const horariosDelDia = getHorariosPorDia(dia);
                    const esDiaActual = dia === diaActual;

                    return (
                        <div key={dia} className={`card mb-3 ${esDiaActual ? 'dia-actual' : ''}`}>
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    {esDiaActual && '📍 '}
                                    {dia}
                                    {esDiaActual && ' (Hoy)'}
                                </h5>
                                <span className="badge bg-info">
                                    {horariosDelDia.length} servicios
                                </span>
                            </div>
                            <div className="card-body">
                                {horariosDelDia.length === 0 ? (
                                    <p className="text-muted text-center py-3">
                                        No hay servicios programados para este día
                                    </p>
                                ) : (
                                    <div className="row">
                                        {horariosDelDia.map(horario => {
                                            const esActivo = esDiaActual && esHoraActual(horario.hora_inicio, horario.hora_fin);

                                            return (
                                                <div key={horario.id} className="col-md-6 mb-3">
                                                    <div className={`horario-item ${esActivo ? 'activo' : ''}`}>
                                                        <div className="horario-header">
                                                            <h6 className="horario-servicio">
                                                                🍽️ {horario.servicio}
                                                                {esActivo && (
                                                                    <span className="badge bg-success ms-2">
                                                                        En curso
                                                                    </span>
                                                                )}
                                                            </h6>
                                                            <div className="horario-tiempo">
                                                                <i className="fas fa-clock me-1"></i>
                                                                {horario.hora_inicio} - {horario.hora_fin}
                                                            </div>
                                                        </div>
                                                        <p className="horario-descripcion">
                                                            {horario.descripcion}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Resumen de servicios */}
            <div className="card mt-4">
                <div className="card-header">
                    <h4>📊 Resumen de Servicios</h4>
                </div>
                <div className="card-body">
                    <div className="row">
                        {servicios.filter(s => s.estado === 'Activo').map(servicio => (
                            <div key={servicio.id_servicio} className="col-md-3 mb-3">
                                <div className="servicio-resumen">
                                    <div className="servicio-icono">
                                        🍽️
                                    </div>
                                    <h6>{servicio.nombre}</h6>
                                    <p className="text-muted small">
                                        {servicio.descripcion}
                                    </p>
                                    <div className="servicio-horario">
                                        <small>
                                            <i className="fas fa-clock me-1"></i>
                                            {getHoraServicio(servicio.nombre, 'inicio')} - {getHoraServicio(servicio.nombre, 'fin')}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Horarios;
