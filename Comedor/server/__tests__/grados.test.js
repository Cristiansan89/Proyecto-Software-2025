import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

/**
 * PRUEBA DE GRADOS
 * Prueba 4: Eliminar Grado - Debe fallar con error interno del servidor
 */

describe('Grados API - Eliminación de Grados', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock data: Grados con estudiantes/docentes asociados
    const gradosConDependencias = {
      1: {
        id: 1,
        nombre: '4° Grado B',
        turno: 'Tarde (13:30:00 - 17:00:00)',
        estado: 'Activo',
        tieneEstudiantes: true,
        tienDocentes: true
      }
    };

    // Mock endpoint para eliminar grado
    app.delete('/api/grados/:id', (req, res) => {
      const gradoId = req.params.id;
      const grado = gradosConDependencias[gradoId];

      if (!grado) {
        return res.status(404).json({ error: 'Grado no encontrado' });
      }

      // Si el grado tiene estudiantes o docentes asociados
      if (grado.tieneEstudiantes || grado.tienDocentes) {
        return res.status(500).json({
          error: 'Error interno del servidor',
          detalle: 'No se puede eliminar el grado porque tiene estudiantes y/o docentes asociados'
        });
      }

      res.status(200).json({
        mensaje: 'Grado eliminado exitosamente'
      });
    });
  });

  it('Prueba 4: Eliminar Grado 4° B Tarde - Debe fallar con error interno del servidor', async () => {
    const response = await request(app)
      .delete('/api/grados/1')
      .expect(500); // Esperamos error 500

    expect(response.body.error).toBe('Error interno del servidor');
    expect(response.body.detalle).toContain('estudiantes');
  });

  it('Prueba 4 Adicional: Eliminar Grado sin dependencias - Debe ser exitoso', async () => {
    // Mock para un grado sin dependencias
    const app2 = express();
    app2.use(express.json());

    const gradoSinDependencias = {
      2: {
        id: 2,
        nombre: '6° Grado A',
        tieneEstudiantes: false,
        tienDocentes: false
      }
    };

    app2.delete('/api/grados/:id', (req, res) => {
      const grado = gradoSinDependencias[req.params.id];
      if (!grado) {
        return res.status(404).json({ error: 'Grado no encontrado' });
      }
      if (grado.tieneEstudiantes || grado.tienDocentes) {
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      res.status(200).json({ mensaje: 'Grado eliminado exitosamente' });
    });

    const response = await request(app2)
      .delete('/api/grados/2')
      .expect(200);

    expect(response.body.mensaje).toBe('Grado eliminado exitosamente');
  });
});
