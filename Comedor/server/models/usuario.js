import { connection } from "./db.js";
import bcrypt from "bcrypt";
import { SoftDeleteService } from "./softDeleteService.js";

export class UsuarioModel {
  static async getAll() {
    const [usuarios] = await connection.query(
      `SELECT 
                BIN_TO_UUID(u.id_usuario) as idUsuario,
                u.id_persona as idPersona,
                BIN_TO_UUID(u.id_proveedor) as idProveedor,
                COALESCE(p.nombre, 'Proveedor') as nombre,
                COALESCE(p.apellido, '') as apellido,
                COALESCE(r.nombreRol, 'Sin Rol') as nombreRol,
                u.nombreUsuario,
                u.mail,
                u.telefono,
                u.fechaAlta,
                u.fechaUltimaActividad,
                u.estado
             FROM Usuarios u
             LEFT JOIN Personas p ON u.id_persona = p.id_persona
             LEFT JOIN UsuariosRoles ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
             LEFT JOIN Roles r ON ur.id_rol = r.id_rol
             ORDER BY u.nombreUsuario;`,
    );
    return usuarios;
  }

  static async getById({ id }) {
    const [usuarios] = await connection.query(
      `SELECT 
                BIN_TO_UUID(u.id_usuario) as idUsuario,
                u.id_persona as idPersona,
                BIN_TO_UUID(u.id_proveedor) as idProveedor,
                COALESCE(p.nombre, 'Proveedor') as nombre,
                COALESCE(p.apellido, '') as apellido,
                COALESCE(r.nombreRol, 'Sin Rol') as nombreRol,
                u.nombreUsuario,
                u.mail,
                u.telefono,
                u.fechaAlta,
                u.fechaUltimaActividad,
                u.estado
             FROM Usuarios u
             LEFT JOIN Personas p ON u.id_persona = p.id_persona
             LEFT JOIN UsuariosRoles ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
             LEFT JOIN Roles r ON ur.id_rol = r.id_rol
             WHERE u.id_usuario = UUID_TO_BIN(?);`,
      [id],
    );
    if (usuarios.length === 0) return null;
    return usuarios[0];
  }

  static async getByUsername(nombreUsuario) {
    const [usuarios] = await connection.query(
      `SELECT 
                BIN_TO_UUID(u.id_usuario) as idUsuario,
                u.id_persona as idPersona,
                BIN_TO_UUID(u.id_proveedor) as idProveedor,
                p.nombre,
                p.apellido,
                CONCAT(COALESCE(p.nombre, ''), ' ', COALESCE(p.apellido, '')) as nombres,
                COALESCE(r.nombreRol, 'Sin Rol') as nombreRol,
                u.nombreUsuario,
                u.contrasenia as contrasena,
                u.mail,
                u.telefono,
                u.fechaAlta,
                u.fechaUltimaActividad,
                u.estado
             FROM Usuarios u
             LEFT JOIN Personas p ON u.id_persona = p.id_persona
             LEFT JOIN UsuariosRoles ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
             LEFT JOIN Roles r ON ur.id_rol = r.id_rol
             WHERE u.nombreUsuario = ? AND u.estado = 'Activo';`,
      [nombreUsuario],
    );
    if (usuarios.length === 0) return null;

    const usuario = usuarios[0];

    // Log para diagnóstico
    console.log("🔍 Usuario encontrado en getByUsername:", {
      nombreUsuario,
      idUsuario: usuario.idUsuario,
      nombreRol: usuario.nombreRol,
      idProveedor: usuario.idProveedor,
      idPersona: usuario.idPersona,
    });

    return usuario;
  }

  static async create({ input }) {
    const {
      idPersona,
      idProveedor,
      nombreUsuario,
      contrasena,
      mail,
      telefono,
      estado = "Activo",
    } = input;

    // VALIDACIÓN CRÍTICA: Asegurar que contrasena existe y es válida
    if (
      !contrasena ||
      typeof contrasena !== "string" ||
      contrasena.trim() === ""
    ) {
      console.error(
        "❌ ERROR CRÍTICO: Contraseña vacía o inválida en create()",
        {
          nombreUsuario,
          tipoContrasena: typeof contrasena,
          contrasenaVacia: !contrasena,
          idPersona,
          idProveedor,
        },
      );
      throw new Error("La contraseña no puede estar vacía");
    }

    try {
      const hashedPassword = await bcrypt.hash(contrasena, 10);

      console.log("🔐 Usuario creado con encriptación:", {
        nombreUsuario,
        passwordOriginal: "***",
        passwordHashLength: hashedPassword ? hashedPassword.length : 0,
        passwordHashPrefix: hashedPassword
          ? hashedPassword.substring(0, 10)
          : "NINGUNO",
        idPersona,
        idProveedor,
      });

      // Validar que el hash sea válido (debe ser un bcrypt hash válido)
      if (!hashedPassword || !hashedPassword.startsWith("$2")) {
        console.error("❌ ERROR: Hash inválido o no es bcrypt:", {
          hash: hashedPassword ? hashedPassword.substring(0, 20) : "NULL",
          esValido: hashedPassword && hashedPassword.startsWith("$2"),
        });
        throw new Error("Error al encriptar la contraseña");
      }

      // Si se proporciona idProveedor, insertar con id_proveedor
      // Si se proporciona idPersona, insertar con id_persona
      if (idProveedor) {
        await connection.query(
          `INSERT INTO Usuarios (
                      id_persona,
                      id_proveedor,
                      nombreUsuario, 
                      contrasenia, 
                      mail, 
                      telefono, 
                      estado
                  ) VALUES (NULL, UUID_TO_BIN(?), ?, ?, ?, ?, ?);`,
          [idProveedor, nombreUsuario, hashedPassword, mail, telefono, estado],
        );

        // Asignar rol "Proveedor" automáticamente
        try {
          const [newUser] = await connection.query(
            `SELECT BIN_TO_UUID(id_usuario) as idUsuario 
                     FROM Usuarios 
                     WHERE nombreUsuario = ?;`,
            [nombreUsuario],
          );

          const usuarioCreado = newUser[0];

          const [roles] = await connection.query(
            `SELECT id_rol FROM Roles WHERE nombreRol = 'Proveedor' LIMIT 1;`,
          );

          if (roles.length > 0) {
            const idRolProveedor = roles[0].id_rol;
            await connection.query(
              `INSERT INTO UsuariosRoles (id_usuario, id_rol, estado) 
               VALUES (UUID_TO_BIN(?), ?, 'Activo')
               ON DUPLICATE KEY UPDATE estado = 'Activo';`,
              [usuarioCreado.idUsuario, idRolProveedor],
            );
            console.log("✅ Rol Proveedor asignado al usuario:", {
              nombreUsuario,
              idRolProveedor,
            });
          }
        } catch (roleError) {
          console.warn(
            "Advertencia: No se pudo asignar rol al usuario proveedor:",
            roleError.message,
          );
        }
      } else {
        await connection.query(
          `INSERT INTO Usuarios (
                      id_persona, 
                      nombreUsuario, 
                      contrasenia, 
                      mail, 
                      telefono, 
                      estado
                  ) VALUES (?, ?, ?, ?, ?, ?);`,
          [idPersona, nombreUsuario, hashedPassword, mail, telefono, estado],
        );
      }

      const [newUser] = await connection.query(
        `SELECT BIN_TO_UUID(id_usuario) as idUsuario 
                 FROM Usuarios 
                 WHERE nombreUsuario = ?;`,
        [nombreUsuario],
      );

      const usuarioCreado = await this.getById({ id: newUser[0].idUsuario });

      console.log("✅ Usuario guardado exitosamente en BD:", {
        nombreUsuario,
        idPersona,
        idProveedor,
        idUsuario: usuarioCreado.idUsuario,
      });

      return usuarioCreado;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("El nombre de usuario ya existe");
      }
      console.error("❌ Error al crear usuario:", error.message);
      throw error;
    }
  }

  // Crear usuario asociado a un proveedor
  static async createForProveedor({ input }) {
    const {
      idProveedor,
      nombreUsuario,
      contrasena,
      mail,
      telefono,
      estado = "Activo",
    } = input;

    // VALIDACIÓN CRÍTICA: Asegurar que contrasena existe y es válida
    if (
      !contrasena ||
      typeof contrasena !== "string" ||
      contrasena.trim() === ""
    ) {
      console.error(
        "❌ ERROR CRÍTICO: Contraseña vacía o inválida en createForProveedor()",
        {
          nombreUsuario,
          tipoContrasena: typeof contrasena,
          idProveedor,
        },
      );
      throw new Error("La contraseña no puede estar vacía");
    }

    try {
      const hashedPassword = await bcrypt.hash(contrasena, 10);

      console.log("🔐 Usuario proveedor creado con encriptación:", {
        nombreUsuario,
        passwordOriginal: "***",
        passwordHashLength: hashedPassword ? hashedPassword.length : 0,
        idProveedor,
      });

      // Validar que el hash sea válido
      if (!hashedPassword || !hashedPassword.startsWith("$2")) {
        console.error("❌ ERROR: Hash inválido o no es bcrypt");
        throw new Error("Error al encriptar la contraseña");
      }

      // Crear usuario vinculado al Proveedor (sin Persona asociada)
      // id_persona será NULL porque los proveedores son entidades independientes
      await connection.query(
        `INSERT INTO Usuarios (
                    id_persona,
                    id_proveedor, 
                    nombreUsuario, 
                    contrasenia, 
                    mail, 
                    telefono, 
                    estado
                ) VALUES (NULL, UUID_TO_BIN(?), ?, ?, ?, ?, ?);`,
        [idProveedor, nombreUsuario, hashedPassword, mail, telefono, estado],
      );

      const [newUser] = await connection.query(
        `SELECT BIN_TO_UUID(id_usuario) as idUsuario 
                 FROM Usuarios 
                 WHERE nombreUsuario = ?;`,
        [nombreUsuario],
      );

      const usuarioCreado = newUser[0];

      // Asignar rol "Proveedor" automáticamente
      try {
        const [roles] = await connection.query(
          `SELECT id_rol FROM Roles WHERE nombreRol = 'Proveedor' LIMIT 1;`,
        );

        if (roles.length > 0) {
          const idRolProveedor = roles[0].id_rol;
          await connection.query(
            `INSERT INTO UsuariosRoles (id_usuario, id_rol, estado) 
             VALUES (UUID_TO_BIN(?), ?, 'Activo')
             ON DUPLICATE KEY UPDATE estado = 'Activo';`,
            [usuarioCreado.idUsuario, idRolProveedor],
          );
          console.log("✅ Rol Proveedor asignado al usuario:", {
            nombreUsuario,
            idRolProveedor,
          });
        } else {
          console.warn("Advertencia: Rol 'Proveedor' no encontrado en la BD");
        }
      } catch (roleError) {
        console.warn(
          "Advertencia: No se pudo asignar rol al usuario proveedor:",
          roleError.message,
        );
      }

      console.log("✅ Usuario proveedor guardado exitosamente:", {
        nombreUsuario,
        idProveedor,
        idUsuario: usuarioCreado.idUsuario,
      });

      return usuarioCreado;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("El nombre de usuario ya existe");
      }
      console.error("❌ Error al crear usuario proveedor:", error.message);
      throw error;
    }
  }

  static async delete({ id }) {
    try {
      // Usar soft delete en lugar de DELETE físico
      return await SoftDeleteService.softDelete("Usuarios", "id_usuario", id, {
        useInactivo: true,
        addDeletedAt: true,
      });
    } catch (error) {
      console.error("Error en softDelete:", error);
      return false;
    }
  }

  // Nuevo método: Restaurar usuario eliminado
  static async undelete({ id }) {
    try {
      return await SoftDeleteService.undelete("Usuarios", "id_usuario", id);
    } catch (error) {
      console.error("Error en undelete:", error);
      return false;
    }
  }

  // Nuevo método: Obtener usuarios eliminados
  static async getDeleted() {
    try {
      const [usuarios] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(u.id_usuario) as idUsuario,
                    u.id_persona as idPersona,
                    p.nombre,
                    p.apellido,
                    u.nombreUsuario,
                    u.estado,
                    u.fechaEliminacion
                 FROM Usuarios u
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE u.estado = 'Inactivo'
                 ORDER BY u.fechaEliminacion DESC;`,
      );
      return usuarios;
    } catch (error) {
      console.error("Error en getDeleted:", error);
      return [];
    }
  }

  // Nuevo método: Estadísticas de usuarios
  static async getStats() {
    try {
      return await SoftDeleteService.getStats("Usuarios");
    } catch (error) {
      console.error("Error en getStats:", error);
      return { activos: 0, inactivos: 0, total: 0, porcentajeInactivos: 0 };
    }
  }

  static async update({ id, input }) {
    const { idPersona, nombreUsuario, contrasena, mail, telefono, estado } =
      input;

    try {
      const updates = [];
      const values = [];

      if (idPersona) {
        updates.push("id_persona = ?");
        values.push(idPersona);
      }
      if (nombreUsuario) {
        updates.push("nombreUsuario = ?");
        values.push(nombreUsuario);
      }
      if (contrasena) {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        updates.push("contrasenia = ?");
        values.push(hashedPassword);
      }
      if (mail !== undefined) {
        updates.push("mail = ?");
        values.push(mail);
      }
      if (telefono !== undefined) {
        updates.push("telefono = ?");
        values.push(telefono);
      }
      if (estado) {
        updates.push("estado = ?");
        values.push(estado);
      }

      if (updates.length === 0) return this.getById({ id });

      values.push(id);
      await connection.query(
        `UPDATE Usuarios
                 SET ${updates.join(", ")}
                 WHERE id_usuario = UUID_TO_BIN(?);`,
        values,
      );

      return this.getById({ id });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("El nombre de usuario ya existe");
      }
      throw new Error("Error al actualizar el usuario");
    }
  }

  static async updateLastActivity({ id }) {
    try {
      await connection.query(
        `UPDATE Usuarios
                 SET fechaUltimaActividad = NOW()
                 WHERE id_usuario = UUID_TO_BIN(?);`,
        [id],
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
