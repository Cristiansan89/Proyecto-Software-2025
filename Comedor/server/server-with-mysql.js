import { createApp } from "./app.js"
import { ConsumoModel } from './models/consumo.js'
import { GradoModel } from './models/grado.js'
import { InsumoModel } from './models/insumo.js'
import { InventarioModel } from './models/inventario.js'
import { ItemRecetaModel } from './models/itemreceta.js'
import { LineaPedidoModel } from './models/lineapedido.js'
import { MovimientoInventarioModel } from './models/movimientoinventario.js'
import { ParametroSistemaModel } from './models/parametrosistema.js'
import { PedidoModel } from './models/pedido.js'
import { PermisoModel } from './models/permiso.js'
import { PersonaModel } from './models/persona.js'
import { PlanificacionMenuModel } from './models/planificacionmenu.js'
import { ProveedorModel } from './models/proveedor.js'
import { ProveedorInsumoModel } from './models/proveedorinsumo.js'
import { RecetaModel } from './models/receta.js'
import { RegistroAsistenciaModel } from './models/registroasistencia.js'
import { RolModel } from './models/rol.js'
import { RolPermisoModel } from './models/rolpermiso.js'
import { ServicioModel } from './models/servicio.js'
import { TurnoModel } from './models/turno.js'
import { UsuarioModel } from './models/usuario.js'

const PORT = process.env.PORT ?? 3000

const app = createApp({
    consumoModel: ConsumoModel,
    rolModel: RolModel,
    gradoModel: GradoModel,
    insumoModel: InsumoModel,
    inventarioModel: InventarioModel,
    itemRecetaModel: ItemRecetaModel,
    lineaPedidoModel: LineaPedidoModel,
    movimientoInventarioModel: MovimientoInventarioModel,
    parametroSistemaModel: ParametroSistemaModel,
    pedidoModel: PedidoModel,
    permisoModel: PermisoModel,
    personaModel: PersonaModel,
    planificacionMenuModel: PlanificacionMenuModel,
    proveedorModel: ProveedorModel,
    proveedorInsumoModel: ProveedorInsumoModel,
    recetaModel: RecetaModel,
    registroAsistenciaModel: RegistroAsistenciaModel,
    rolPermisoModel: RolPermisoModel,
    servicioModel: ServicioModel,
    turnoModel: TurnoModel,
    usuarioModel: UsuarioModel
})

app.listen(PORT, () => {
    console.log(`El Servidor esta corriendo en el puerto http://localhost:${PORT}`)
})