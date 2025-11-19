import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from "../../services/api.js";

const TestAsistencias = () => {
    const { token } = useParams();
    const [estado, setEstado] = useState('inicial');
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const probarAPI = async () => {
            try {
                setEstado('cargando');
                console.log('🧪 Test: Iniciando con token:', token);
                
                const response = await API.get(`/asistencias/registro/${token}`);
                
                console.log('🧪 Test: Respuesta completa:', response);
                console.log('🧪 Test: Datos recibidos:', response.data);
                
                setDatos(response.data);
                setEstado('exitoso');
                
            } catch (err) {
                console.error('🧪 Test: Error capturado:', err);
                setError(err);
                setEstado('error');
            }
        };

        if (token) {
            probarAPI();
        }
    }, [token]);

    if (!token) {
        return <div>❌ No hay token en la URL</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>🧪 Test de API - Asistencias</h1>
            
            <div style={{ background: '#f5f5f5', padding: '10px', margin: '10px 0' }}>
                <strong>Token:</strong> {token.substring(0, 50)}...
            </div>
            
            <div style={{ background: '#e6f3ff', padding: '10px', margin: '10px 0' }}>
                <strong>Estado:</strong> {estado}
            </div>

            {estado === 'cargando' && (
                <div>🔄 Cargando datos...</div>
            )}

            {estado === 'error' && (
                <div style={{ background: '#ffebee', padding: '10px', color: '#c62828' }}>
                    <h3>❌ Error:</h3>
                    <pre>{JSON.stringify(error.message, null, 2)}</pre>
                    {error.response && (
                        <div>
                            <strong>Status:</strong> {error.response.status}<br/>
                            <strong>Data:</strong> <pre>{JSON.stringify(error.response.data, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}

            {estado === 'exitoso' && datos && (
                <div style={{ background: '#e8f5e8', padding: '10px' }}>
                    <h3>✅ Datos cargados exitosamente:</h3>
                    
                    <div style={{ margin: '10px 0' }}>
                        <h4>🍽️ Servicio:</h4>
                        <pre>{JSON.stringify(datos.servicio, null, 2)}</pre>
                    </div>

                    <div style={{ margin: '10px 0' }}>
                        <h4>📋 Token Data:</h4>
                        <pre>{JSON.stringify(datos.tokenData, null, 2)}</pre>
                    </div>

                    <div style={{ margin: '10px 0' }}>
                        <h4>👥 Alumnos ({datos.alumnos?.length || 0}):</h4>
                        <pre>{JSON.stringify(datos.alumnos, null, 2)}</pre>
                    </div>

                    {datos.alumnos?.length > 0 && (
                        <div style={{ margin: '10px 0', background: '#ffffff', padding: '10px' }}>
                            <h4>📝 Lista de Alumnos:</h4>
                            {datos.alumnos.map((alumno, index) => (
                                <div key={index} style={{ margin: '5px 0', padding: '5px', border: '1px solid #ccc' }}>
                                    <strong>{alumno.apellido}, {alumno.nombre}</strong><br/>
                                    DNI: {alumno.dni}<br/>
                                    Estado: {alumno.estado}<br/>
                                    ID: {alumno.id_alumnoGrado}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TestAsistencias;