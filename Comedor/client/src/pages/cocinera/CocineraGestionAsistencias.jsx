import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import '../../styles/CocineraGestionAsistencias.css';

const CocineraGestionAsistencias = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [servicios, setServicios] = useState([]);
    const [grados, setGrados] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [formulario, setFormulario] = useState({
        fecha: new Date().toISOString().split('T')[0],
        idServicio: '',
        gradosSeleccionados: [],
        mensaje: ''
    });
    const [enlaces, setEnlaces] = useState([]);
    const [mostrarEnlaces, setMostrarEnlaces] = useState(false);
    const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false);

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            const [serviciosRes, gradosRes, docentesRes, docenteGradosRes] = await Promise.all([
                API.get('/servicios'),
                API.get('/grados'),
                API.get('/personas'),
                API.get('/docente-grados')
            ]);

            setServicios(serviciosRes.data?.filter(s => s.estado === 'Activo') || []);
            setGrados(gradosRes.data?.filter(g => g.estado === 'Activo') || []);

            // Filtrar solo los docentes y agregar información de grados asignados
            const docentesFiltrados = docentesRes.data?.filter(
                p => p.nombreRol === 'Docente' && p.estado === 'Activo'
            ) || [];

            // Mapear docentes con sus grados asignados
            const docentesConGrados = docentesFiltrados.map(docente => {
                const gradosAsignados = docenteGradosRes.data?.filter(
                    dg => dg.idPersona === docente.id_persona || dg.idPersona === docente.idPersona
                ) || [];

                return {
                    ...docente,
                    gradosAsignados
                };
            });

            setDocentes(docentesConGrados);

        } catch (error) {
            console.error('Error al cargar datos:', error);
            alert('Error al cargar datos iniciales');
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
    };

    const handleGradoSelection = (gradoId) => {
        setFormulario(prev => ({
            ...prev,
            gradosSeleccionados: prev.gradosSeleccionados.includes(gradoId)
                ? prev.gradosSeleccionados.filter(id => id !== gradoId)
                : [...prev.gradosSeleccionados, gradoId]
        }));
    };

    const seleccionarTodosGrados = () => {
        const todosIds = grados.map(g => g.id_grado);
        setFormulario(prev => ({
            ...prev,
            gradosSeleccionados: prev.gradosSeleccionados.length === grados.length ? [] : todosIds
        }));
    };

    const generarEnlaces = async () => {
        try {
            setLoading(true);

            if (!formulario.fecha || !formulario.idServicio || formulario.gradosSeleccionados.length === 0) {
                alert('Por favor complete todos los campos requeridos');
                return;
            }

            // Generar enlaces para cada grado seleccionado
            const enlacesGenerados = [];

            for (const gradoId of formulario.gradosSeleccionados) {
                const grado = grados.find(g => g.id_grado === gradoId);
                const servicio = servicios.find(s => s.id_servicio === formulario.idServicio);

                // Crear un token único para este enlace
                const tokenData = {
                    fecha: formulario.fecha,
                    idServicio: formulario.idServicio,
                    idGrado: gradoId,
                    generadoPor: user.idPersona || user.id_persona,
                    timestamp: new Date().getTime()
                };

                // En una implementación real, esto debería generar un JWT o token seguro
                const token = btoa(JSON.stringify(tokenData));
                const enlace = `${window.location.origin}/asistencias/registro/${token}`;

                // Encontrar al docente asignado a este grado
                const docenteGrado = docentes.find(docente => {
                    return docente.gradosAsignados?.some(grad =>
                        grad.idGrado === gradoId || grad.id_grado === gradoId
                    );
                });

                enlacesGenerados.push({
                    id: `${gradoId}-${formulario.idServicio}`,
                    grado: grado?.nombreGrado || `Grado ${gradoId}`,
                    servicio: servicio?.nombre || 'Servicio',
                    enlace,
                    token,
                    docente: docenteGrado ? {
                        nombre: `${docenteGrado.nombre} ${docenteGrado.apellido}`,
                        telefono: docenteGrado.telefono || '000000000',
                        email: docenteGrado.email || docenteGrado.correo
                    } : null,
                    fecha: formulario.fecha
                });
            }

            setEnlaces(enlacesGenerados);
            setMostrarEnlaces(true);

        } catch (error) {
            console.error('Error al generar enlaces:', error);
            alert('Error al generar enlaces');
        } finally {
            setLoading(false);
        }
    };

    const copiarEnlace = (enlace) => {
        navigator.clipboard.writeText(enlace).then(() => {
            alert('Enlace copiado al portapapeles');
        });
    };

    const enviarWhatsAppIndividual = (telefono, mensaje, grado, servicio) => {
        const mensajeCompleto = `Hola! 📝

${mensaje || `Te envío el enlace para registrar asistencias del ${grado} para el servicio de ${servicio}.`}

Fecha: ${new Date(formulario.fecha).toLocaleDateString('es-ES')}
Servicio: ${servicio}
Grado: ${grado}

Por favor registra las asistencias en el siguiente enlace:
${enlaces.find(e => e.grado === grado && e.servicio === servicio)?.enlace}

Saludos,
${user.nombre} ${user.apellido}
🍳 Comedor Escolar`;

        const urlWhatsApp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensajeCompleto)}`;
        window.open(urlWhatsApp, '_blank');
    };

    const enviarWhatsAppTodos = async () => {
        if (enlaces.length === 0) {
            alert('Primero debe generar los enlaces');
            return;
        }

        setEnviandoWhatsApp(true);

        try {
            for (let i = 0; i < enlaces.length; i++) {
                const enlace = enlaces[i];
                if (enlace.docente?.telefono) {
                    enviarWhatsAppIndividual(
                        enlace.docente.telefono,
                        formulario.mensaje,
                        enlace.grado,
                        enlace.servicio
                    );

                    // Espera de 2 segundos entre envíos para no saturar
                    if (i < enlaces.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }

            alert('Enlaces enviados exitosamente por WhatsApp');
        } catch (error) {
            console.error('Error al enviar WhatsApp:', error);
            alert('Error al enviar algunos enlaces por WhatsApp');
        } finally {
            setEnviandoWhatsApp(false);
        }
    };

    const limpiarFormulario = () => {
        setFormulario({
            fecha: new Date().toISOString().split('T')[0],
            idServicio: '',
            gradosSeleccionados: [],
            mensaje: ''
        });
        setEnlaces([]);
        setMostrarEnlaces(false);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Generando enlaces...</span>
                </div>
                <p className="mt-3">Cargando gestión de asistencias...</p>
            </div>
        );
    }

    return (
        <div className="cocinera-gestion-asistencias">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="page-title">
                            <i className="fas fa-calendar-check me-2"></i>
                            Gestión de Asistencias
                        </h1>
                        <p>Generar y enviar enlaces de registro de asistencias a los docentes</p>
                    </div>
                </div>
            </div>
            <div className="page-header-cocinera">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Generar Enlaces de Asistencia</span>
                    </div>
                    <div className="card-body">
                        <form onSubmit={(e) => { e.preventDefault(); generarEnlaces(); }}>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="fecha" className="form-label">
                                        <i className="fas fa-calendar me-2"></i>
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="fecha"
                                        name="fecha"
                                        value={formulario.fecha}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label htmlFor="idServicio" className="form-label">
                                        <i className="fas fa-utensils me-2"></i>
                                        Servicio *
                                    </label>
                                    <select
                                        className="form-select"
                                        id="idServicio"
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

                            <div className="mb-3">
                                <div className="form-label">
                                    <i className="fas fa-school me-2"></i>
                                    Grados a incluir *
                                </div>
                                <div className="grados-selection">
                                    <div className="mb-2">
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={seleccionarTodosGrados}
                                        >
                                            {formulario.gradosSeleccionados.length === grados.length ?
                                                'Deseleccionar todos' : 'Seleccionar todos'}
                                        </button>
                                    </div>
                                    <div className="grados-grid">
                                        {grados.map(grado => {
                                            const docenteAsignado = docentes.find(docente =>
                                                docente.gradosAsignados?.some(grad =>
                                                    grad.idGrado === grado.id_grado || grad.id_grado === grado.id_grado
                                                )
                                            );

                                            return (
                                                <div key={grado.id_grado} className="grado-item">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`grado-${grado.id_grado}`}
                                                            checked={formulario.gradosSeleccionados.includes(grado.id_grado)}
                                                            onChange={() => handleGradoSelection(grado.id_grado)}
                                                        />
                                                        <label
                                                            className="form-check-label grado-label"
                                                            htmlFor={`grado-${grado.id_grado}`}
                                                        >
                                                            <div className="grado-nombre">{grado.nombreGrado}</div>
                                                            <div className="docente-asignado">
                                                                {docenteAsignado ? (
                                                                    <span className="text-success">
                                                                        <i className="fas fa-user me-1"></i>
                                                                        {docenteAsignado.nombre} {docenteAsignado.apellido}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-warning">
                                                                        <i className="fas fa-exclamation-triangle me-1"></i>
                                                                        Sin docente asignado
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="mensaje" className="form-label">
                                    <i className="fas fa-comment me-2"></i>
                                    Mensaje personalizado (opcional)
                                </label>
                                <textarea
                                    className="form-control"
                                    id="mensaje"
                                    name="mensaje"
                                    rows="3"
                                    placeholder="Mensaje adicional para los docentes..."
                                    value={formulario.mensaje}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    <i className="fas fa-link me-2"></i>
                                    {loading ? 'Generando...' : 'Generar Enlaces'}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={limpiarFormulario}
                                >
                                    <i className="fas fa-broom me-2"></i>
                                    Limpiar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Panel de enlaces generados */}
            {mostrarEnlaces && enlaces.length > 0 && (
                <div className="card mt-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h4>🔗 Enlaces Generados</h4>
                        <div>
                            <button
                                className="btn btn-success me-2"
                                onClick={enviarWhatsAppTodos}
                                disabled={enviandoWhatsApp}
                            >
                                <i className="fab fa-whatsapp me-2"></i>
                                {enviandoWhatsApp ? 'Enviando...' : 'Enviar todos por WhatsApp'}
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Grado</th>
                                        <th>Servicio</th>
                                        <th>Docente</th>
                                        <th>Enlace</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enlaces.map((enlace) => (
                                        <tr key={enlace.id}>
                                            <td>
                                                <span className="badge bg-primary">
                                                    {enlace.grado}
                                                </span>
                                            </td>
                                            <td>{enlace.servicio}</td>
                                            <td>
                                                {enlace.docente ? (
                                                    <div>
                                                        <div>{enlace.docente.nombre}</div>
                                                        <small className="text-muted">
                                                            {enlace.docente.telefono}
                                                        </small>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Sin asignar</span>
                                                )}
                                            </td>
                                            <td>
                                                <code className="enlace-preview">
                                                    {enlace.enlace.substring(0, 50)}...
                                                </code>
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm"
                                                        onClick={() => copiarEnlace(enlace.enlace)}
                                                        title="Copiar enlace"
                                                    >
                                                        <i className="fas fa-copy"></i>
                                                    </button>
                                                    {enlace.docente?.telefono && (
                                                        <button
                                                            className="btn btn-outline-success btn-sm"
                                                            onClick={() => enviarWhatsAppIndividual(
                                                                enlace.docente.telefono,
                                                                formulario.mensaje,
                                                                enlace.grado,
                                                                enlace.servicio
                                                            )}
                                                            title="Enviar por WhatsApp"
                                                        >
                                                            <i className="fab fa-whatsapp"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CocineraGestionAsistencias;
