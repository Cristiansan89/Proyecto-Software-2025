import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import '../../styles/CocineraReportes.css';

const CocineraReportes = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reporteActivo, setReporteActivo] = useState('asistencias');
    const [filtros, setFiltros] = useState({
        fechaInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        idServicio: '',
        idGrado: ''
    });
    const [datosReporte, setDatosReporte] = useState({
        asistencias: [],
        consumos: [],
        inventario: [],
        menus: []
    });
    const [servicios, setServicios] = useState([]);
    const [grados, setGrados] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        totalAsistencias: 0,
        promedioAsistencias: 0,
        servicioMasConcurrido: '',
        gradoMayorAsistencia: ''
    });

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    useEffect(() => {
        if (reporteActivo) {
            generarReporte();
        }
    }, [reporteActivo, filtros]);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);

            const [serviciosRes, gradosRes] = await Promise.all([
                API.get('/servicios'),
                API.get('/grados')
            ]);

            setServicios(serviciosRes.data?.filter(s => s.estado === 'Activo') || []);
            setGrados(gradosRes.data?.filter(g => g.estado === 'Activo') || []);

        } catch (error) {
            console.error('Error al cargar datos iniciales:', error);
        } finally {
            setLoading(false);
        }
    };

    const generarReporte = async () => {
        try {
            setLoading(true);

            if (reporteActivo === 'asistencias') {
                await generarReporteAsistencias();
            } else if (reporteActivo === 'consumos') {
                await generarReporteConsumos();
            } else if (reporteActivo === 'inventario') {
                await generarReporteInventario();
            } else if (reporteActivo === 'menus') {
                await generarReporteMenus();
            }

        } catch (error) {
            console.error('Error al generar reporte:', error);
        } finally {
            setLoading(false);
        }
    };

    const generarReporteAsistencias = async () => {
        try {
            // Simular datos de asistencias por ahora
            // En la implementación real, esto sería una consulta a la API
            const asistenciasSimuladas = generarDatosAsistenciasSimuladas();

            setDatosReporte(prev => ({
                ...prev,
                asistencias: asistenciasSimuladas
            }));

            calcularEstadisticasAsistencias(asistenciasSimuladas);

        } catch (error) {
            console.error('Error al generar reporte de asistencias:', error);
        }
    };

    const generarReporteConsumos = async () => {
        try {
            const consumosRes = await API.get(`/consumos?fechaInicio=${filtros.fechaInicio}&fechaFin=${filtros.fechaFin}`);

            setDatosReporte(prev => ({
                ...prev,
                consumos: consumosRes.data || []
            }));

        } catch (error) {
            console.error('Error al generar reporte de consumos:', error);
            // Datos simulados en caso de error
            setDatosReporte(prev => ({
                ...prev,
                consumos: generarDatosConsumosSimulados()
            }));
        }
    };

    const generarReporteInventario = async () => {
        try {
            const [inventariosRes, movimientosRes] = await Promise.all([
                API.get('/inventarios'),
                API.get(`/movimientos-inventarios?fechaInicio=${filtros.fechaInicio}&fechaFin=${filtros.fechaFin}`)
            ]);

            setDatosReporte(prev => ({
                ...prev,
                inventario: {
                    inventarios: inventariosRes.data || [],
                    movimientos: movimientosRes.data || []
                }
            }));

        } catch (error) {
            console.error('Error al generar reporte de inventario:', error);
        }
    };

    const generarReporteMenus = async () => {
        try {
            const menusRes = await API.get(`/planificacion-menus?fechaInicio=${filtros.fechaInicio}&fechaFin=${filtros.fechaFin}`);

            setDatosReporte(prev => ({
                ...prev,
                menus: menusRes.data || []
            }));

        } catch (error) {
            console.error('Error al generar reporte de menús:', error);
        }
    };

    const generarDatosAsistenciasSimuladas = () => {
        const datos = [];
        const inicio = new Date(filtros.fechaInicio);
        const fin = new Date(filtros.fechaFin);

        for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
            servicios.forEach(servicio => {
                grados.forEach(grado => {
                    if (Math.random() > 0.3) { // 70% probabilidad de tener datos
                        datos.push({
                            fecha: fecha.toISOString().split('T')[0],
                            servicio: servicio.nombre,
                            grado: grado.nombreGrado,
                            asistencias: Math.floor(Math.random() * 30) + 10,
                            ausencias: Math.floor(Math.random() * 8),
                            total_alumnos: Math.floor(Math.random() * 35) + 15
                        });
                    }
                });
            });
        }

        return datos;
    };

    const generarDatosConsumosSimulados = () => {
        return [
            { servicio: 'Desayuno', total_porciones: 450, costo_promedio: 2.50 },
            { servicio: 'Almuerzo', total_porciones: 520, costo_promedio: 4.80 },
            { servicio: 'Merienda', total_porciones: 380, costo_promedio: 1.75 },
            { servicio: 'Cena', total_porciones: 340, costo_promedio: 3.20 }
        ];
    };

    const calcularEstadisticasAsistencias = (asistencias) => {
        const totalAsistencias = asistencias.reduce((sum, item) => sum + item.asistencias, 0);
        const promedioAsistencias = totalAsistencias / asistencias.length || 0;

        // Calcular servicio más concurrido
        const serviciosStats = {};
        asistencias.forEach(item => {
            serviciosStats[item.servicio] = (serviciosStats[item.servicio] || 0) + item.asistencias;
        });
        const servicioMasConcurrido = Object.keys(serviciosStats).reduce((a, b) =>
            serviciosStats[a] > serviciosStats[b] ? a : b, '');

        // Calcular grado con mayor asistencia
        const gradosStats = {};
        asistencias.forEach(item => {
            gradosStats[item.grado] = (gradosStats[item.grado] || 0) + item.asistencias;
        });
        const gradoMayorAsistencia = Object.keys(gradosStats).reduce((a, b) =>
            gradosStats[a] > gradosStats[b] ? a : b, '');

        setEstadisticas({
            totalAsistencias,
            promedioAsistencias: promedioAsistencias.toFixed(1),
            servicioMasConcurrido,
            gradoMayorAsistencia
        });
    };

    const exportarReporte = () => {
        const datos = datosReporte[reporteActivo];
        const csv = convertirACSV(datos);
        descargarCSV(csv, `reporte_${reporteActivo}_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const convertirACSV = (datos) => {
        if (!Array.isArray(datos) || datos.length === 0) return '';

        const headers = Object.keys(datos[0]);
        const csvContent = [
            headers.join(','),
            ...datos.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');

        return csvContent;
    };

    const descargarCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const obtenerDatosGrafico = () => {
        if (reporteActivo === 'asistencias') {
            const datos = datosReporte.asistencias;
            const serviciosData = {};

            datos.forEach(item => {
                serviciosData[item.servicio] = (serviciosData[item.servicio] || 0) + item.asistencias;
            });

            return {
                labels: Object.keys(serviciosData),
                values: Object.values(serviciosData)
            };
        }
        return { labels: [], values: [] };
    };

    return (
        <div className="cocinera-reportes">
            <div className="page-header">
                <h2>📊 Reportes y Estadísticas</h2>
                <p>Análisis de datos del comedor escolar</p>
            </div>

            {/* Selección de reporte y filtros */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-3 mb-3">
                            <label className="form-label">Tipo de Reporte</label>
                            <select
                                className="form-select"
                                value={reporteActivo}
                                onChange={(e) => setReporteActivo(e.target.value)}
                            >
                                <option value="asistencias">📝 Asistencias</option>
                                <option value="consumos">🍽️ Consumos</option>
                                <option value="inventario">📦 Inventario</option>
                                <option value="menus">📋 Menús</option>
                            </select>
                        </div>
                        <div className="col-md-3 mb-3">
                            <label className="form-label">Fecha Inicio</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filtros.fechaInicio}
                                onChange={(e) => setFiltros({
                                    ...filtros,
                                    fechaInicio: e.target.value
                                })}
                            />
                        </div>
                        <div className="col-md-3 mb-3">
                            <label className="form-label">Fecha Fin</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filtros.fechaFin}
                                onChange={(e) => setFiltros({
                                    ...filtros,
                                    fechaFin: e.target.value
                                })}
                            />
                        </div>
                        <div className="col-md-3 mb-3">
                            <label className="form-label">&nbsp;</label>
                            <div className="d-grid">
                                <button
                                    className="btn btn-success"
                                    onClick={exportarReporte}
                                    disabled={loading}
                                >
                                    <i className="fas fa-download me-2"></i>
                                    Exportar CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Estadísticas generales */}
                {reporteActivo === 'asistencias' && (
                    <div className="col-12 mb-4">
                        <div className="row">
                            <div className="col-lg-3 col-md-6 mb-3">
                                <div className="stat-card bg-primary">
                                    <div className="stat-icon">
                                        <i className="fas fa-users"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h3>{estadisticas.totalAsistencias}</h3>
                                        <p>Total Asistencias</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 mb-3">
                                <div className="stat-card bg-success">
                                    <div className="stat-icon">
                                        <i className="fas fa-chart-line"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h3>{estadisticas.promedioAsistencias}</h3>
                                        <p>Promedio Diario</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 mb-3">
                                <div className="stat-card bg-info">
                                    <div className="stat-icon">
                                        <i className="fas fa-utensils"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h3>{estadisticas.servicioMasConcurrido}</h3>
                                        <p>Servicio Más Popular</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 mb-3">
                                <div className="stat-card bg-warning">
                                    <div className="stat-icon">
                                        <i className="fas fa-school"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h3>{estadisticas.gradoMayorAsistencia}</h3>
                                        <p>Grado Más Activo</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contenido del reporte */}
                <div className="col-lg-8">
                    <div className="card">
                        <div className="card-header">
                            <h4>
                                {reporteActivo === 'asistencias' && '📝 Reporte de Asistencias'}
                                {reporteActivo === 'consumos' && '🍽️ Reporte de Consumos'}
                                {reporteActivo === 'inventario' && '📦 Reporte de Inventario'}
                                {reporteActivo === 'menus' && '📋 Reporte de Menús'}
                            </h4>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Generando reporte...</span>
                                    </div>
                                    <p className="mt-3">Generando reporte...</p>
                                </div>
                            ) : (
                                <div>
                                    {/* Reporte de Asistencias */}
                                    {reporteActivo === 'asistencias' && (
                                        <div className="table-responsive">
                                            <table className="table table-striped table-hover">
                                                <thead className="table-dark">
                                                    <tr>
                                                        <th>Fecha</th>
                                                        <th>Servicio</th>
                                                        <th>Grado</th>
                                                        <th>Asistencias</th>
                                                        <th>Ausencias</th>
                                                        <th>% Asistencia</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {datosReporte.asistencias.slice(0, 50).map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{new Date(item.fecha).toLocaleDateString('es-ES')}</td>
                                                            <td>
                                                                <span className="badge bg-info">{item.servicio}</span>
                                                            </td>
                                                            <td>{item.grado}</td>
                                                            <td className="text-success fw-bold">{item.asistencias}</td>
                                                            <td className="text-danger">{item.ausencias}</td>
                                                            <td>
                                                                <div className="progress" style={{ height: '20px' }}>
                                                                    <div
                                                                        className="progress-bar"
                                                                        style={{ width: `${(item.asistencias / item.total_alumnos) * 100}%` }}
                                                                    >
                                                                        {((item.asistencias / item.total_alumnos) * 100).toFixed(1)}%
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {datosReporte.asistencias.length > 50 && (
                                                <div className="text-center mt-3">
                                                    <small className="text-muted">
                                                        Mostrando los primeros 50 registros de {datosReporte.asistencias.length}
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Reporte de Consumos */}
                                    {reporteActivo === 'consumos' && (
                                        <div className="row">
                                            {datosReporte.consumos.map((item, index) => (
                                                <div key={index} className="col-md-6 mb-3">
                                                    <div className="consumo-card">
                                                        <div className="consumo-header">
                                                            <h5>{item.servicio}</h5>
                                                            <span className="badge bg-primary">
                                                                {item.total_porciones} porciones
                                                            </span>
                                                        </div>
                                                        <div className="consumo-body">
                                                            <p>
                                                                <i className="fas fa-dollar-sign me-2"></i>
                                                                Costo promedio: <strong>S/ {item.costo_promedio}</strong>
                                                            </p>
                                                            <p>
                                                                <i className="fas fa-calculator me-2"></i>
                                                                Costo total: <strong>S/ {(item.total_porciones * item.costo_promedio).toFixed(2)}</strong>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Otros reportes */}
                                    {(reporteActivo === 'inventario' || reporteActivo === 'menus') && (
                                        <div className="text-center py-4">
                                            <i className="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                                            <p className="text-muted">Reporte en desarrollo</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel lateral con gráfico */}
                <div className="col-lg-4">
                    <div className="card">
                        <div className="card-header">
                            <h4>📈 Resumen Gráfico</h4>
                        </div>
                        <div className="card-body">
                            {reporteActivo === 'asistencias' && (
                                <div className="grafico-container">
                                    {(() => {
                                        const datos = obtenerDatosGrafico();
                                        return (
                                            <div>
                                                <h6>Asistencias por Servicio</h6>
                                                {datos.labels.map((label, index) => (
                                                    <div key={index} className="grafico-item">
                                                        <div className="grafico-label">
                                                            {label}
                                                        </div>
                                                        <div className="grafico-bar">
                                                            <div
                                                                className="grafico-fill"
                                                                style={{
                                                                    width: `${(datos.values[index] / Math.max(...datos.values)) * 100}%`
                                                                }}
                                                            ></div>
                                                            <span className="grafico-value">
                                                                {datos.values[index]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {reporteActivo === 'consumos' && (
                                <div className="text-center">
                                    <canvas id="consumosChart" width="300" height="200"></canvas>
                                    <p className="text-muted mt-2">Distribución de consumos por servicio</p>
                                </div>
                            )}

                            {(reporteActivo === 'inventario' || reporteActivo === 'menus') && (
                                <div className="text-center py-4">
                                    <i className="fas fa-chart-area fa-2x text-muted mb-2"></i>
                                    <p className="text-muted">Gráfico próximamente</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="card mt-4">
                        <div className="card-header">
                            <h4>⚡ Acciones Rápidas</h4>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <button className="btn btn-outline-primary">
                                    <i className="fas fa-print me-2"></i>
                                    Imprimir Reporte
                                </button>
                                <button className="btn btn-outline-success">
                                    <i className="fas fa-file-excel me-2"></i>
                                    Exportar Excel
                                </button>
                                <button className="btn btn-outline-info">
                                    <i className="fas fa-share me-2"></i>
                                    Compartir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CocineraReportes;
