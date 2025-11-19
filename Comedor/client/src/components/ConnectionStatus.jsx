import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/ConnectionStatus.css';

const ConnectionStatus = () => {
    const [status, setStatus] = useState({
        connected: false,
        loading: true,
        error: null,
        responseTime: null
    });

    const checkConnection = async () => {
        const startTime = Date.now();
        setStatus(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Intenta hacer una petición simple al servidor
            await API.get('/health');
            const responseTime = Date.now() - startTime;

            setStatus({
                connected: true,
                loading: false,
                error: null,
                responseTime
            });
        } catch (error) {
            setStatus({
                connected: false,
                loading: false,
                error: error.message,
                responseTime: null
            });
        }
    };

    useEffect(() => {
        checkConnection();

        // Verificar conexión cada 30 segundos
        const interval = setInterval(checkConnection, 30000);

        return () => clearInterval(interval);
    }, []);

    if (status.loading) {
        return (
            <div className="connection-status checking">
                <i className="fas fa-spinner fa-spin me-2"></i>
                Verificando conexión...
            </div>
        );
    }

    if (status.connected) {
        return (
            <div className="connection-status connected" title={`Tiempo de respuesta: ${status.responseTime}ms`}>
                <i className="fas fa-wifi text-success me-2"></i>
                <span className="text-success small">Conectado</span>
                {status.responseTime && (
                    <span className="ms-2 text-muted small">
                        {status.responseTime}ms
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="connection-status disconnected">
            <i className="fas fa-wifi text-danger me-2"></i>
            <span className="text-danger small">Sin conexión</span>
            <button
                className="btn btn-sm btn-outline-secondary ms-2"
                onClick={checkConnection}
                title="Reintentar conexión"
            >
                <i className="fas fa-sync"></i>
            </button>
            {status.error && (
                <div className="small text-muted mt-1">
                    {status.error}
                </div>
            )}
        </div>
    );
};

export default ConnectionStatus;