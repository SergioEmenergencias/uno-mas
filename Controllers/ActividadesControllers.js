const { getConnection } = require('../db/sqlMongoose');
const fs = require('fs');
const path = require('path'); 
const sql=require('mssql')
const publicAgricultores = async (req, res) => {
    const { actividad1, actividad2, actividad3, actividad4 } = req.body;

    if (!actividad1 || !actividad2 || !actividad3 || !actividad4) {
        return res.status(400).send("Todas las actividades son obligatorias");
    }

    try {
        const pool = await getConnection(); // Asegúrate de obtener la conexión correctamente
        
        // Realizar la consulta para insertar las actividades junto con el username del usuario autenticado
        const result = await pool.request()
            .input('actividad1', sql.VarChar(255), actividad1)
            .input('actividad2', sql.VarChar(255), actividad2)
            .input('actividad3', sql.VarChar(255), actividad3)
            .input('actividad4', sql.VarChar(255), actividad4)
            .input('username', sql.VarChar(50), req.user.username) // Suponiendo que req.user.username contiene el username
            .query(`
                INSERT INTO actividades (actividad1, actividad2, actividad3, actividad4, username)
                VALUES (@actividad1, @actividad2, @actividad3, @actividad4, @username)
            `);

        // Verificar si la inserción fue exitosa
        if (result.rowsAffected[0] === 0) {
            return res.status(500).json({ message: "Error al crear las actividades" });
        }

        // Redirigir a la página 'agricultores' si todo fue correcto
        res.redirect('/agricultores'); // Cambié la ruta, considerando que es una página de tu aplicación

    } catch (error) {
        console.error("Error en la inserción de actividades:", error);
        res.status(500).json({ message: "Error interno del servidor al crear las actividades" });
    }
};
// Inserción de una nueva cosecha
async function insertarCosecha(req, res) {
    const { fecha_hora, id_cultivo, cajas_primera, cajas_segunda, cajas_tercera, encargado, cliente, total_quetzales, id_usuario } = req.body;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('fecha_hora', sql.DateTime, fecha_hora)
            .input('id_cultivo', sql.VarChar(50), id_cultivo)
            .input('cajas_primera', sql.Int, cajas_primera)
            .input('cajas_segunda', sql.Int, cajas_segunda)
            .input('cajas_tercera', sql.Int, cajas_tercera)
            .input('encargado', sql.VarChar(100), encargado)
            .input('cliente', sql.VarChar(100), cliente)
            .input('total_quetzales', sql.Decimal(10, 2), total_quetzales)
            .input('id_usuario', sql.VarChar(50), req.user.id)
            .query(`
                INSERT INTO Cosechas (fecha_hora, id_cultivo, cajas_primera, cajas_segunda, cajas_tercera, encargado, cliente, total_quetzales, id_usuario)
                VALUES (@fecha_hora, @id_cultivo, @cajas_primera, @cajas_segunda, @cajas_tercera, @encargado, @cliente, @total_quetzales, @id_usuario)
            `);
            console.log(result,"insercion con exito")
        //res.status(201).json({ message: "Cosecha insertada con éxito", result });
        res.redirect('/misCosechas')
    } catch (error) {
        console.error("Error al insertar cosecha:", error);
        res.status(500).json({ message: "Error al insertar cosecha", error });
    }
}

// Consulta de todas las cosechas filtradas por el id del usuario
async function obtenerCosechas(req, res) {
    try {
        const pool = await getConnection(); // Obtén la conexión de SQL Server
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ message: "Falta el ID del usuario" });
        }

        const result = await pool.request()
            .input('usuarioId', sql.VarChar(50), userId)  
            .query(`SELECT * FROM Cosechas WHERE id_usuario = @usuarioId`);

        // Obtenemos los nombres de las columnas y los datos de las cosechas
        const columnNames = Object.keys(result.recordset[0] || {});
        const rows = result.recordset;

        // Renderizamos la vista pasando las columnas y los datos
        res.render('TablasCosechas', { columnNames, rows, titulo: 'Cosechas' });
    } catch (error) {
        console.error("Error al obtener cosechas:", error);
        res.status(500).json({ message: "Error al obtener cosechas", error });
    }
}


// Inserción de una nueva plantación en MongoDB
async function insertarCultivo(req, res) {
    const {
        id_cultivo,
        tipo_cultivo,
        variedad,
        extension_cultivada,
        tipo_infraestructura,
        fecha_siembra,
        edad_cultivo,
        enfermedades,
        cajas_producidas
    } = req.body;

    // Validación básica de que todos los campos obligatorios estén presentes
    if (!id_cultivo || !tipo_cultivo || !variedad || !extension_cultivada || !tipo_infraestructura || !fecha_siembra || !edad_cultivo || !cajas_producidas) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    try {
        const pool = await getConnection(); // Obtén la conexión de SQL Server

        // Inserta el nuevo cultivo en SQL Server
        const result = await pool.request()
            .input('id_cultivo', sql.VarChar(255), id_cultivo)
            .input('tipo_cultivo', sql.VarChar(255), tipo_cultivo)
            .input('variedad', sql.VarChar(255), variedad)
            .input('extension_cultivada', sql.Decimal(10, 2), extension_cultivada)
            .input('tipo_infraestructura', sql.VarChar(255), tipo_infraestructura)
            .input('fecha_siembra', sql.Date, fecha_siembra)
            .input('edad_cultivo', sql.Decimal(4, 1), edad_cultivo) // Edad en años con decimales
            .input('enfermedades', sql.VarChar(255), enfermedades || null) // Enfermedades opcional
            .input('cajas_producidas', sql.Int, cajas_producidas)
            .input('id_usuario', sql.VarChar(50), req.user.id) // Asegúrate de que req.user.id esté disponible (para obtener el ID del usuario autenticado)
            .query(`
                INSERT INTO Cultivos (id_cultivo, tipo_cultivo, variedad, extension_cultivada, tipo_infraestructura, fecha_siembra, edad_cultivo, enfermedades, cajas_producidas, id_usuario)
                VALUES (@id_cultivo, @tipo_cultivo, @variedad, @extension_cultivada, @tipo_infraestructura, @fecha_siembra, @edad_cultivo, @enfermedades, @cajas_producidas, @id_usuario)
            `);

        // Verificar si la inserción fue exitosa
        if (result.rowsAffected[0] === 0) {
            return res.status(500).json({ message: "Error al insertar el cultivo" });
        }

        // Responder con éxito
        res.status(201).json({ message: "Cultivo insertado con éxito" });

    } catch (error) {
        console.error("Error al insertar el cultivo:", error);
        res.status(500).json({ message: "Error al insertar el cultivo", error });
    }
}
async function obtenerPlantaciones(req, res) {
    try {
        const pool = await getConnection(); // Obtén la conexión de SQL Server
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ message: "Falta el ID del usuario" });
        }

        const result = await pool.request()
            .input('usuarioId', sql.VarChar(50), userId)  
            .query(`SELECT * FROM Cultivos WHERE id_usuario = @usuarioId`);

        // Obtenemos los nombres de las columnas y los datos de las plantaciones
        const columnNames = Object.keys(result.recordset[0] || {});
        const rows = result.recordset;

        // Renderizamos la vista pasando las columnas y los datos
        res.render('TablasCultivos', { columnNames, rows, titulo: 'Cultivos' });
    } catch (error) {
        console.error("Error al obtener plantaciones:", error);
        res.status(500).json({ message: "Error al obtener las plantaciones", error });
    }
}

async function obtenerTodasTablas(req, res) {
    try {
        const pool = await getConnection(); // Obtener la conexión de SQL Server
        const userId = req.user.id; // Asumimos que el ID del usuario está en req.user
        console.log("ID de usuario:", userId);

        if (!userId) {
            return res.status(400).json({ message: "Falta el ID del usuario" });
        }

        // Obtener Terrenos
        const resultTerrenos = await pool.request()
            .input('usuarioId', sql.VarChar(50), userId)
            .query(`SELECT id, [Cultivo Trabajado], Fecha, [Insumos Utilizados], [Cantidad de Insumos], 
                    [Costo por Insumo], [Total de Inversion], jornales, [Costo por Jornal], Actividad 
                    FROM Terrenos WHERE id_usuario = @usuarioId`);
            
        const rowsTerrenos = resultTerrenos.recordset.map((row, index) => ({
            índice: index + 1,
            ...row
        }));

        // Obtener Producción
        const resultProduccion = await pool.request()
            .input('usuarioId', sql.VarChar(50), userId)
            .query(`SELECT [Id Produccion], Fecha, [Id Cultivo], [Nombre Cultivo], [Cantidad de Jornales], 
                    [Costo Jornal], [Cantidad de Cajas Primera Clase], [Cantidad de Cajas Segunda Clase], 
                    [Cantidad de Cajas Tercera Clase] 
                    FROM Produccion WHERE id_usuario = @usuarioId`);
        
        const rowsProduccion = resultProduccion.recordset.map((row, index) => ({
            índice: index + 1,
            ...row
        }));

        // Obtener Fertilización
        const resultFertilizacion = await pool.request()
            .input('usuarioId', sql.VarChar(50), userId)
            .query(`SELECT [No Fertilizacion], [Fecha Fertilizacion], [Tipo de Fertilizacion], 
                    [Codigo de Cultivo], [Nombre Cultivo], [Quimico Utilizado], [Costo Quimico], 
                    [Cantidad de quimico utilizado], [Cantidad de Jornales], [Costo por Jornal] 
                    FROM Fertilizacion WHERE id_usuario = @usuarioId`);
    
        const rowsFertilizacion = resultFertilizacion.recordset.map((row, index) => ({
            índice: index + 1,
            ...row
        }));

        // Obtener Siembra
        const resultSiembra = await pool.request()
            .input('usuarioId', sql.VarChar(50), userId)
            .query(`SELECT [id siembra], [Fecha Siembra], [Id Cultivo], [Nombre Cultivo], 
                    [Cantidad de Pilones], [Costo por Pilón], [Cantidad de Jornales], [Costo por Jornal] 
                    FROM Siembra WHERE id_usuario = @usuarioId`);
    
        const rowsSiembra = resultSiembra.recordset.map((row, index) => ({
            índice: index + 1,
            ...row
        }));

        // Obtener Enfermedades
        const resultEnfermedades = await pool.request()
            .input('usuarioId', sql.VarChar(50), userId)
            .query(`SELECT [id tratamiento], [Id Cultivo], [Nombre Cultivo], Ubicacion, 
                    [Nombre Plaga o Enfermedad], [Insumo Utilizado], [Costo del Insumo], [Cantidad de Insumos], 
                    [Cantidad de Jornales], [Costo por Jornal] 
                    FROM Enfermedades WHERE id_usuario = @usuarioId`);
    
        const rowsEnfermedades = resultEnfermedades.recordset.map((row, index) => ({
            índice: index + 1,
            ...row
        }));

        // Obtener Ventas
        const resultVentas = await pool.request()
            .input('usuarioId', sql.VarChar(50), userId)
            .query(`SELECT [IdVenta], [IdCultivo], [NombreCultivo], Ubicacion, CajasVendidas, 
                    PrecioUnitario, TotalVenta 
                    FROM Ventas WHERE id_usuario = @usuarioId`);
    
        const rowsVentas = resultVentas.recordset.map((row, index) => ({
            índice: index + 1,
            ...row
        }));

        // Renderizamos la vista con los datos de las tablas
        res.render('Tablas', {
            columnNamesTerrenos: ["índice", ...Object.keys(resultTerrenos.recordset[0] || {})],
            rowsTerrenos,
            columnNamesProduccion: ["índice", ...Object.keys(resultProduccion.recordset[0] || {})],
            rowsProduccion,
            columnNamesFertilizacion: ["índice", ...Object.keys(resultFertilizacion.recordset[0] || {})],
            rowsFertilizacion,
            columnNamesSiembra: ["índice", ...Object.keys(resultSiembra.recordset[0] || {})],
            rowsSiembra,
            columnNamesEnfermedades: ["índice", ...Object.keys(resultEnfermedades.recordset[0] || {})],
            rowsEnfermedades,
            columnNamesVentas: ["índice", ...Object.keys(resultVentas.recordset[0] || {})],
            rowsVentas,
        });
    } catch (error) {
        console.error("Error al obtener las tablas:", error);
        res.status(500).json({ message: "Error al obtener las tablas", error });
    }
}

async function obtenerDatosTerrenos(pool, userId) {
    const result = await pool.request()
        .input('usuarioId', sql.VarChar(50), userId)
        .query(`SELECT  [Cultivo Trabajado], Fecha, [Insumos Utilizados], [Cantidad de Insumos], 
                [Costo por Insumo], [Total de Inversion], jornales, [Costo por Jornal], Actividad 
                FROM Terrenos WHERE id_usuario = @usuarioId`);
    return result.recordset.map((row, index) => ({
        índice: index + 1,
        ...row
    }));
}

async function obtenerDatosProduccion(pool, userId) {
    const result = await pool.request()
        .input('usuarioId', sql.VarChar(50), userId)
        .query(`SELECT  Fecha,  [Nombre Cultivo], [Cantidad de Jornales], 
                [Costo Jornal], [Cantidad de Cajas Primera Clase], [Cantidad de Cajas Segunda Clase], 
                [Cantidad de Cajas Tercera Clase] 
                FROM Produccion WHERE id_usuario = @usuarioId`);
    return result.recordset.map((row, index) => ({
        índice: index + 1,
        ...row
    }));
}

async function obtenerDatosFertilizacion(pool, userId) {
    const result = await pool.request()
        .input('usuarioId', sql.VarChar(50), userId)
        .query(`SELECT  [Fecha Fertilizacion], [Tipo de Fertilizacion], 
                 [Nombre Cultivo], [Quimico Utilizado], [Costo Quimico], 
                [Cantidad de quimico utilizado], [Cantidad de Jornales], [Costo por Jornal] 
                FROM Fertilizacion WHERE id_usuario = @usuarioId`);
    return result.recordset.map((row, index) => ({
        índice: index + 1,
        ...row
    }));
}

async function obtenerDatosSiembra(pool, userId) {
    const result = await pool.request()
        .input('usuarioId', sql.VarChar(50), userId)
        .query(`SELECT  [Fecha Siembra],  [Nombre Cultivo], 
                [Cantidad de Pilones], [Costo por Pilón], [Cantidad de Jornales], [Costo por Jornal] 
                FROM Siembra WHERE id_usuario = @usuarioId`);
    return result.recordset.map((row, index) => ({
        índice: index + 1,
        ...row
    }));
}

async function obtenerDatosEnfermedades(pool, userId) {
    const result = await pool.request()
        .input('usuarioId', sql.VarChar(50), userId)
        .query(`SELECT   [Nombre Cultivo], Ubicacion, 
                [Nombre Plaga o Enfermedad], [Insumo Utilizado], [Costo del Insumo], [Cantidad de Insumos], 
                [Cantidad de Jornales], [Costo por Jornal] 
                FROM Enfermedades WHERE id_usuario = @usuarioId`);
    return result.recordset.map((row, index) => ({
        índice: index + 1,
        ...row
    }));
}

async function obtenerDatosVentas(pool, userId) {
    const result = await pool.request()
        .input('usuarioId', sql.VarChar(50), userId)
        .query(`SELECT  [NombreCultivo], Ubicacion, CajasVendidas, 
                PrecioUnitario, TotalVenta 
                FROM Ventas WHERE id_usuario = @usuarioId`);
    return result.recordset.map((row, index) => ({
        índice: index + 1,
        ...row
    }));
}
async function descargarInforme(req, res) {
    try {
        console.log("Iniciando descarga del informe...");
        const userId = req.user.id; // Asumimos que el ID del usuario está en req.user
        const pool = await getConnection();

        if (!userId) {
            console.error("ID de usuario no proporcionado.");
            return res.status(400).json({ message: "Falta el ID del usuario" });
        }

        console.log("Obteniendo datos de todas las tablas para el informe...");
        const [rowsTerrenos, rowsProduccion, rowsFertilizacion, rowsSiembra, rowsEnfermedades, rowsVentas] = await Promise.all([
            obtenerDatosTerrenos(pool, userId),
            obtenerDatosProduccion(pool, userId),
            obtenerDatosFertilizacion(pool, userId),
            obtenerDatosSiembra(pool, userId),
            obtenerDatosEnfermedades(pool, userId),
            obtenerDatosVentas(pool, userId),
        ]);

        console.log("Datos obtenidos para todas las tablas.");

        const tablasDatos = [
            { titulo: 'Terrenos', rows: rowsTerrenos },
            { titulo: 'Producción', rows: rowsProduccion },
            { titulo: 'Fertilización', rows: rowsFertilizacion },
            { titulo: 'Siembra', rows: rowsSiembra },
            { titulo: 'Enfermedades', rows: rowsEnfermedades },
            { titulo: 'Ventas', rows: rowsVentas },
        ].filter(tabla => tabla.rows.length > 0); // Filtrar tablas vacías

        if (tablasDatos.length === 0) {
            console.error("No se encontraron datos para el informe.");
            return res.status(400).json({ message: "No se encontraron datos para el informe" });
        }

        console.log("Generando PDF del informe...");

        // Llama a la función para generar el PDF
        const filePath = await generarInformePdf(userId, tablasDatos);

        // Envía el PDF como respuesta
        res.download(filePath, (err) => {
            if (err) {
                console.error("Error al enviar el archivo PDF:", err);
                res.status(500).json({ message: "Error al descargar el informe PDF" });
            }
        });

    } catch (error) {
        console.error("Error al generar el informe PDF:", error);
        res.status(500).json({ message: "Error interno al generar el informe PDF" });
    }
}



async function generarInformePdf(userId, tablasDatos) {
    console.log("Iniciando generación del informe PDF...");
    return new Promise((resolve, reject) => {
        const informesDir = path.join(__dirname, 'informes');

        if (!fs.existsSync(informesDir)) {
            fs.mkdirSync(informesDir, { recursive: true });
            console.log("Carpeta 'informes' creada.");
        }

        const doc = new PDFDocument();
        const filePath = path.join(informesDir, `informe_${userId}.pdf`);
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Añadir título del informe
        doc.fontSize(20).text(`Informe de Usuario ${userId}`, { align: 'center' }).moveDown(2);

        tablasDatos.forEach((tabla, index) => {
            if (index > 0) {
                doc.addPage();  // Nueva página para cada tabla
            }

            // Título de la tabla
            doc.fontSize(16).text(tabla.titulo, { underline: true }).moveDown(0.5);

            const headers = Object.keys(tabla.rows[0] || {});
            const columnWidth = (doc.page.width - 80) / headers.length;
            const rowHeight = 70; // Altura de cada fila (aprox. 2.5 cm)
            let startX = 40;
            let startY = doc.y;

            // Dibujar encabezados de la tabla con fondo
            headers.forEach((header, i) => {
                // Fondo de encabezado
                doc.rect(startX + i * columnWidth, startY, columnWidth, rowHeight).fillAndStroke('#e0e0e0', 'black');
                doc.fillColor('black').fontSize(12).text(header, startX + i * columnWidth, startY + 7, { width: columnWidth, align: 'center' });
            });

            // Espacio debajo de los encabezados
            startY += rowHeight;

            // Dibujar filas de la tabla con bordes
            tabla.rows.forEach(row => {
                headers.forEach((header, i) => {
                    let value = row[header] !== undefined ? String(row[header]) : '';

                    if (/fecha/i.test(header) && Date.parse(value)) {
                        const fecha = new Date(value);
                        value = format(fecha, 'dd/MM/yyyy HH:mm:ss');
                    }

                    // Dibuja el borde y coloca el texto en la celda
                    doc.rect(startX + i * columnWidth, startY, columnWidth, rowHeight).stroke();
                    doc.text(value, startX + i * columnWidth + 5, startY + 7, { width: columnWidth - 10, align: 'center' });
                });

                startY += rowHeight; // Espacio entre filas
            });

            // Mover hacia abajo después de cada tabla para espacio adicional
            doc.moveDown(2);
        });

        doc.end();

        writeStream.on('finish', () => {
            console.log("Informe PDF generado exitosamente.");
            resolve(filePath);
        });

        writeStream.on('error', (err) => {
            console.error("Error al escribir el informe PDF:", err);
            reject(err);
        });
    });
}
module.exports = {
    insertarCultivo,
    obtenerPlantaciones,
    insertarCosecha,
    obtenerCosechas,
    publicAgricultores,
    obtenerTodasTablas,
    descargarInforme,
};
