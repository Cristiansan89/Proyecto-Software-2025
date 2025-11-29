import schedule from "node-schedule";
import { ParametroSistemaModel } from "../models/parametrosistema.js";
import {
  generarInsumosSemanales,
  generarPedidosAutomaticos,
  finalizarPlanificacionesAutomaticas,
} from "../controllers/generacionAutomaticaController.js";

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
                    `[Scheduler] ✓ Planificación finalizada: ${data.planificacion?.nombre}`
                  );
                } else {
                  console.log(
                    `[Scheduler] No hay planificaciones para finalizar`
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

  obtenerEstado() {
    return {
      inicializado: this.initialized,
      trabajos: Object.keys(this.jobs).filter((key) => this.jobs[key] !== null),
      timestamp: new Date().toISOString(),
    };
  }
}

export const schedulerService = new SchedulerService();
