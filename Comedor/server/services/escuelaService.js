/**
 * Servicio para manejar los datos de la escuela
 */

import { ParametroSistemaModel } from "../models/parametrosistema.js";

export class EscuelaService {
  /**
   * Obtiene todos los datos de la escuela desde los parámetros del sistema
   */
  static async getDatosEscuela() {
    try {
      const parametros = await ParametroSistemaModel.getAll();

      const datosEscuela = {
        nombre: "",
        direccion: "",
        telefono: "",
        email: "",
      };

      parametros.forEach((param) => {
        switch (param.nombreParametro) {
          case "NOMBRE_ESCUELA":
            datosEscuela.nombre = param.valor;
            break;
          case "DIRECCION_ESCUELA":
            datosEscuela.direccion = param.valor;
            break;
          case "TELEFONO_ESCUELA":
            datosEscuela.telefono = param.valor;
            break;
          case "EMAIL_ESCUELA":
            datosEscuela.email = param.valor;
            break;
        }
      });

      return datosEscuela;
    } catch (error) {
      console.error("Error al obtener datos de la escuela:", error);
      throw new Error("Error al obtener datos de la escuela");
    }
  }

  /**
   * Actualiza los datos de la escuela
   */
  static async actualizarDatosEscuela(datos) {
    try {
      const parametrosMap = {
        nombre: "NOMBRE_ESCUELA",
        direccion: "DIRECCION_ESCUELA",
        telefono: "TELEFONO_ESCUELA",
        email: "EMAIL_ESCUELA",
      };

      const actualizaciones = [];

      for (const [key, valor] of Object.entries(datos)) {
        if (parametrosMap[key] && valor !== undefined) {
          try {
            // Intentar actualizar el parámetro
            const updated = await ParametroSistemaModel.updateByNombre({
              nombreParametro: parametrosMap[key],
              valor: valor,
            });

            // Si no se actualizó ningún registro, el parámetro no existe, así que lo creamos
            if (!updated) {
              await ParametroSistemaModel.create({
                input: {
                  nombreParametro: parametrosMap[key],
                  valor: valor,
                  tipoParametro: "string",
                  estado: "Activo",
                },
              });
              console.log(
                `Parámetro ${parametrosMap[key]} creado con valor: ${valor}`
              );
            } else {
              console.log(
                `Parámetro ${parametrosMap[key]} actualizado con valor: ${valor}`
              );
            }

            actualizaciones.push(key);
          } catch (error) {
            console.error(`Error al actualizar/crear ${key}:`, error);
          }
        }
      }

      return {
        success: true,
        actualizados: actualizaciones,
      };
    } catch (error) {
      console.error("Error al actualizar datos de la escuela:", error);
      throw new Error("Error al actualizar datos de la escuela");
    }
  }
}

export default EscuelaService;
