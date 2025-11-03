import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        // Actualiza el state para mostrar la UI de error
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log del error
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // UI de fallback personalizada
            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <div className="error-icon">
                            <i className="fas fa-bug"></i>
                        </div>
                        <h2>¡Oops! Algo salió mal</h2>
                        <p>Ha ocurrido un error inesperado en la aplicación.</p>

                        <div className="error-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                <i className="fas fa-redo me-2"></i>
                                Recargar Página
                            </button>
                            <button
                                className="btn btn-secondary ms-2"
                                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Intentar de Nuevo
                            </button>
                        </div>

                        <details className="error-details mt-3">
                            <summary>Detalles técnicos (para desarrolladores)</summary>
                            <div className="error-stack">
                                <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                                <br />
                                <strong>Ubicación:</strong> {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </div>
                        </details>
                    </div>

                    <style jsx>{`
                        .error-boundary {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 60vh;
                            padding: 2rem;
                            background-color: #f8f9fa;
                        }
                        
                        .error-content {
                            text-align: center;
                            max-width: 600px;
                            background: white;
                            padding: 3rem 2rem;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        }
                        
                        .error-icon {
                            font-size: 4rem;
                            color: #dc3545;
                            margin-bottom: 1.5rem;
                        }
                        
                        .error-icon i {
                            animation: pulse 2s infinite;
                        }
                        
                        @keyframes pulse {
                            0% { opacity: 1; }
                            50% { opacity: 0.5; }
                            100% { opacity: 1; }
                        }
                        
                        h2 {
                            color: #495057;
                            margin-bottom: 1rem;
                        }
                        
                        p {
                            color: #6c757d;
                            margin-bottom: 2rem;
                            font-size: 1.1rem;
                        }
                        
                        .error-actions {
                            margin-bottom: 2rem;
                        }
                        
                        .btn {
                            padding: 0.75rem 1.5rem;
                            border: none;
                            border-radius: 6px;
                            font-weight: 500;
                            text-decoration: none;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        }
                        
                        .btn-primary {
                            background-color: #007bff;
                            color: white;
                        }
                        
                        .btn-primary:hover {
                            background-color: #0056b3;
                            transform: translateY(-1px);
                        }
                        
                        .btn-secondary {
                            background-color: #6c757d;
                            color: white;
                        }
                        
                        .btn-secondary:hover {
                            background-color: #545b62;
                        }
                        
                        .error-details {
                            text-align: left;
                            background: #f8f9fa;
                            padding: 1rem;
                            border-radius: 6px;
                            font-size: 0.9rem;
                        }
                        
                        .error-stack {
                            font-family: 'Courier New', monospace;
                            color: #495057;
                            white-space: pre-wrap;
                            word-break: break-word;
                        }
                        
                        summary {
                            cursor: pointer;
                            font-weight: 500;
                            margin-bottom: 0.5rem;
                        }
                        
                        summary:hover {
                            color: #007bff;
                        }
                    `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;