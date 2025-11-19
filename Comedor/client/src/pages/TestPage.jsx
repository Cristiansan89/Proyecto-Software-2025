const TestPage = () => {
    return (
        <div style={{
            padding: '50px',
            textAlign: 'center',
            backgroundColor: '#f0f8ff',
            minHeight: '100vh'
        }}>
            <h1 style={{ color: '#007bff' }}>✅ React Funciona Correctamente</h1>
            <p>Si ves este mensaje, React está renderizando correctamente.</p>
            <div style={{
                margin: '20px 0',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h3>Estado del Sistema:</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li>✅ React: Funcionando</li>
                    <li>✅ Componentes: Renderizando</li>
                    <li>✅ CSS: Aplicándose</li>
                </ul>
            </div>
            <button 
                onClick={() => alert('¡JavaScript funciona!')}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Probar JavaScript
            </button>
        </div>
    );
};

export default TestPage;