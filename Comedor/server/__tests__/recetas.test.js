import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

/**
 * PRUEBA DE RECETAS
 * Prueba 8: Registrar Receta - Debe fallar porque contiene caracteres especiales en el nombre
 */

describe('Recetas API - Validación de Caracteres', () => {
  let app;
  let recetasData = {};
  let nextRecetaId = 1;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    recetasData = {};
    nextRecetaId = 1;

    // Función para validar caracteres especiales en nombre
    const tieneeCaracteresEspeciales = (texto) => {
      const caracteresEspeciales = /[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]/g;
      return caracteresEspeciales.test(texto);
    };

    // Mock endpoint para crear receta
    app.post('/api/recetas', (req, res) => {
      const { 
        nombre, 
        unidadSalida, 
        estado, 
        servicios, 
        instrucciones, 
        ingredientes 
      } = req.body;

      // Validación: el nombre no puede contener caracteres especiales
      if (tieneeCaracteresEspeciales(nombre)) {
        return res.status(400).json({
          error: 'Error en la carga, debido a que no puede ingresar caracteres especiales como: ! @ # $ % ^ & * ( ) - + = [ ] { } ; \' : " | , . < > / ?'
        });
      }

      // Validación: nombre no puede estar vacío
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          error: 'El nombre de la receta es requerido'
        });
      }

      // Validación: debe tener al menos un ingrediente
      if (!ingredientes || ingredientes.length === 0) {
        return res.status(400).json({
          error: 'La receta debe tener al menos un ingrediente'
        });
      }

      const id = nextRecetaId++;
      recetasData[id] = {
        id,
        nombre,
        unidadSalida,
        estado,
        servicios,
        instrucciones,
        ingredientes
      };

      res.status(201).json({
        id,
        nombre,
        unidadSalida,
        estado,
        servicios,
        instrucciones,
        ingredientes,
        mensaje: 'Receta registrada exitosamente'
      });
    });

    // Mock endpoint para obtener receta
    app.get('/api/recetas/:id', (req, res) => {
      const receta = recetasData[req.params.id];
      if (!receta) {
        return res.status(404).json({ error: 'Receta no encontrada' });
      }
      res.status(200).json(receta);
    });
  });

  it('Prueba 8: Registrar Receta con caracteres especiales - Debe fallar', async () => {
    const response = await request(app)
      .post('/api/recetas')
      .send({
        nombre: '$#1234Gd', // Contiene caracteres especiales
        unidadSalida: 'Unidad',
        estado: 'Activo',
        servicios: ['Desayuno'],
        instrucciones: '1. Este es un test de prueba 10.',
        ingredientes: [
          {
            insumo: 'Zapallo anco',
            cantidad: 1,
            unidad: 'Unidades'
          }
        ]
      })
      .expect(400); // Esperamos error 400

    expect(response.body.error).toContain('caracteres especiales');
    expect(response.body.error).toContain('$');
  });

  it('Prueba 8 Adicional: Registrar Receta con nombre válido - Debe ser exitoso', async () => {
    const response = await request(app)
      .post('/api/recetas')
      .send({
        nombre: 'Ensalada de Zapallo', // Nombre válido sin caracteres especiales
        unidadSalida: 'Unidad',
        estado: 'Activo',
        servicios: ['Desayuno'],
        instrucciones: '1. Cortar el zapallo en cubos.',
        ingredientes: [
          {
            insumo: 'Zapallo anco',
            cantidad: 1,
            unidad: 'Unidades'
          }
        ]
      })
      .expect(201); // Esperamos éxito

    expect(response.body.mensaje).toBe('Receta registrada exitosamente');
    expect(response.body.nombre).toBe('Ensalada de Zapallo');
    expect(response.body.ingredientes).toHaveLength(1);
  });

  it('Prueba 8 Adicional: Registrar Receta con varios caracteres especiales - Debe fallar', async () => {
    const testCases = [
      { nombre: 'Ensalada@2024', caracteres: '@' },
      { nombre: 'Receta#1', caracteres: '#' },
      { nombre: 'Receta$Premium', caracteres: '$' },
      { nombre: 'Receta%Top', caracteres: '%' },
      { nombre: 'Receta(Mix)', caracteres: '(' },
      { nombre: 'Receta[Especial]', caracteres: '[' }
    ];

    for (const testCase of testCases) {
      const response = await request(app)
        .post('/api/recetas')
        .send({
          nombre: testCase.nombre,
          unidadSalida: 'Unidad',
          estado: 'Activo',
          servicios: ['Desayuno'],
          instrucciones: 'Instrucciones',
          ingredientes: [
            {
              insumo: 'Ingrediente',
              cantidad: 1,
              unidad: 'Unidades'
            }
          ]
        })
        .expect(400);

      expect(response.body.error).toContain('caracteres especiales');
    }
  });

  it('Prueba 8 Adicional: Registrar Receta sin ingredientes - Debe fallar', async () => {
    const response = await request(app)
      .post('/api/recetas')
      .send({
        nombre: 'Ensalada Válida',
        unidadSalida: 'Unidad',
        estado: 'Activo',
        servicios: ['Desayuno'],
        instrucciones: 'Instrucciones',
        ingredientes: [] // Sin ingredientes
      })
      .expect(400);

    expect(response.body.error).toContain('al menos un ingrediente');
  });
});
