import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

/**
 * PRUEBA DE USUARIOS
 * Prueba 3: Editar Usuario - Debe fallar porque las contraseñas no coinciden
 */

describe('Usuarios API - Validación de Contraseñas', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock endpoint para actualizar usuario
    app.patch('/api/usuarios/:id', (req, res) => {
      const { nombreUsuario, email, telefono, contrasena, confirmarContrasena, estado } = req.body;

      // Validación: las contraseñas deben coincidir
      if (contrasena && confirmarContrasena && contrasena !== confirmarContrasena) {
        return res.status(400).json({
          error: 'Error en la carga, debido a que no se coinciden la confirmación de contraseña.'
        });
      }

      // Si pasa validación
      res.status(200).json({
        id: 1,
        nombreUsuario,
        email,
        telefono,
        estado,
        mensaje: 'Usuario actualizado exitosamente'
      });
    });
  });

  it('Prueba 3: Editar Usuario Mariana Gómez - Debe fallar por contraseña no coincidente', async () => {
    const response = await request(app)
      .patch('/api/usuarios/1')
      .send({
        nombreUsuario: 'mariana.gomez',
        email: 'marianagomez@mail.com',
        telefono: '3764239137',
        contrasena: 'gomez444',
        confirmarContrasena: 'gomez441', // No coincide con la contraseña
        estado: 'Activo'
      })
      .expect(400); // Esperamos error 400

    expect(response.body.error).toBe('Error en la carga, debido a que no se coinciden la confirmación de contraseña.');
    expect(response.body.error).toContain('contraseña');
  });

  it('Prueba 3 Adicional: Editar Usuario con contraseñas coincidentes - Debe ser exitoso', async () => {
    const response = await request(app)
      .patch('/api/usuarios/1')
      .send({
        nombreUsuario: 'mariana.gomez',
        email: 'marianagomez@mail.com',
        telefono: '3764239137',
        contrasena: 'gomez444',
        confirmarContrasena: 'gomez444', // Coincide
        estado: 'Activo'
      })
      .expect(200); // Esperamos éxito

    expect(response.body.mensaje).toBe('Usuario actualizado exitosamente');
    expect(response.body.nombreUsuario).toBe('mariana.gomez');
  });

  it('Prueba 3 Adicional: Editar Usuario sin cambiar contraseña - Debe ser exitoso', async () => {
    const response = await request(app)
      .patch('/api/usuarios/1')
      .send({
        nombreUsuario: 'mariana.gomez',
        email: 'marianagomez@mail.com',
        telefono: '3764239137',
        estado: 'Activo'
        // No se envía contraseña
      })
      .expect(200); // Esperamos éxito

    expect(response.body.mensaje).toBe('Usuario actualizado exitosamente');
  });
});
