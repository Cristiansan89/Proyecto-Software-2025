import { validateGrado, validatePartialGrado } from '../schemas/grados.js'

export class GradoController {
    constructor({ gradoModel }) {
        this.gradoModel = gradoModel
    }

    getAll = async (req, res) => {
        try {
            console.log('GradoController: getAll llamado');
            const grados = await this.gradoModel.getAll()
            console.log('GradoController: grados obtenidos:', grados.length);
            res.json(grados)
        } catch (error) {
            console.error('GradoController: Error en getAll:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    getById = async (req, res) => {
        try {
            console.log('GradoController: getById llamado con ID:', req.params.id);
            const { id } = req.params
            const grado = await this.gradoModel.getById({ id })

            if (grado) {
                console.log('GradoController: grado encontrado:', grado);
                return res.json(grado)
            }
            console.log('GradoController: grado no encontrado');
            res.status(404).json({ message: 'Grado no encontrado' })
        } catch (error) {
            console.error('GradoController: Error en getById:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    create = async (req, res) => {
        try {
            console.log('GradoController: create llamado con datos:', req.body);

            const result = validateGrado(req.body)
            console.log('GradoController: validación:', result.success ? 'exitosa' : 'falló');

            if (!result.success) {
                console.log('GradoController: errores de validación:', result.error.errors);
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            console.log('GradoController: datos validados:', result.data);
            const newGrado = await this.gradoModel.create({ input: result.data })
            console.log('GradoController: grado creado:', newGrado);

            res.status(201).json(newGrado)
        } catch (error) {
            console.error('GradoController: Error en create:', error)
            console.error('Stack trace:', error.stack);

            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    update = async (req, res) => {
        try {
            console.log('GradoController: update llamado');
            const result = validatePartialGrado(req.body)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const { id } = req.params
            const updatedGrado = await this.gradoModel.update({ id, input: result.data })

            if (!updatedGrado) {
                return res.status(404).json({ message: 'Grado no encontrado' })
            }

            return res.json(updatedGrado)
        } catch (error) {
            console.error('GradoController: Error en update:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    delete = async (req, res) => {
        try {
            console.log('GradoController: delete llamado');
            const { id } = req.params
            const deleted = await this.gradoModel.delete({ id })

            if (!deleted) {
                return res.status(404).json({ message: 'Grado no encontrado' })
            }

            return res.json({ message: 'Grado eliminado correctamente' })
        } catch (error) {
            console.error('GradoController: Error en delete:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    getActivos = async (req, res) => {
        try {
            console.log('GradoController: getActivos llamado');
            const allGrados = await this.gradoModel.getAll()
            const gradosActivos = allGrados.filter(grado => grado.estado === 'Activo')
            res.json(gradosActivos)
        } catch (error) {
            console.error('GradoController: Error en getActivos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    searchByNombre = async (req, res) => {
        try {
            console.log('GradoController: searchByNombre llamado');
            const { nombre } = req.query
            if (!nombre) {
                return res.status(400).json({ message: 'El parámetro nombre es requerido' })
            }

            const allGrados = await this.gradoModel.getAll()
            const gradosFiltrados = allGrados.filter(grado =>
                grado.nombreGrado.toLowerCase().includes(nombre.toLowerCase())
            )
            res.json(gradosFiltrados)
        } catch (error) {
            console.error('GradoController: Error en searchByNombre:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    cambiarEstado = async (req, res) => {
        try {
            console.log('GradoController: cambiarEstado llamado');
            const { id } = req.params
            const { estado } = req.body

            if (!['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ message: 'Estado inválido' })
            }

            const gradoActualizado = await this.gradoModel.update({ id, input: { estado } })
            if (!gradoActualizado) {
                return res.status(404).json({ message: 'Grado no encontrado' })
            }

            res.json(gradoActualizado)
        } catch (error) {
            console.error('GradoController: Error en cambiarEstado:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}