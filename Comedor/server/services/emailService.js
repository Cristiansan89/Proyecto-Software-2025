import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configuración para Mailtrap
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.MAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });
};

// Plantillas de correo
const emailTemplates = {
  welcomeUser: (userData) => ({
    subject: "¡Bienvenido al Sistema de Comedor Escolar!",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px;">
                <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                            <span style="color: white; font-size: 24px;">🍽️</span>
                        </div>
                        <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">¡Bienvenido al Sistema!</h1>
                        <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 16px;">Tu cuenta ha sido creada exitosamente</p>
                    </div>
                    
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                        <h2 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">
                            <span style="color: #667eea;">👤</span> Datos de tu cuenta
                        </h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Nombre:</td>
                                <td style="padding: 8px 0; color: #2c3e50; font-weight: 500;">${
                                  userData.nombre
                                } ${userData.apellido}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Usuario:</td>
                                <td style="padding: 8px 0; color: #667eea; font-weight: 600; font-family: monospace;">${
                                  userData.username
                                }</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Contraseña temporal:</td>
                                <td style="padding: 8px 0; color: #dc3545; font-weight: 600; font-family: monospace; background: #fff3cd; padding: 5px 8px; border-radius: 4px; display: inline-block;">${
                                  userData.temporalPassword
                                }</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
                        <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">
                            🔐 Importante - Seguridad
                        </h3>
                        <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                            Por tu seguridad, te recomendamos <strong>cambiar tu contraseña</strong> en tu primer inicio de sesión. 
                            Esta contraseña temporal es solo para tu acceso inicial.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 25px;">
                        <a href="${
                          process.env.FRONTEND_URL || "http://localhost:5173"
                        }" 
                           style="background: linear-gradient(135deg, #274fffff 0%, #4c0097ff 100%); 
                                  color: white; 
                                  text-decoration: none; 
                                  padding: 15px 30px; 
                                  border-radius: 50px; 
                                  font-weight: 600; 
                                  font-size: 16px;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                                  display: inline-block;
                                  transition: all 0.3s ease;">
                            Acceder al Sistema
                        </a>
                    </div>
                    
                    <div style="border-top: 1px solid #e9ecef; padding-top: 20px; text-align: center;">
                        <p style="color: #6c757d; font-size: 12px; margin: 0;">
                            Sistema de Comedor Escolar - ${new Date().getFullYear()}<br>
                            Si no solicitaste esta cuenta, por favor contacta al administrador del sistema.
                        </p>
                    </div>
                </div>
            </div>
        `,
  }),

  resetPassword: (userData) => ({
    subject: "Recuperación de Contraseña - Sistema Comedor Escolar",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 15px;">
                <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                            <span style="color: white; font-size: 24px;">🔒</span>
                        </div>
                        <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">Recuperación de Contraseña</h1>
                        <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 16px;">Solicitud de restablecimiento de contraseña</p>
                    </div>
                    
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                        <h2 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">
                            <span style="color: #f093fb;">👤</span> Información de tu cuenta
                        </h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Nombre:</td>
                                <td style="padding: 8px 0; color: #2c3e50; font-weight: 500;">${
                                  userData.nombre
                                } ${userData.apellido}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Usuario:</td>
                                <td style="padding: 8px 0; color: #f093fb; font-weight: 600; font-family: monospace;">${
                                  userData.username
                                }</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Nueva contraseña temporal:</td>
                                <td style="padding: 8px 0; color: #dc3545; font-weight: 600; font-family: monospace; background: #fff3cd; padding: 5px 8px; border-radius: 4px; display: inline-block;">${
                                  userData.temporalPassword
                                }</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
                        <h3 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px;">
                            ℹ️ Instrucciones
                        </h3>
                        <p style="color: #0c5460; margin: 0; font-size: 14px; line-height: 1.5;">
                            Utiliza esta contraseña temporal para acceder al sistema. Una vez dentro, 
                            dirígete a tu perfil y <strong>cambia tu contraseña</strong> por una nueva y segura.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 25px;">
                        <a href="${
                          process.env.FRONTEND_URL || "http://localhost:5173"
                        }" 
                           style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                                  color: white; 
                                  text-decoration: none; 
                                  padding: 15px 30px; 
                                  border-radius: 50px; 
                                  font-weight: 600; 
                                  font-size: 16px;
                                  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
                                  display: inline-block;
                                  transition: all 0.3s ease;">
                            Iniciar Sesión
                        </a>
                    </div>
                    
                    <div style="border-top: 1px solid #e9ecef; padding-top: 20px; text-align: center;">
                        <p style="color: #6c757d; font-size: 12px; margin: 0;">
                            Sistema de Comedor Escolar - ${new Date().getFullYear()}<br>
                            Si no solicitaste este restablecimiento, por favor contacta al administrador del sistema.
                        </p>
                    </div>
                </div>
            </div>
        `,
  }),
};

// Función para enviar correo de bienvenida
export const sendWelcomeEmail = async (userData, temporalPassword) => {
  try {
    const emailAddress = userData.mail || userData.email;

    if (!emailAddress) {
      throw new Error(
        `No se encontró dirección de email válida para el usuario: ${
          userData.nombreUsuario || "Desconocido"
        }`
      );
    }

    const transporter = createTransporter();
    const emailData = emailTemplates.welcomeUser({
      ...userData,
      temporalPassword,
    });

    const mailOptions = {
      from: `"Sistema Comedor Escolar" <${
        process.env.MAIL_FROM || "noreply@comedor.edu"
      }>`,
      to: emailAddress,
      subject: emailData.subject,
      html: emailData.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Correo de bienvenida enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error al enviar correo de bienvenida:", error);
    return { success: false, error: error.message };
  }
};

// Función para enviar correo de recuperación
export const sendPasswordResetEmail = async (userData, temporalPassword) => {
  try {
    const emailAddress = userData.mail || userData.email;

    if (!emailAddress) {
      throw new Error("No se encontró dirección de email válida");
    }

    const transporter = createTransporter();
    const emailData = emailTemplates.resetPassword({
      ...userData,
      temporalPassword,
    });

    const mailOptions = {
      from: `"Sistema Comedor Escolar" <${
        process.env.MAIL_FROM || "noreply@comedor.edu"
      }>`,
      to: emailAddress,
      subject: emailData.subject,
      html: emailData.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Correo de recuperación enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    return { success: false, error: error.message };
  }
};

// Función para generar contraseña temporal
export const generateTemporalPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  generateTemporalPassword,
};
