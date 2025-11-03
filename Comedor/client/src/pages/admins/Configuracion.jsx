import { useState } from 'react';
import ListaTurnos from './ListaTurnos';
import ListaServicios from './ListaServicios';

const Configuracion = () => {
    const [activeTab, setActiveTab] = useState('turnos');

    const tabs = [
        {
            id: 'turnos',
            label: 'Turnos',
            icon: 'fas fa-clock',
            component: <ListaTurnos />
        },
        {
            id: 'servicios',
            label: 'Servicios',
            icon: 'fas fa-utensils',
            component: <ListaServicios />
        }
    ];

    return (
        <div className="configuracion-container">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">

                    <h2><i className="fas fa-cog"></i> Configuración del Sistema</h2>
                    <p>Administra la configuración básica del comedor</p>
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

export default Configuracion;