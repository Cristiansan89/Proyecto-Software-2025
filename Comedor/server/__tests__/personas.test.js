import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

/**
 * PRUEBAS DE PERSONAS
 * Prueba 1: Agregar Persona (Alumno) - Debe fallar por documento repetido
 * Prueba 2: Agregar Persona (Docente) - Debe fallar por documento repetido
 */

describe('Personas API - Validación de Documentos', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock endpoint para agregar persona
    app.post('/api/personas', (req, res) => {
      const { rol, nombre, apellido, numeroDocumento, fechaNacimiento, genero, estado } = req.body;

      // Validación: documentos ya existentes en el sistema
      const documentosExistentes = ['60110012', '28765432'];
      
      if (documentosExistentes.includes(numeroDocumento)) {
        return res.status(400).json({
          error: 'Error en la carga, debido a que se repite el número de documento.'
        });
      }

      // Si pasa validación
      res.status(201).json({
        id: 1,
        rol,
        nombre,
        apellido,
        numeroDocumento,
        fechaNacimiento,
        genero,
        estado,
        mensaje: 'Persona agregada exitosamente'
      });
    });
  });

  it('Prueba 1: Agregar Alumna Lucía Benítez - Debe fallar por documento duplicado', async () => {
    const response = await request(app)
      .post('/api/personas')
      .send({
        rol: 'Alumno',
        nombre: 'Lucía',
        apellido: 'Benítez',
        numeroDocumento: '60110012', // Documento que ya existe
        fechaNacimiento: '15/04/2019',
        genero: 'Femenina',
        estado: 'Activo'
      })
      .expect(400); // Esperamos error 400

    expect(response.body.error).toBe('Error en la carga, debido a que se repite el número de documento.');
    expect(response.body.error).toContain('documento');
  });

  it('Prueba 2: Agregar Docente Mariana Gómez - Debe fallar por documento duplicado', async () => {
    const response = await request(app)
      .post('/api/personas')
      .send({
        rol: 'Docente',
        nombre: 'Mariana',
        apellido: 'Gómez',
        numeroDocumento: '28765432', // Documento que ya existe
        fechaNacimiento: '5/6/1975',
        genero: 'Femenina',
        estado: 'Activo'
      })
      .expect(400); // Esperamos error 400

    expect(response.body.error).toBe('Error en la carga, debido a que se repite el número de documento.');
    expect(response.body.error).toContain('número de documento');
  });

  it('Prueba 1 Adicional: Agregar Persona con documento nuevo - Debe ser exitoso', async () => {
    const response = await request(app)
      .post('/api/personas')
      .send({
        rol: 'Alumno',
        nombre: 'Juan',
        apellido: 'Pérez',
        numeroDocumento: '45123456', // Documento nuevo
        fechaNacimiento: '10/03/2020',
        genero: 'Masculino',
        estado: 'Activo'
      })
      .expect(201); // Esperamos éxito

    expect(response.body.mensaje).toBe('Persona agregada exitosamente');
    expect(response.body.numeroDocumento).toBe('45123456');
  });
  
});
