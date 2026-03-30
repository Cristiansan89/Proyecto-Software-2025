import schedule from "node-schedule";
import { ParametroSistemaModel } from "../models/parametrosistema.js";
import {
  generarInsumosSemanales,
  generarPedidosAutomaticos,
  finalizarPlanificacionesAutomaticas,
} from "../controllers/generacionAutomaticaController.js";
import { ConfiguracionServicioAutomaticoModel } from "../models/configuracionServicioAutomatico.js";
import { connection } from "../models/db.js";

class SchedulerService {
  constructor() {
    this.jobs = {};
    this.initialized = false;
  }

  async inicializar() {
    try {
      console.log(
        "[Scheduler] Inicializando servicio de generación automática..."
      );

      const parametros = await ParametroSistemaModel.getAll();

      // Configuración de insumos semanales
      const insumosHabilitado =
        parametros.find(
          (p) => p.nombreParametro === "INSUMOS_SEMANALES_HABILITADO"
        )?.valor === "true";

      const insumosDia = parametros.find(
        (p) => p.nombreParametro === "INSUMOS_SEMANALES_DIA"
      )?.valor;

      const insumosHora = parametros.find(
        (p) => p.nombreParametro === "INSUMOS_SEMANALES_HORA"
      )?.valor;

      // Configuración de pedidos automáticos
      const pedidosHabilitado =
        parametros.find(
          (p) => p.nombreParametro === "PEDIDOS_AUTOMATICOS_HABILITADO"
        )?.valor === "true";

      const pedidosDia = parametros.find(
        (p) => p.nombreParametro === "PEDIDOS_AUTOMATICOS_DIA"
      )?.valor;

      const pedidosHora = parametros.find(
        (p) => p.nombreParametro === "PEDIDOS_AUTOMATICOS_HORA"
      )?.valor;

      // Configuración de finalización automática
      const finalizacionHabilitada =
        parametros.find(
          (p) => p.nombreParametro === "FINALIZACION_AUTOMATICA_HABILITADO"
        )?.valor === "true";

      const finalizacionHora = parametros.find(
        (p) => p.nombreParametro === "FINALIZACION_AUTOMATICA_HORA"
      )?.valor;

      // Programar insumos semanales
      if (insumosHabilitado && insumosDia && insumosHora) {
        this.programarInsumosSemanales(insumosDia, insumosHora);
      }

      // Programar pedidos automáticos
      if (pedidosHabilitado && pedidosDia && pedidosHora) {
        this.programarPedidosAutomaticos(pedidosDia, pedidosHora);
      }

      // Programar finalización automática
      if (finalizacionHabilitada && finalizacionHora) {
        this.programarFinalizacionAutomatica(finalizacionHora);
      }

      // Programar procesamiento automático de asistencias por servicio
      await this.programarProcesamientoAsistencias();

      this.initialized = true;
      console.log("[Scheduler] Servicio de generación automática inicializado");
    } catch (error) {
      console.error("[Scheduler] Error al inicializar:", error);
    }
  }

  async recargar() {
    console.log("[Scheduler] Recargando configuración...");

    // Cancelar trabajos existentes
    Object.values(this.jobs).forEach((job) => {
      if (job) job.cancel();
    });
    this.jobs = {};

    // Reinicializar
    await this.inicializar();
  }

  programarInsumosSemanales(dia, hora) {
    // Mapear día de semana español a número (0 = domingo, 1 = lunes, etc.)
    const diasMap = {
      lunes: 1,
      martes: 2,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
    };

    const diaNum = diasMap[dia.toLowerCase()] || 5; // Por defecto viernes
    const [horas, minutos] = hora.split(":").map(Number);

    // Crear expresión cron: minutos horas * * día (en semana)
    // Ej: "0 8 * * 5" = Viernes a las 8:00 AM
    const cronExpression = `${minutos} ${horas} * * ${diaNum}`;

    try {
      this.jobs.insumosSemanales = schedule.scheduleJob(
        cronExpression,
        async () => {
          console.log(
            `[Scheduler] Ejecutando generación de insumos semanales (${dia} ${hora})`
          );

          try {
            // Crear un mock de request/response para ejecutar el controlador
            const mockReq = {};
            const mockRes = {
              json: (data) => {
                if (data.success) {
                  console.log(
                    `[Scheduler] ✓ Insumos generados: ${
                      data.insumos?.length || 0
                    } items`
                  );
                } else {
                  console.error(
                    `[Scheduler] ✗ Error en generación: ${data.mensaje}`
                  );
                }
              },
              status: (code) => ({
                json: (data) => {
                  console.error(
                    `[Scheduler] ✗ Error (${code}): ${data.mensaje}`
                  );
                },
              }),
            };

            await generarInsumosSemanales(mockReq, mockRes);
          } catch (error) {
            console.error(
              "[Scheduler] Error ejecutando generación de insumos:",
              error
            );
          }
        }
      );

      console.log(
        `[Scheduler] ✓ Insumos programados: ${dia} ${hora} (cron: ${cronExpression})`
      );
    } catch (error) {
      console.error(`[Scheduler] Error programando insumos: ${error.message}`);
    }
  }

  programarPedidosAutomaticos(dia, hora) {
    // Mapear día de semana español a número
    const diasMap = {
      lunes: 1,
      martes: 2,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
    };

    const diaNum = diasMap[dia.toLowerCase()] || 5; // Por defecto viernes
    const [horas, minutos] = hora.split(":").map(Number);

    const cronExpression = `${minutos} ${horas} * * ${diaNum}`;

    try {
      this.jobs.pedidosAutomaticos = schedule.scheduleJob(
        cronExpression,
        async () => {
          console.log(
            `[Scheduler] Ejecutando generación de pedidos automáticos (${dia} ${hora})`
          );

          try {
            // Crear un mock de request/response para ejecutar el controlador
            const mockReq = {};
            const mockRes = {
              json: (data) => {
                if (data.success) {
                  console.log(
                    `[Scheduler] ✓ Pedidos generados: ${
                      data.pedidosCreados?.length || 0
                    } pedidos`
                  );
                } else {
                  console.error(
                    `[Scheduler] ✗ Error en generación: ${data.mensaje}`
                  );
                }
              },
              status: (code) => ({
                json: (data) => {
                  console.error(
                    `[Scheduler] ✗ Error (${code}): ${data.mensaje}`
                  );
                },
              }),
            };

            await generarPedidosAutomaticos(mockReq, mockRes);
          } catch (error) {
            console.error(
              "[Scheduler] Error ejecutando generación de pedidos:",
              error
            );
          }
        }
      );

      console.log(
        `[Scheduler] ✓ Pedidos programados: ${dia} ${hora} (cron: ${cronExpression})`
      );
    } catch (error) {
      console.error(`[Scheduler] Error programando pedidos: ${error.message}`);
    }
  }

  programarFinalizacionAutomatica(hora) {
    const [horas, minutos] = hora.split(":").map(Number);

    // Ejecutar todos los días a la hora especificada
    // Formato cron: "minutos horas * * *" (todos los días)
    const cronExpression = `${minutos} ${horas} * * *`;

    try {
      this.jobs.finalizacionAutomatica = schedule.scheduleJob(
        cronExpression,
        async () => {
          console.log(
            `[Scheduler] Ejecutando finalización automática de planificaciones (${hora})`
          );

          try {
            // Crear un mock de request/response para ejecutar el controlador
            const mockReq = {};
            const mockRes = {
              json: (data) => {
                if (data.success && data.finalizadas > 0) {
                  console.log(
                    `[Scheduler] ✓ ${data.finalizadas} planificación(es) finalizada(s)`
                  );
                  if (data.planificacionActivada) {
                    console.log(
                      `[Scheduler] ✓ Planificación activada: ${data.planificacionActivada.label}`
                    );
                  }
                } else if (data.success) {
                  console.log(
                    `[Scheduler] No había planificaciones vencidas para finalizar`
                  );
                  if (data.planificacionActivada) {
                    console.log(
                      `[Scheduler] ✓ Planificación activada: ${data.planificacionActivada.label}`
                    );
                  }
                }
              },
              status: (code) => ({
                json: (data) => {
                  console.error(
                    `[Scheduler] ✗ Error (${code}): ${data.mensaje}`
                  );
                },
              }),
            };

            await finalizarPlanificacionesAutomaticas(mockReq, mockRes);
          } catch (error) {
            console.error("[Scheduler] Error ejecutando finalización:", error);
          }
        }
      );

      console.log(
        `[Scheduler] ✓ Finalización automática programada: diariamente a las ${hora} (cron: ${cronExpression})`
      );
    } catch (error) {
      console.error(
        `[Scheduler] Error programando finalización: ${error.message}`
      );
    }
  }

  // Programa un job diario a la horaFin de cada servicio para calcular
  // y persistir los registros de asistencias completadas.
  async programarProcesamientoAsistencias() {
    try {
      const configuraciones = await ConfiguracionServicioAutomaticoModel.getAll();
      const activas = configuraciones.filter((c) => c.procesarAutomaticamente);

      if (activas.length === 0) {
        console.log(
          "[Scheduler] No hay servicios con procesamiento automático de asistencias configurado"
        );
        return;
      }

      for (const config of activas) {
        const { horaFin, id_servicio, nombreServicio } = config;

        if (!horaFin) continue;

        const [horaStr, minutosStr] = horaFin.split(":");
        const horas = parseInt(horaStr, 10);
        const minutos = parseInt(minutosStr, 10);

        if (isNaN(horas) || isNaN(minutos)) {
          console.warn(
            `[Scheduler] Hora fin inválida para ${nombreServicio}: ${horaFin}`
          );
          continue;
        }

        const cronExpression = `${minutos} ${horas} * * *`;
        const jobKey = `asistencias_servicio_${id_servicio}`;

        this.jobs[jobKey] = schedule.scheduleJob(
          cronExpression,
          async () => {
            const fechaHoy = new Date().toISOString().split("T")[0];
            console.log(
              `[Scheduler] Procesando asistencias de "${nombreServicio}" (hora fin ${horaFin}) para ${fechaHoy}...`
            );
            await this._procesarAsistenciasServicio(
              fechaHoy,
              id_servicio,
              nombreServicio
            );
          }
        );

        console.log(
          `[Scheduler] ✓ Asistencias programadas para "${nombreServicio}": diariamente a las ${horaFin} (cron: ${cronExpression})`
        );
      }
    } catch (error) {
      console.error(
        "[Scheduler] Error al programar procesamiento de asistencias:",
        error
      );
    }
  }

  // Calcula la cantidad de presentes por grado para un servicio + fecha
  // y crea/actualiza los registros en RegistrosAsistencias.
  async _procesarAsistenciasServicio(fecha, idServicio, nombreServicio) {
    try {
      // Obtener todas las combinaciones de grado que tienen asistencias registradas
      const [combinaciones] = await connection.query(
        `SELECT DISTINCT
              g.id_grado,
              g.nombreGrado
         FROM Asistencias a
         JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
         JOIN Grados g ON ag.nombreGrado = g.nombreGrado
         WHERE DATE(a.fecha) = ? AND a.id_servicio = ?`,
        [fecha, idServicio]
      );

      if (combinaciones.length === 0) {
        console.log(
          `[Scheduler] Sin asistencias para "${nombreServicio}" en ${fecha}. No se generaron registros.`
        );
        return;
      }

      let creados = 0;
      let actualizados = 0;

      for (const { id_grado, nombreGrado } of combinaciones) {
        // Contar alumnos presentes (tipoAsistencia = 'Si')
        const [countResult] = await connection.query(
          `SELECT COUNT(*) as cantidadPresentes
           FROM Asistencias a
           JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
           JOIN Grados g ON ag.nombreGrado = g.nombreGrado
           WHERE DATE(a.fecha) = ?
             AND a.id_servicio = ?
             AND g.id_grado = ?
             AND a.tipoAsistencia = 'Si'`,
          [fecha, idServicio, id_grado]
        );

        const cantidadPresentes = countResult[0]?.cantidadPresentes || 0;

        // Verificar si ya existe el registro en RegistrosAsistencias
        const [existing] = await connection.query(
          `SELECT id_asistencia
           FROM RegistrosAsistencias
           WHERE fecha = ? AND id_servicio = ? AND id_grado = ?`,
          [fecha, idServicio, id_grado]
        );

        if (existing.length > 0) {
          await connection.query(
            `UPDATE RegistrosAsistencias
             SET cantidadPresentes = ?, fechaActualizacion = NOW()
             WHERE id_asistencia = ?`,
            [cantidadPresentes, existing[0].id_asistencia]
          );
          actualizados++;
        } else {
          await connection.query(
            `INSERT INTO RegistrosAsistencias (id_grado, id_servicio, fecha, cantidadPresentes, fechaCreacion, fechaActualizacion)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [id_grado, idServicio, fecha, cantidadPresentes]
          );
          creados++;
        }

        console.log(
          `[Scheduler]   ${nombreGrado}: ${cantidadPresentes} presentes`
        );
      }

      console.log(
        `[Scheduler] ✓ "${nombreServicio}" (${fecha}): ${creados} registros creados, ${actualizados} actualizados`
      );
    } catch (error) {
      console.error(
        `[Scheduler] Error al procesar asistencias de "${nombreServicio}":`,
        error
      );
    }
  }

  obtenerEstado() {
    return {
      inicializado: this.initialized,
      trabajos: Object.keys(this.jobs).filter((key) => this.jobs[key] !== null),
      timestamp: new Date().toISOString(),
    };
  }
}

export const schedulerService = new SchedulerService();
