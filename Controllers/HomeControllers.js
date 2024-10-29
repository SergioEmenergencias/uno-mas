const { getConnection } = require('../db/sqlMongoose');
const Publics = require('../Models/Posting');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const Foros= require('../Models/Foros')
const User = require('../Models/User');
const cloudinary = require('cloudinary').v2;


cloudinary.config({
    cloud_name: process.env.cloud_name, // Reemplaza con tu nombre de nube
    api_key: process.env.api_key,       // Reemplaza con tu API key
    api_secret: process.env.api_secret  // Reemplaza con tu API secret
});

const leerPublicaciones = async (req, res) => {
    try {
        // Usamos populate para obtener los datos del usuario referenciado en cada publicación
        const urls = await Publics.find().lean().populate('user'); // Cargar todas las publicaciones con los datos del usuario
        
        const currentUser = await User.findById(req.user.id).lean(); // Cargar el usuario actual
        // Obtener mensajes de flash
        const successMessage = req.flash('success');
        const errorMessage = req.flash('error');
        
        console.log('datos del usuario actual', currentUser);
        console.log('publicaciones con datos del usuario', urls);
        
        return res.render('Publicandoymas', { 
            urls,  // Enviamos las publicaciones con los datos del usuario poblados
            user: currentUser,
            telefono: currentUser.telefono,
            successMessage, 
            errorMessage 
        });
    } catch (error) {
        console.error('Error al leer publicaciones:', error);
        req.flash('error', 'Error al cargar las publicaciones');
        return res.redirect('/'); // Redirigir en caso de error
    }
};


const leertablas = async () => {
    try {
        const [rows] = await sqlPool.query("SELECT * FROM actividades");
        return rows;
    } catch (error) {
        throw { status: 500, message: "Error al obtener actividades" };
    }
};
const agregarPost = async (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        try {
            if (err) {
                throw new Error("Error al procesar el formulario.");
            }

            const { Names } = fields;
            const fileKeys = Object.keys(files);

            if (!fileKeys.length) {
                throw new Error('Por favor agrega al menos una imagen.');
            }

            const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            const processedImages = [];

            for (const key of fileKeys) {
                const fileArray = Array.isArray(files[key]) ? files[key] : [files[key]];

                for (const file of fileArray) {
                    if (!file.originalFilename) {
                        throw new Error('Uno de los archivos no tiene un nombre válido.');
                    }

                    if (!validMimeTypes.includes(file.mimetype.toLowerCase())) {
                        throw new Error(`El archivo ${file.originalFilename} no es un tipo de imagen válido (JPG, JPEG, PNG).`);
                    }

                    if (file.size > 5 * 1024 * 1024) { // 5MB
                        throw new Error(`El archivo ${file.originalFilename} es mayor a 5MB.`);
                    }

                    try {
                        // Sube la imagen a Cloudinary
                        const result = await cloudinary.uploader.upload(file.filepath, {
                            folder: 'Publicaciones/artesymas',
                            public_id: file.originalFilename.split('.')[0],
                            overwrite: true,
                            transformation: [{ width: 200, height: 200, crop: 'fill', quality: 80 }]
                        });

                        processedImages.push(result.secure_url); // Guarda la URL segura de Cloudinary
                    } catch (error) {
                        throw new Error(`Error al procesar la imagen ${file.originalFilename}: ${error.message}`);
                    }
                }
            }

            const user = await User.findById(req.user.id);
            const publics = new Publics({
                name: Names || "pablitos",
                Imagen: processedImages,
                user: req.user.id,
                telefono: user.telefono
            });

            await publics.save();
            req.flash('success', 'Publicación creada con éxito.');
            return res.redirect('/publicandoymas');
        } catch (error) {
            console.error(error);
            req.flash('error', error.message);
            return res.redirect("/publicandoymas");
        }
    });
};

const leerForos = async (req, res) => {
    try {
        const foros = await Foros.find().lean();

        // Obtener mensajes de éxito y error
        const successMessage = req.flash('success');
        const errorMessage = req.flash('error');

        res.render("foros", { foros, successMessage, errorMessage });
    } catch (error) {
        console.error(error);
        req.flash('error', "Error al obtener los posts.");
        res.redirect("/foros"); // O redirigir a donde consideres apropiado
    }
};


const crearPost = async (req, res) => {
    const { pregunta, contexto } = req.body;
    const usuario = req.user.username;

    try {
        const nuevoPost = new Foros({ pregunta, contexto, usuario, fecha: new Date(), respuestas: [] });
        await nuevoPost.save();
        req.flash('success', 'Post creado con éxito.');
        res.redirect("/foros");
    } catch (error) {
        console.log(error);
        req.flash('error', "Error al crear el post.");
        res.redirect("/foros");
    }
};

const agregarRespuesta = async (req, res) => {
    const postId = req.params.id;
    const { texto } = req.body;
    const usuario = req.user.username;

    try {
        const foros = await Foros.findById(postId);
        foros.respuestas.push({ texto, usuario, fecha: new Date() });
        await foros.save();
        req.flash('success', 'Respuesta agregada con éxito.');
        res.redirect(`/foros/${postId}`); // Redirigir al post donde se agregó la respuesta
    } catch (error) {
        console.error(error);
        req.flash('error', "Error al agregar la respuesta.");
        res.redirect(`/foros/${postId}`); // Redirigir al post donde se intentó agregar la respuesta
    }
};
const leerpubs=(req, res)=>{
    res.send('yolo')
}// Crear una nueva actividad
const crearActividad = async (req, res) => {
    try {
        const { fecha, actividad, id_cultivo, extensionTrabajada, insumosUtilizados, costoInsumos, jornales, costoJornales, costoTotal, id_usuario } = req.body;
        const pool = await getConnection();
        const cultivoResult = await pool.request()
        .input('idCultivo', id_cultivo)
        .query('SELECT [Cultivo Trabajado] AS cultivo_trabajado  FROM [dbo].[Terrenos] WHERE id = @idCultivo');
        const nombreCultivo = cultivoResult.recordset[0].cultivo_trabajado;
        const result = await pool.request()
            .input('fecha', fecha)
            .input('actividad', actividad)
            .input('cultivoTrabajado', nombreCultivo)
            .input('extensionTrabajada', extensionTrabajada)
            .input('insumosUtilizados', insumosUtilizados)
            .input('costoInsumos', costoInsumos)
            .input('jornales', jornales)
            .input('costoJornales', costoJornales)
            .input('costoTotal', costoTotal)
            .input('id_usuario', req.user.id)
            .query(`INSERT INTO [dbo].[actividades] (fecha, actividad, cultivoTrabajado, extensionTrabajada, insumosUtilizados, costoInsumos, jornales, costoJornales, costoTotal, id_usuario) 
                    VALUES (@fecha, @actividad, @cultivoTrabajado, @extensionTrabajada, @insumosUtilizados, @costoInsumos, @jornales, @costoJornales, @costoTotal, @id_usuario)`);

        res.status(201).json({ message: 'Actividad creada con éxito', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear actividad', error });
    }
};
// Crear una nueva siembra
const crearSiembra = async (req, res) => {
    try {
        const {
            fecha_siembra,
            tipoSiembra,
            id_cultivo,
            costo,
            id_usuario,
            cantidad_pilones,
            costo_pilon,
            cantidad_jornales,
            costo_jornal
        } = req.body;
        
        console.log(req.body);
        console.log(req.user.id)
       const pool = await getConnection();
        
        // Obtener el nombre del cultivo desde la tabla Terrenos
        const cultivoResult = await pool.request()
            .input('idCultivo', id_cultivo)
            .query('SELECT [Cultivo Trabajado] AS cultivo_trabajado  FROM [dbo].[Terrenos] WHERE id = @idCultivo');
        
        const nombreCultivo = cultivoResult.recordset[0].cultivo_trabajado;
        
        const result = await pool.request()
            .input('FechaSiembra', fecha_siembra)
            .input('IdCultivo', id_cultivo)
            .input('NombreCultivo', nombreCultivo)
            .input('id_usuario', req.user.id)
            .input('CantidadPilones', cantidad_pilones)
            .input('CostoPorPilon', costo_pilon)
            .input('CantidadJornales', cantidad_jornales)
            .input('CostoPorJornal', costo_jornal)
            .query(`INSERT INTO [dbo].[Siembra] 
                ([Fecha Siembra],  [Id Cultivo], [Nombre Cultivo],id_usuario, 
                 [Cantidad de Pilones], [Costo por Pilón], [Cantidad de Jornales], [Costo por Jornal]) 
                VALUES 
                (@FechaSiembra, @IdCultivo, @NombreCultivo,  @id_usuario, 
                 @CantidadPilones, @CostoPorPilon, @CantidadJornales, @CostoPorJornal)`);
                 req.flash('success', ' registrada con éxito');
        res.redirect('/siembra')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear siembra', error });
    }
};

// Crear una nueva fertilización
const crearFertilizacion = async (req, res) => {
    const { fecha_fertilizacion, tipo_fertilizacion, id_cultivo, cantidad_quimicos, insumo, costoInsumo, jornales, costoJornal, costoTotal } = req.body;
console.log(req.body);
    try {
        const pool = await getConnection();
    console.log(req.body)
    // Obtener el nombre del cultivo
    const cultivoResult = await pool.request()
        .input('idCultivo', id_cultivo)
        .query('SELECT [Cultivo Trabajado] AS cultivo_trabajado  FROM [dbo].[Terrenos] WHERE id = @idCultivo');
    
    const nombreCultivo = cultivoResult.recordset[0]?.cultivo_trabajado; // Asegúrate de que exista un resultado

    // Insertar en la tabla Fertilizacion
    const result = await pool.request()
        .input('fecha', fecha_fertilizacion)
        .input('tipoFertilizacion', tipo_fertilizacion)
        .input('idCultivo', id_cultivo)
        .input('nombreCultivo', nombreCultivo)
        .input('insumo', insumo)
        .input('cantidad_quimico', cantidad_quimicos)
        .input('costoInsumo', costoInsumo)
        .input('jornales', jornales)
        .input('costoJornal', costoJornal)
        .input('id_usuario', req.user.id)
        .query(`INSERT INTO [dbo].[Fertilizacion] (
            [Fecha Fertilizacion],
            [Tipo de Fertilizacion],
            [Codigo de Cultivo],
            [Nombre Cultivo],
            [Quimico Utilizado],
            [Costo Quimico],
            [Cantidad de quimico utilizado],
            [Cantidad de Jornales],
            [Costo por Jornal], 
            id_usuario
        ) VALUES (
            @fecha,
            @tipoFertilizacion,
            @idCultivo,
            @nombreCultivo,
            @insumo,
            @costoInsumo,
            @cantidad_quimico,
            @jornales,
            @costoJornal,
            @id_usuario
        )`);
        req.flash('success', ' registrada con éxito');
   res.redirect('/fertilizacion')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear fertilización', error });
    }
};

// Crear un nuevo registro de enfermedad
const crearEnfermedad = async (req, res) => {
    const { 
        id_cultivo, 
        ubicacion, 
        nombre_plaga_enfermedad, 
        insumo_utilizado, 
        cantidad_insumo, 
        costo_insumo, 
        cantidad_jornales, 
        costo_jornal, 
        costoTotal 
    } = req.body;

    console.log(req.body);

    try {
        const pool = await getConnection();

        // Obtener el nombre del cultivo
        const cultivoResult = await pool.request()
            .input('idCultivo', id_cultivo)
            .query('SELECT [Cultivo Trabajado] AS cultivo_trabajado  FROM [dbo].[Terrenos] WHERE id = @idCultivo');
        
        // Verificar que se obtuvo un resultado
        if (!cultivoResult.recordset.length) {
            return res.status(404).json({ message: 'Cultivo no encontrado' });
        }

        const nombreCultivo = cultivoResult.recordset[0].cultivo_trabajado;

        // Insertar en la tabla Enfermedades
        const result = await pool.request()
            .input('idCultivo', id_cultivo)
            .input('nombreCultivo', nombreCultivo)
            .input('ubicacion', ubicacion)
            .input('enfermedad', nombre_plaga_enfermedad)
            .input('insumoUtilizado', insumo_utilizado)
            .input('cantidad', cantidad_insumo)
            .input('costoInsumo', costo_insumo)
            .input('jornales', cantidad_jornales)
            .input('costoJornal', costo_jornal)
            .input('id_usuario', req.user.id)
            .query(`INSERT INTO [dbo].[Enfermedades] (
                [Id Cultivo],
                [Nombre Cultivo],
                [Ubicacion],
                [Nombre Plaga o Enfermedad],
                [Insumo Utilizado],
                [Costo del Insumo],
                [Cantidad de Insumos],
                [Cantidad de Jornales],
                [Costo por Jornal],
                id_usuario
            ) VALUES (
                @idCultivo,
                @nombreCultivo,
                @ubicacion,
                @enfermedad,
                @insumoUtilizado,
                @costoInsumo,
                @cantidad,
                @jornales,
                @costoJornal,
                @id_usuario
            )`);
            req.flash('success', ' registrada con éxito');
       res.redirect('/Enfermedades');
    } catch (error) {
        console.error('Error al registrar enfermedad:', error);
        res.status(500).json({ message: 'Error al registrar enfermedad', error });
    }
};

// controllers/actividadController.js


const prepararTerreno = async (req, res) => {
    try {
        const { 
            fecha_preparacion, 
            actividad, 
            cantidad_insumos, 
            cultivo_trabajado, 
            total_inversion, 
            insumos_utilizados, 
            costo_insumos, 
            jornales, 
            costo_jornal 
        } = req.body;

        // Conversión de tipos y eliminación del prefijo 'Q'
        const parsedCantidadInsumos = parseInt(cantidad_insumos, 10);
        const parsedCostoInsumos = parseFloat(costo_insumos);
        const parsedJornales = parseInt(jornales, 10);
        const parsedCostoJornales = parseFloat(costo_jornal.replace('Q', '').trim());
        const parsedTotalInversion = parseFloat(total_inversion.replace('Q', '').trim());

        const pool = await getConnection();

        const result = await pool.request()
            .input('fecha', fecha_preparacion)
            .input('cultivo_trabajado', cultivo_trabajado)
            .input('actividad', actividad)
            .input('insumos_utilizados', insumos_utilizados)
            .input('cantidadinsumos', parsedCantidadInsumos)
            .input('costo_insumos', parsedCostoInsumos)
            .input('jornales', parsedJornales)
            .input('costo_jornales', parsedCostoJornales)
            .input('totalinversion', parsedTotalInversion)
            .input('id_usuario', req.user.id)
            .query(`INSERT INTO [dbo].[Terrenos] 
                ([Cultivo Trabajado], [Fecha], [Insumos Utilizados], [Cantidad de Insumos], 
                [Costo por Insumo], [Total de Inversion], [jornales], [Costo por Jornal], 
                id_usuario, [Actividad]) 
                VALUES (@cultivo_trabajado, @fecha, @insumos_utilizados, @cantidadinsumos, 
                @costo_insumos, @totalinversion, @jornales, @costo_jornales, @id_usuario, @actividad)`);

        // Usar flash para enviar un mensaje de éxito
        req.flash('success', 'Actividad registrada con éxito');

        // Redirigir a otra página (por ejemplo, la página de actividades)
        res.redirect('/preparacionTerreno');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error al registrar actividad');
        res.redirect('/preparacionTerreno'); // Redirigir en caso de error también
    }
};


const crearProduccion = async (req, res) => {
    try {
        const { id_cultivo,   fecha_produccion, cantidad_jornales, costo_jornal, cantidad_cajas_primera,cantidad_cajas_segunda,cantidad_cajas_tercera, id_usuario } = req.body; // Asegúrate de que id_usuario esté en el cuerpo de la solicitud
       console.log(req.body);
         const pool = await getConnection();
        const cultivoResult = await pool.request()
        .input('idCultivo', id_cultivo)
        .query('SELECT [Cultivo Trabajado] AS cultivo_trabajado  FROM [dbo].[Terrenos] WHERE id = @idCultivo');
        const nombreCultivo = cultivoResult.recordset[0].cultivo_trabajado;
        const result = await pool.request()
            .input('id_cultivo', id_cultivo)
            .input('nombre_cultivo', nombreCultivo)
            .input('fecha', fecha_produccion)
            .input('jornales', cantidad_jornales)
            .input('costo_jornales', costo_jornal)
            .input('cajas_cosechadas1', cantidad_cajas_primera)
            .input('cajas_cosechadas2', cantidad_cajas_segunda)
            .input('cajas_cosechadas3', cantidad_cajas_tercera)
            .input('id_usuario', req.user.id)  // Se agrega la referencia al usuario
            .query(`INSERT INTO [dbo].[Produccion] ([Fecha]
      ,[Id Cultivo]
      ,[Nombre Cultivo]
      ,[Cantidad de Jornales]
      ,[Costo Jornal]
      ,[Cantidad de Cajas Primera Clase]
      ,[Cantidad de Cajas Segunda Clase]
      ,[Cantidad de Cajas Tercera Clase]
      ,id_usuario) 
                    VALUES ( @fecha, @id_cultivo, @nombre_cultivo,  @jornales, @costo_jornales, @cajas_cosechadas1, @cajas_cosechadas2, @cajas_cosechadas3, @id_usuario)`);

       res.redirect('/produccion')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar producción', error });
    }
};
const crearVentas = async (req, res) => {
    try {
        const { id_cultivo, cajas_vendidas, precio_unitario } = req.body;
        console.log(req.body);
        
        const pool = await getConnection();
        
        // Buscar el nombre del cultivo en la base de datos usando el id_cultivo
        const cultivoResult = await pool.request()
            .input('idCultivo', id_cultivo)
            .query('SELECT [Cultivo Trabajado] AS cultivo_trabajado  FROM [dbo].[Terrenos] WHERE id = @idCultivo');
        
        const nombreCultivo = cultivoResult.recordset[0].cultivo_trabajado;
        
        const result = await pool.request()
            .input('IdCultivo', id_cultivo)
            .input('NombreCultivo', nombreCultivo)
            .input('Ubicacion', req.body.ubicacion)
            .input('CajasVendidas', cajas_vendidas)
            .input('PrecioUnitario', precio_unitario)
            .input('id_usuario', req.user.id)
            .input('TotalVenta',(cajas_vendidas*precio_unitario))
            .query(`INSERT INTO [dbo].[Ventas] (idCultivo,NombreCultivo, Ubicacion, CajasVendidas, PrecioUnitario,TotalVenta, id_usuario) 
                    VALUES (@idCultivo, @NombreCultivo, @Ubicacion, @CajasVendidas, @PrecioUnitario,@TotalVenta,@id_usuario)`);
        
        // Almacenar el mensaje flash y redirigir
        req.flash('success', 'Venta registrada con éxito', result);
        res.redirect('/venta');
        
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al registrar venta');
        res.redirect('/venta');  // También redirige en caso de error
    }
};



module.exports={
    agregarPost,
    agregarPost,
    agregarRespuesta,
    crearPost,
    leerForos,
    leerPublicaciones,
    leertablas,
    leerpubs,
    crearActividad, 
    crearSiembra, 
    crearFertilizacion, 
    crearEnfermedad,
    prepararTerreno,
    crearProduccion,
    crearVentas,
}