-- Tabla para configurar servicios que se procesan automáticamente
CREATE TABLE IF NOT EXISTS ConfiguracionServiciosAutomaticos (
    id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
    id_servicio INT NOT NULL,
    horaInicio TIME NOT NULL,
    horaFin TIME NOT NULL,
    procesarAutomaticamente BOOLEAN DEFAULT TRUE,
    descripcion VARCHAR(255),
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_servicio) REFERENCES Servicios(id_servicio) ON DELETE CASCADE,
    UNIQUE KEY unique_servicio (id_servicio)
);

-- Insertar configuraciones por defecto (Desayuno, Almuerzo, Merienda)
INSERT INTO ConfiguracionServiciosAutomaticos (id_servicio, horaInicio, horaFin, procesarAutomaticamente, descripcion)
SELECT s.id_servicio, 
    CASE 
        WHEN s.nombre = 'Desayuno' THEN '08:00:00'
        WHEN s.nombre = 'Almuerzo' THEN '10:00:00'
        WHEN s.nombre = 'Merienda' THEN '16:00:00'
        ELSE '08:00:00'
    END as horaInicio,
    CASE 
        WHEN s.nombre = 'Desayuno' THEN '08:30:00'
        WHEN s.nombre = 'Almuerzo' THEN '10:30:00'
        WHEN s.nombre = 'Merienda' THEN '16:30:00'
        ELSE '09:00:00'
    END as horaFin,
    TRUE,
    CONCAT(s.nombre, ' - Procesamiento automático')
FROM Servicios s
WHERE s.nombre IN ('Desayuno', 'Almuerzo', 'Merienda')
    AND NOT EXISTS (
        SELECT 1 FROM ConfiguracionServiciosAutomaticos WHERE id_servicio = s.id_servicio
    );
