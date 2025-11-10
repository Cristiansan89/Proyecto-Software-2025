/**
 * Utilidades para opciones de filtros dinámicos
 */
import { useState, useEffect } from 'react';
import { rolService } from '../services/rolService.js';
import { gradoService } from '../services/gradoService.js';

/**
 * Estados comunes del sistema
 */
export const ESTADOS_SISTEMA = [
    { value: 'Activo', label: 'Activo' },
    { value: 'Inactivo', label: 'Inactivo' }
];

/**
 * Hook personalizado para cargar roles activos
 */
export const useRolesFilter = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadRoles = async () => {
        try {
            setLoading(true);
            console.log('useRolesFilter: Cargando roles...');
            const rolesData = await rolService.getActivos();
            console.log('useRolesFilter: Roles cargados:', rolesData);
            setRoles(Array.isArray(rolesData) ? rolesData : []);
        } catch (error) {
            console.error('Error al cargar roles:', error);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    return { roles, loading, loadRoles };
};

/**
 * Hook personalizado para cargar grados activos
 */
export const useGradosFilter = () => {
    const [grados, setGrados] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadGrados = async () => {
        try {
            setLoading(true);
            console.log('useGradosFilter: Cargando grados...');
            const gradosData = await gradoService.getActivos();
            console.log('useGradosFilter: Grados cargados:', gradosData);
            setGrados(Array.isArray(gradosData) ? gradosData : []);
        } catch (error) {
            console.error('Error al cargar grados:', error);
            setGrados([]);
        } finally {
            setLoading(false);
        }
    };

    return { grados, loading, loadGrados };
};

/**
 * Función utilitaria para cargar roles
 */
export const loadRolesOptions = async () => {
    try {
        console.log('loadRolesOptions: Cargando roles...');
        const rolesData = await rolService.getActivos();
        console.log('loadRolesOptions: Roles cargados:', rolesData);
        return Array.isArray(rolesData) ? rolesData : [];
    } catch (error) {
        console.error('Error al cargar roles:', error);
        return [];
    }
};

/**
 * Función utilitaria para cargar grados
 */
export const loadGradosOptions = async () => {
    try {
        console.log('loadGradosOptions: Cargando grados...');
        const gradosData = await gradoService.getActivos();
        console.log('loadGradosOptions: Grados cargados:', gradosData);
        return Array.isArray(gradosData) ? gradosData : [];
    } catch (error) {
        console.error('Error al cargar grados:', error);
        return [];
    }
};

/**
 * Función utilitaria para obtener años de ciclos lectivos
 */
export const getCiclosLectivos = () => {
    const currentYear = new Date().getFullYear();
    const years = [];

    // Generar años desde 2020 hasta el año actual + 2
    for (let year = 2020; year <= currentYear + 2; year++) {
        years.push({ value: year.toString(), label: year.toString() });
    }

    return years;
};

/**
 * Componente de Select dinámico para roles
 */
export const RolesSelect = ({ value, onChange, disabled = false, className = "filter-select" }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadRoles = async () => {
            try {
                setLoading(true);
                const rolesData = await loadRolesOptions();
                setRoles(rolesData);
            } finally {
                setLoading(false);
            }
        };
        loadRoles();
    }, []);

    return (
        <select
            className={className}
            value={value}
            onChange={onChange}
            disabled={disabled || loading}
        >
            <option value="">Todos los roles</option>
            {loading ? (
                <option disabled>Cargando roles...</option>
            ) : (
                roles.map(rol => (
                    <option key={rol.idRol || rol.id} value={rol.nombre}>
                        {rol.nombre}
                    </option>
                ))
            )}
        </select>
    );
};

/**
 * Componente de Select dinámico para grados
 */
export const GradosSelect = ({ value, onChange, disabled = false, className = "filter-select" }) => {
    const [grados, setGrados] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadGrados = async () => {
            try {
                setLoading(true);
                const gradosData = await loadGradosOptions();
                setGrados(gradosData);
            } finally {
                setLoading(false);
            }
        };
        loadGrados();
    }, []);

    return (
        <select
            className={className}
            value={value}
            onChange={onChange}
            disabled={disabled || loading}
        >
            <option value="">Todos los grados</option>
            {loading ? (
                <option disabled>Cargando grados...</option>
            ) : (
                grados.map(grado => (
                    <option key={grado.idGrado || grado.id} value={grado.nombre}>
                        {grado.nombre}
                    </option>
                ))
            )}
        </select>
    );
};

/**
 * Componente de Select para estados estándar
 */
export const EstadosSelect = ({ value, onChange, disabled = false, className = "filter-select" }) => {
    return (
        <select
            className={className}
            value={value}
            onChange={onChange}
            disabled={disabled}
        >
            <option value="">Todos los estados</option>
            {ESTADOS_SISTEMA.map(estado => (
                <option key={estado.value} value={estado.value}>
                    {estado.label}
                </option>
            ))}
        </select>
    );
};

/**
 * Componente de Select para ciclos lectivos
 */
export const CiclosSelect = ({ value, onChange, disabled = false, className = "filter-select" }) => {
    const ciclos = getCiclosLectivos();

    return (
        <select
            className={className}
            value={value}
            onChange={onChange}
            disabled={disabled}
        >
            <option value="">Todos los ciclos</option>
            {ciclos.map(ciclo => (
                <option key={ciclo.value} value={ciclo.value}>
                    {ciclo.label}
                </option>
            ))}
        </select>
    );
};