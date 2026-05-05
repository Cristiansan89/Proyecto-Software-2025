import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

/**
 * PRUEBAS DE PROVEEDORES
 * Prueba 5: Agregar Proveedor - Debe crear un nuevo proveedor exitosamente
 * Prueba 6: Asignar Insumo a Proveedor - Debe asignar 6 insumos
 * Prueba 7: Eliminar Proveedor - Debe fallar porque tiene insumos asignados
 */

describe('Proveedores API', () => {
  let app;
  let proveedoresData = {};
  let proveedoresInsumosData = {};
  let nextProveedorId = 1;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    proveedoresData = {};
    proveedoresInsumosData = {};
    nextProveedorId = 1;

    // Mock endpoint para crear proveedor
    app.post('/api/proveedores', (req, res) => {
      const { razonSocial, cuit, direccion, telefono, email, estado, nombreUsuario, contrasena, confirmarContrasena, estadoUsuario } = req.body;

      // Validación: CUIT debe ser único
      const cuitYaExiste = Object.values(proveedoresData).some(p => p.cuit === cuit);
      if (cuitYaExiste) {
        return res.status(400).json({
          error: 'El CUIT ya está registrado en el sistema'
        });
      }

      const id = nextProveedorId++;
      proveedoresData[id] = {
        id,
        razonSocial,
        cuit,
        direccion,
        telefono,
        email,
        estado,
        nombreUsuario,
        estadoUsuario
      };

      res.status(201).json({
        id,
        razonSocial,
        cuit,
        direccion,
        telefono,
        email,
        estado,
        mensaje: 'Proveedor creado exitosamente'
      });
    });

    // Mock endpoint para obtener proveedor
    app.get('/api/proveedores/:id', (req, res) => {
      const proveedor = proveedoresData[req.params.id];
      if (!proveedor) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }
      res.status(200).json(proveedor);
    });

    // Mock endpoint para asignar insumos
    app.post('/api/proveedores/:id/insumos', (req, res) => {
      const { insumos } = req.body;
      const proveedorId = req.params.id;

      if (!proveedoresData[proveedorId]) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      if (!Array.isArray(insumos) || insumos.length === 0) {
        return res.status(400).json({ error: 'Debe proporcionar insumos' });
      }

      proveedoresInsumosData[proveedorId] = insumos;

      res.status(201).json({
        mensaje: `${insumos.length} insumo(s) asignado(s) al proveedor exitosamente`,
        insumosAsignados: insumos.length,
        insumos: insumos
      });
    });

    // Mock endpoint para eliminar proveedor
    app.delete('/api/proveedores/:id', (req, res) => {
      const proveedorId = req.params.id;

      if (!proveedoresData[proveedorId]) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Si el proveedor tiene insumos asignados
      if (proveedoresInsumosData[proveedorId] && proveedoresInsumosData[proveedorId].length > 0) {
        return res.status(400).json({
          error: 'Error en la eliminación debido a que el proveedor tiene asignado insumos por ende no se puede eliminar'
        });
      }

      delete proveedoresData[proveedorId];
      res.status(200).json({
        mensaje: 'Proveedor eliminado exitosamente'
      });
    });
  });

  describe('Prueba 5: Crear Proveedor', () => {
    it('Prueba 5: Agregar Proveedor Verdulería San Miguel - Debe crear exitosamente', async () => {
      const response = await request(app)
        .post('/api/proveedores')
        .send({
          razonSocial: 'Verdulería San Miguel',
          cuit: '30-33445566-9',
          direccion: 'Avenida 131',
          telefono: '+543764223344',
          email: 'sanmiguel@mail.com',
          estado: 'Activo',
          nombreUsuario: 'sanmiguel',
          contrasena: 'miguel3040',
          confirmarContrasena: 'miguel3040',
          estadoUsuario: 'Activo'
        })
        .expect(201); // Esperamos éxito

      expect(response.body.mensaje).toBe('Proveedor creado exitosamente');
      expect(response.body.razonSocial).toBe('Verdulería San Miguel');
      expect(response.body.cuit).toBe('30-33445566-9');
      expect(response.body.id).toBeDefined();
    });

    it('Prueba 5 Adicional: Agregar Proveedor con CUIT duplicado - Debe fallar', async () => {
      // Primero agregamos un proveedor
      await request(app)
        .post('/api/proveedores')
        .send({
          razonSocial: 'Verdulería San Miguel',
          cuit: '30-33445566-9',
          direccion: 'Avenida 131',
          telefono: '+543764223344',
          email: 'sanmiguel@mail.com',
          estado: 'Activo',
          nombreUsuario: 'sanmiguel',
          contrasena: 'miguel3040',
          confirmarContrasena: 'miguel3040',
          estadoUsuario: 'Activo'
        });

      // Luego intentamos agregar otro con el mismo CUIT
      const response = await request(app)
        .post('/api/proveedores')
        .send({
          razonSocial: 'Otra Verdulería',
          cuit: '30-33445566-9', // CUIT duplicado
          direccion: 'Otra Avenida',
          telefono: '+543764223344',
          email: 'otra@mail.com',
          estado: 'Activo',
          nombreUsuario: 'otra',
          contrasena: 'pass123',
          confirmarContrasena: 'pass123',
          estadoUsuario: 'Activo'
        })
        .expect(400);

      expect(response.body.error).toBe('El CUIT ya está registrado en el sistema');
    });
  });

  describe('Prueba 6: Asignar Insumos', () => {
    it('Prueba 6: Asignar 6 insumos al Proveedor San Miguel - Debe asignar exitosamente', async () => {
      // Primero crear proveedor
      const provResponse = await request(app)
        .post('/api/proveedores')
        .send({
          razonSocial: 'Verdulería San Miguel',
          cuit: '30-33445566-9',
          direccion: 'Avenida 131',
          telefono: '+543764223344',
          email: 'sanmiguel@mail.com',
          estado: 'Activo',
          nombreUsuario: 'sanmiguel',
          contrasena: 'miguel3040',
          confirmarContrasena: 'miguel3040',
          estadoUsuario: 'Activo'
        });

      const proveedorId = provResponse.body.id;

      // Asignar 6 insumos
      const response = await request(app)
        .post(`/api/proveedores/${proveedorId}/insumos`)
        .send({
          insumos: [
            { nombre: 'Acelga', estado: 'Bueno' },
            { nombre: 'Berenjena', estado: 'Bueno' },
            { nombre: 'Brócoli', estado: 'Bueno' },
            { nombre: 'Calabacín', estado: 'Bueno' },
            { nombre: 'Coliflor', estado: 'Bueno' },
            { nombre: 'Lechuga criolla', estado: 'Bueno' }
          ]
        })
        .expect(201);

      expect(response.body.insumosAsignados).toBe(6);
      expect(response.body.mensaje).toContain('6 insumo(s) asignado(s)');
      expect(response.body.insumos).toHaveLength(6);
    });
  });

  describe('Prueba 7: Eliminar Proveedor', () => {
    it('Prueba 7: Eliminar Proveedor San Miguel - Debe fallar por tener insumos asignados', async () => {
      // Crear proveedor
      const provResponse = await request(app)
        .post('/api/proveedores')
        .send({
          razonSocial: 'Verdulería San Miguel',
          cuit: '30-33445566-9',
          direccion: 'Avenida 131',
          telefono: '+543764223344',
          email: 'sanmiguel@mail.com',
          estado: 'Activo',
          nombreUsuario: 'sanmiguel',
          contrasena: 'miguel3040',
          confirmarContrasena: 'miguel3040',
          estadoUsuario: 'Activo'
        });

      const proveedorId = provResponse.body.id;

      // Asignar insumos
      await request(app)
        .post(`/api/proveedores/${proveedorId}/insumos`)
        .send({
          insumos: [
            { nombre: 'Acelga', estado: 'Bueno' },
            { nombre: 'Berenjena', estado: 'Bueno' }
          ]
        });

      // Intentar eliminar
      const response = await request(app)
        .delete(`/api/proveedores/${proveedorId}`)
        .expect(400);

      expect(response.body.error).toBe('Error en la eliminación debido a que el proveedor tiene asignado insumos por ende no se puede eliminar');
    });

    it('Prueba 7 Adicional: Eliminar Proveedor sin insumos - Debe ser exitoso', async () => {
      // Crear proveedor
      const provResponse = await request(app)
        .post('/api/proveedores')
        .send({
          razonSocial: 'Verdulería Nueva',
          cuit: '30-99887766-5',
          direccion: 'Calle Nueva',
          telefono: '+543764223344',
          email: 'nueva@mail.com',
          estado: 'Activo',
          nombreUsuario: 'nueva',
          contrasena: 'pass123',
          confirmarContrasena: 'pass123',
          estadoUsuario: 'Activo'
        });

      const proveedorId = provResponse.body.id;

      // Eliminar sin insumos
      const response = await request(app)
        .delete(`/api/proveedores/${proveedorId}`)
        .expect(200);

      expect(response.body.mensaje).toBe('Proveedor eliminado exitosamente');
    });
  });
});
