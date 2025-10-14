import express from 'express'
import { corsMiddleware } from './middlewares/cors.js'
import { createAuthRouter } from './routes/auth.js'

// Importar todas las rutas
import { createRolRouter } from './routes/roles.js'
import { createGradoRouter } from './routes/grados.js'
import { createInsumoRouter } from './routes/insumos.js'
import { createInventarioRouter } from './routes/inventarios.js'
import { createItemRecetaRouter } from './routes/itemsrecetas.js'
import { createLineaPedidoRouter } from './routes/lineaspedidos.js'
import { createMovimientoInventarioRouter } from './routes/movimientosinventarios.js'
import { createParametroSistemaRouter } from './routes/parametrossistemas.js'
import { createPedidoRouter } from './routes/pedidos.js'
import { createPermisoRouter } from './routes/permisos.js'
import { createPlanificacionMenuRouter } from './routes/planificacionmenus.js'
import { createProveedorRouter } from './routes/proveedores.js'
import { createRecetaRouter } from './routes/recetas.js'
import { createRegistroAsistenciaRouter } from './routes/registrosasistencias.js'
import { createRolPermisoRouter } from './routes/rolpermisos.js'
import { createUsuarioRouter } from './routes/usuarios.js'
import { createConsumoRouter } from './routes/consumos.js'
import { proveedorInsumosRouter } from './routes/proveedorinsumos.js'

export const createApp = ({
    usuarioModel,
    consumoModel,
    rolModel,
    gradoModel,
    insumoModel,
    inventarioModel,
    itemRecetaModel,
    lineaPedidoModel,
    movimientoInventarioModel,
    parametroSistemaModel,
    pedidoModel,
    permisoModel,
    planificacionMenuModel,
    proveedorModel,
    recetaModel,
    registroAsistenciaModel,
    rolPermisoModel
}) => {
    const app = express()

    // Middlewares
    app.use(express.json())
    app.use(corsMiddleware())
    app.disable('x-powered-by')

    // Rutas públicas (no requieren autenticación)
    app.use('/auth', createAuthRouter({ usuarioModel }))

    // Comentamos temporalmente el middleware de autenticación
    // app.use(authRequired)

    // Todas las rutas ahora son públicas
    app.use('/roles', createRolRouter({ rolModel }))
    app.use('/usuarios', createUsuarioRouter({ usuarioModel }))
    app.use('/consumos', createConsumoRouter({ consumoModel }))
    app.use('/grados', createGradoRouter({ gradoModel }))
    app.use('/insumos', createInsumoRouter({ insumoModel }))
    app.use('/inventarios', createInventarioRouter({ inventarioModel }))
    app.use('/items-recetas', createItemRecetaRouter({ itemRecetaModel }))
    app.use('/lineas-pedidos', createLineaPedidoRouter({ lineaPedidoModel }))
    app.use('/movimientos-inventarios', createMovimientoInventarioRouter({ movimientoInventarioModel }))
    app.use('/parametros-sistemas', createParametroSistemaRouter({ parametroSistemaModel }))
    app.use('/pedidos', createPedidoRouter({ pedidoModel }))
    app.use('/permisos', createPermisoRouter({ permisoModel }))
    app.use('/planificacion-menus', createPlanificacionMenuRouter({ planificacionMenuModel }))
    app.use('/proveedores', createProveedorRouter({ proveedorModel }))
    app.use('/recetas', createRecetaRouter({ recetaModel }))
    app.use('/registros-asistencias', createRegistroAsistenciaRouter({ registroAsistenciaModel }))
    app.use('/rol-permisos', createRolPermisoRouter({ rolPermisoModel }))
    app.use('/proveedorinsumos', proveedorInsumosRouter)

    const PORT = process.env.PORT ?? 3000

    app.listen(PORT, () => {
        console.log(`El Servidor esta corriendo en el puerto http://localhost:${PORT}`)
    })

    return app
}




