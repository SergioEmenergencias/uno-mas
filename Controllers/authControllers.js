const User= require('../Models/User.js')
const sql= require('mssql')
const {mssql, getConnection}=require("../db/sqlMongoose.js")
const bcrypt= require("bcryptjs");
const jwt = require("jsonwebtoken");


const sesiones = async (req, res) => {
       const { userName, password } = req.body;
    try {
        const user = await User.findOne({ userName });
        if (!user) throw new Error('No existe este usuario');
        if (!(await user.comparePassword(password))) throw new Error('Contraseña incorrecta');

        req.login(user, function (err) {
            if (err) throw new Error("Error al crear la sesión");
            req.flash('success', 'Inicio de sesión exitoso');
            return res.redirect('/principal'); // Redirige a la ruta de alertas
        });
    } catch (error) {
        console.log(error)
        return res.redirect("/auth/");
    }
};



const insertarUsuarios = async (req, res) => {
    const { userName, email, telefono, password } = req.body;

    try {
        // Verificar si el usuario ya existe en MongoDB
        let mongoUser = await User.findOne({ email });
        if (mongoUser) throw new Error("Usuario existente en MongoDB 😒🤷‍♀️");

        // Obtener la conexión de SQL Server
        const pool = await getConnection();

        // Verificar si el usuario ya existe en SQL Server
        const result = await pool.request()
            .input('userName', sql.VarChar, userName)
            .query("SELECT * FROM usuarios WHERE username = @userName");

        if (result.recordset.length > 0) throw new Error("Usuario existente en SQL Server 😒🤷‍♀️");

        // Hashear la contraseña antes de usarla para ambas bases de datos
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear nuevo usuario en MongoDB
        let user = new User({ userName, email, telefono, password: hashedPassword });
        const savedUser = await user.save();  // Guardar el usuario en MongoDB y obtener el objeto con el _id
        console.log('Usuario registrado en MongoDB');

        // Insertar el usuario en SQL Server con el ID de MongoDB
        const insertResult = await pool.request()
            .input('mongoId', sql.VarChar, savedUser._id.toString()) // Convertir el ObjectId a string
            .input('userName', sql.VarChar, userName)
            .input('Passwords', sql.VarChar, hashedPassword) // Usa el mismo hash
            .query("INSERT INTO usuarios (id_usuario, userName, Passwords) VALUES (@mongoId, @userName, @Passwords)");

        if (insertResult.rowsAffected[0] === 0) {
            throw new Error("Error al crear usuario en SQL Server");
        }
        console.log('Usuario registrado en SQL Server con ID de MongoDB');

        // Redirigir a la página de login si todo fue exitoso
        return res.redirect('/auth/');
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};


const cerrarsesion = (req, res) => {
    req.logout(function (err) {
        if (err) {
            req.flash('error', "Error al cerrar sesión"); // Mensaje flash de error
            return res.redirect('/auth/');
        }
        // Elimina la cookie que almacena el token
        res.clearCookie('secret-name-yolo');

        req.flash('success', 'Sesión cerrada exitosamente'); // Mensaje flash de éxito
        return res.render('login',{ messages: req.flash('success')});
    });
};

module.exports = {
    sesiones,
    insertarUsuarios,
    cerrarsesion
};
