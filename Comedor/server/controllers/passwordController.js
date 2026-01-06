import {
  generateTemporalPassword,
  sendPasswordResetEmail,
} from "../services/emailService.js";
import bcrypt from "bcrypt";
import { connection } from "../models/db.js";

// Recuperar contraseña
export const forgotPassword = async (req, res, usuarioModel) => {
  try {
    const { nombreUsuario } = req.body;

    if (!nombreUsuario) {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario es requerido",
      });
    }

    // Buscar usuario con sus datos de persona
    const [users] = await connection.execute(
      `
            SELECT 
                BIN_TO_UUID(u.id_usuario) as idUsuario,
                u.nombreUsuario,
                u.mail,
                p.nombre,
                p.apellido
            FROM Usuarios u
            JOIN Personas p ON u.id_persona = p.id_persona
            WHERE u.nombreUsuario = ?
        `,
      [nombreUsuario]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const user = users[0];

    if (!user.mail) {
      return res.status(400).json({
        success: false,
        message:
          "El usuario no tiene un email asociado. Contacte al administrador.",
      });
    }

    // Generar contraseña temporal
    const temporalPassword = generateTemporalPassword();
    const hashedPassword = await bcrypt.hash(temporalPassword, 10);

    // Actualizar contraseña en base de datos
    await connection.execute(
      "UPDATE Usuarios SET contrasenia = ? WHERE BIN_TO_UUID(id_usuario) = ?",
      [hashedPassword, user.idUsuario]
    );

    // Enviar email con nueva contraseña
    const emailResult = await sendPasswordResetEmail(user, temporalPassword);

    if (emailResult.success) {
      res.json({
        success: true,
        message: "Se ha enviado una nueva contraseña temporal a tu email",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error al enviar el correo. Contacte al administrador.",
      });
    }
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Cambiar contraseña (para usuarios logueados)
export const changePassword = async (req, res, usuarioModel) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Del middleware de autenticación

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "La contraseña actual y nueva son requeridas",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    // Obtener contraseña actual del usuario
    const [users] = await connection.execute(
      "SELECT BIN_TO_UUID(id_usuario) as idUsuario, contrasenia FROM Usuarios WHERE BIN_TO_UUID(id_usuario) = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const user = users[0];

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.contrasenia
    );
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "La contraseña actual es incorrecta",
      });
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await connection.execute(
      "UPDATE Usuarios SET contrasenia = ? WHERE BIN_TO_UUID(id_usuario) = ?",
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};
