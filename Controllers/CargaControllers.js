const { leerPublicaciones } = require("./HomeControllers")
const { getConnection } = require('../db/sqlMongoose');
const cargaInformacionCultivo=(req, res)=>{
res.render('informacionCultivo')
}

const preparacionTerreno=(req, res)=>{
res.render('preparacionTerreno',{user:req.user})
}

// Controlador para cargar la vista de siembra con cultivos
const siembra = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id, cultivo_trabajado FROM Terrenos'); // Asegúrate de que el nombre de la columna sea el correcto
        console.log(result.recordset);
        // Renderiza la vista de siembra y pasa los cultivos
        res.render('siembra', { cultivos: result.recordset, user:req.user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cultivos', error });
    }
};

// Controlador para cargar la vista de fertilización con cultivos
const fertilizacion = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id, cultivo_trabajado FROM Terrenos');
        console.log(result.recordset);
        // Renderiza la vista de fertilización y pasa los cultivos
        res.render('fertilizacion', { cultivos: result.recordset,user:req.user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cultivos', error });
    }
};

// Controlador para cargar la vista de enfermedades con cultivos
const enfermedades = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id, cultivo_trabajado FROM Terrenos');
        console.log(result.recordset);
        // Renderiza la vista de enfermedades y pasa los cultivos
        res.render('enfermedades', { cultivos: result.recordset,user:req.user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cultivos', error });
    }
};

// Controlador para cargar la vista de producción con cultivos
const produccion = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id, cultivo_trabajado FROM Terrenos');
        console.log(result.recordset);
        // Renderiza la vista de producción y pasa los cultivos
        res.render('produccion', { cultivos: result.recordset,user:req.user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cultivos', error });
    }
};
const venta = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id, cultivo_trabajado FROM Terrenos'); // Asegúrate de que el nombre de la columna sea el correcto
        console.log(result.recordset)
        // Renderiza la vista de ventas y pasa los cultivos
        res.render('venta', { cultivos: result.recordset ,user:req.user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cultivos', error });
    }
};

const cargalogin=(req,res)=>{
    res.render('login',{messages: req.flash('success'),user:req.user })
}
const cargarRegister=(req,res)=>{
    res.render('register',{messages: req.flash('success'),user:req.user })
}
const cargahome=(req,res)=>{
    res.render('home',{user:req.user} )
}
const cargarForos=(req,res)=>{
    res.render('foros',console.log(req.user),{messages: req.flash('success'),user:req.user })
}
const cargarCultivos=(req,res)=>{
    res.render('cosechaCultivos',{messages: req.flash('success'),user:req.user })
}

const cargarAgregarCulti=(req,res)=>{
    res.render('agregarCultivos',{messages: req.flash('success'),user:req.user })
}
const cargarActividades= async (req,res)=>{
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id, cultivo_trabajado FROM Terrenos'); // Asegúrate de que el nombre de la columna sea el correcto
        console.log(result.recordset)
        // Renderiza la vista de ventas y pasa los cultivos
        res.render('Actividades', { cultivos: result.recordset ,messages: req.flash('success')});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cultivos', error });
    }
   
}

const cargarResetPasword=(req,res)=>{
    res.render('reset-password',{messages: req.flash('success') })
}
const cargaformularioCosechas= async(req,res)=>{
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id, cultivo_trabajado FROM Terrenos'); // Asegúrate de que el nombre de la columna sea el correcto
        console.log(result.recordset)
        // Renderiza la vista de ventas y pasa los cultivos
        res.render('cosechaCultivo', { cultivos: result.recordset ,messages: req.flash('success'),user:req.user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cultivos', error });
    }
   
}
const cargarFormularioCultivos=async(req,res)=>{
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id, cultivo_trabajado FROM Terrenos'); // Asegúrate de que el nombre de la columna sea el correcto
        console.log(result.recordset)
        // Renderiza la vista de ventas y pasa los cultivos
        res.render('agregarCultivo', { cultivos: result.recordset ,messages: req.flash('success'),user:req.user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cultivos', error });
    }
   
}
module.exports={
    cargaInformacionCultivo,
    preparacionTerreno,
    siembra,
    fertilizacion,
    enfermedades,
    produccion,
    venta,
    cargalogin,
    cargahome,
    cargarForos,
    cargarCultivos,
    cargarAgregarCulti,
    cargarResetPasword,
    cargarRegister,
    cargarActividades,
    cargarFormularioCultivos,
    cargaformularioCosechas,
}