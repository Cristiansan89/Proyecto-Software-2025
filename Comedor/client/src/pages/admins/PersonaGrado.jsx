import { useState } from 'react';
import ListaAlumnosGrados from './ListaAlumnoGrado';
import ListaDocentesGrados from './ListaDocenteGrado';
import ListaReemplazosGrados from './ListaReemplazoDocente';

const PersonaGrado = () => {
    // Estado para la pestaña activa
    const [activeTab, setActiveTab] = useState('alumnos');

    const tabs = [
        {
            id: 'alumnos',
            label: 'Alumnos',
            icon: 'fas fa-user-graduate',
            component: <ListaAlumnosGrados />
        },
        {
            id: 'docentes',
            label: 'Docentes',
            icon: 'fas fa-chalkboard-teacher',
            component: <ListaDocentesGrados />
        },
        {
            id: 'reemplazos',
            label: 'Reemplazos',
            icon: 'fas fa-user-clock',
            component: <ListaReemplazosGrados />
        }
    ];

    return (
        <div className="page-content">
            {/* Header */}
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <i className="fas fa-user-clock me-2"> </i>
                        Asignación de Personas a Grados
                    </h1>
                    <p>Administra la asignación de personas a grados</p>
                </div>
            </div>

            {/* Navegación por pestañas */}
            <div className="navigation-tabs">
                <div className="tabs-header">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <i className={tab.icon}></i>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido de la pestaña activa */}
            <div className="tab-content">
                {tabs.find(tab => tab.id === activeTab)?.component}
            </div>
        </div>
    );
};

export default PersonaGrado;