import { useState, useEffect } from 'react';
import axios from 'axios';

const GestionAsistencias = () => {
    const [loading, setLoading] = useState(false);
    const [docentes, setDocentes] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [grados, setGrados] = useState([]);
    const [enlaces, setEnlaces] = useState([]);

    const [formulario, setFormulario] = useState({
        idPersonaDocente: '',
        nombreGrado: '',
        fecha: new Date().toISOString().split('T')[0],
        idServicio: ''
    });

    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Cargar docentes
            const docentesRes = await axios.get('http://localhost:3000/docente-grados');
            const docentesUnicos = docentesRes.data.reduce((acc, docente) => {
                const key = `${docente.id_persona}`;
                if (!acc[key]) {
                    acc[key] = {
                        id_persona: docente.id_persona,
                        nombre: docente.nombre,
                        apellido: docente.apellido,
                        grados: []
                    };
                }
                acc[key].grados.push(docente.nombreGrado);
                return acc;
            }, {});
            setDocentes(Object.values(docentesUnicos));

            // Cargar servicios
            const serviciosRes = await axios.get('http://localhost:3000/servicios');
            setServicios(serviciosRes.data);

            // Cargar grados
            const gradosRes = await axios.get('http://localhost:3000/grados');
            setGrados(gradosRes.data);

        } catch (error) {
            console.error('Error al cargar datos:', error);
            setMensaje({ tipo: 'error', texto: 'Error al cargar los datos iniciales' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormulario(prev => ({
            ...prev,
            [name]: value
        }));
        setMensaje({ tipo: '', texto: '' });
    };

    const generarEnlace = async (e) => {
        e.preventDefault();

        if (!formulario.idPersonaDocente || !formulario.nombreGrado || !formulario.fecha || !formulario.idServicio) {
            setMensaje({ tipo: 'error', texto: 'Todos los campos son requeridos' });
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post('http://localhost:3000/asistencias/generar-token', {
                idPersonaDocente: parseInt(formulario.idPersonaDocente),
                nombreGrado: formulario.nombreGrado,
                fecha: formulario.fecha,
                idServicio: parseInt(formulario.idServicio)
            });

            const nuevoEnlace = {
                ...response.data,
                docenteNombre: docentes.find(d => d.id_persona.toString() === formulario.idPersonaDocente)?.nombre || '',
                docenteApellido: docentes.find(d => d.id_persona.toString() === formulario.idPersonaDocente)?.apellido || '',
                servicioNombre: servicios.find(s => s.id_servicio.toString() === formulario.idServicio)?.nombre || '',
                nombreGrado: formulario.nombreGrado,
                fecha: formulario.fecha,
                fechaGeneracion: new Date().toISOString()
            };

            setEnlaces(prev => [nuevoEnlace, ...prev]);
            setMensaje({ tipo: 'success', texto: '✅ Enlace generado correctamente' });

            // Limpiar formulario
            setFormulario({
                idPersonaDocente: '',
                nombreGrado: '',
                fecha: new Date().toISOString().split('T')[0],
                idServicio: ''
            });

        } catch (error) {
            console.error('Error al generar enlace:', error);
            setMensaje({ tipo: 'error', texto: 'Error al generar el enlace' });
        } finally {
            setLoading(false);
        }
    };

    const copiarEnlace = (enlace) => {
        navigator.clipboard.writeText(enlace).then(() => {
            setMensaje({ tipo: 'success', texto: '📋 Enlace copiado al portapapeles' });
            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
        });
    };

    const enviarPorWhatsApp = (enlace, docente, servicio, grado, fecha) => {
        const mensaje = `🍽️ *Registro de Asistencia - ${servicio}*\n\n` +
            `📚 Grado: ${grado}\n` +
            `📅 Fecha: ${new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES')}\n\n` +
            `Hola ${docente}, por favor registra la asistencia de tus alumnos para el servicio de comedor usando el siguiente enlace:\n\n` +
            `${enlace}\n\n` +
            `El enlace es válido por 24 horas.`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
    };

    const docenteSeleccionado = docentes.find(d => d.id_persona.toString() === formulario.idPersonaDocente);

    return (
        <div className="gestion-asistencias">
            <div className="header-section">
                <h2>📋 Gestión de Asistencias</h2>
                <p>Genera enlaces únicos para que los docentes registren la asistencia de sus alumnos</p>
            </div>

            {/* Formulario */}
            <div className="card form-card">
                <div className="card-header">
                    <h3>🔗 Generar Nuevo Enlace</h3>
                </div>
                <div className="card-body">
                    <form onSubmit={generarEnlace}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">👨‍🏫 Docente</label>
                                <select
                                    className="form-select"
                                    name="idPersonaDocente"
                                    value={formulario.idPersonaDocente}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Seleccionar docente</option>
                                    {docentes.map(docente => (
                                        <option key={docente.id_persona} value={docente.id_persona}>
                                            {docente.apellido}, {docente.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">📚 Grado</label>
                                <select
                                    className="form-select"
                                    name="nombreGrado"
                                    value={formulario.nombreGrado}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!docenteSeleccionado}
                                >
                                    <option value="">Seleccionar grado</option>
                                    {docenteSeleccionado?.grados.map(grado => (
                                        <option key={grado} value={grado}>
                                            {grado}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">📅 Fecha</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="fecha"
                                    value={formulario.fecha}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">🍽️ Servicio</label>
                                <select
                                    className="form-select"
                                    name="idServicio"
                                    value={formulario.idServicio}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Seleccionar servicio</option>
                                    {servicios.map(servicio => (
                                        <option key={servicio.id_servicio} value={servicio.id_servicio}>
                                            {servicio.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="d-grid">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        🔗 Generar Enlace
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Mensajes */}
            {mensaje.texto && (
                <div className={`alert alert-${mensaje.tipo === 'error' ? 'danger' : 'success'} alert-dismissible fade show`}>
                    {mensaje.texto}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setMensaje({ tipo: '', texto: '' })}
                    ></button>
                </div>
            )}

            {/* Lista de Enlaces Generados */}
            {enlaces.length > 0 && (
                <div className="card enlaces-card">
                    <div className="card-header">
                        <h3>📝 Enlaces Generados</h3>
                    </div>
                    <div className="card-body">
                        {enlaces.map((enlace, index) => (
                            <div key={index} className="enlace-item">
                                <div className="enlace-info">
                                    <div className="enlace-details">
                                        <strong>👨‍🏫 {enlace.docenteApellido}, {enlace.docenteNombre}</strong>
                                        <span className="badge bg-primary ms-2">{enlace.nombreGrado}</span>
                                        <span className="badge bg-info ms-1">{enlace.servicioNombre}</span>
                                        <span className="badge bg-secondary ms-1">
                                            {new Date(enlace.fecha + 'T00:00:00').toLocaleDateString('es-ES')}
                                        </span>
                                    </div>
                                    <div className="enlace-url">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={enlace.link}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="enlace-actions">
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => copiarEnlace(enlace.link)}
                                        title="Copiar enlace"
                                    >
                                        📋
                                    </button>
                                    <button
                                        className="btn btn-outline-success btn-sm"
                                        onClick={() => enviarPorWhatsApp(
                                            enlace.link,
                                            `${enlace.docenteNombre} ${enlace.docenteApellido}`,
                                            enlace.servicioNombre,
                                            enlace.nombreGrado,
                                            enlace.fecha
                                        )}
                                        title="Enviar por WhatsApp"
                                    >
                                        💬
                                    </button>
                                    <a
                                        href={enlace.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline-info btn-sm"
                                        title="Abrir enlace"
                                    >
                                        🔗
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionAsistencias;