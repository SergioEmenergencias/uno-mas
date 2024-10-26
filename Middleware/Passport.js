const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../Models/User'); // El modelo para MongoDB
const pool = require('../db/sqlMongoose');    // La configuración de MySQL

// Función para buscar usuarios en ambas bases de datos
const findUser = async (emailOrUsername) => {
    let user = null;

    // Verificar si el valor proporcionado es un email
    if (emailOrUsername.includes('@')) {
        // Buscar en MongoDB
        user = await User.findOne({ userName: emailOrUsername });
        if (user) {
            return { user, source: 'mongo' }; // Indica que se encontró en MongoDB
        }
    } else {
        // Buscar en MySQL
        const [results] = await pool.query("SELECT * FROM usuarios WHERE username = ?", [emailOrUsername]);
        if (results.length > 0) {
            // Convertir a objeto de usuario
            user = {
                id: results[0].id,
                username: results[0].username,
                email: results[0].email,
                password: results[0].passwords // Para la comparación de contraseña
            };
            return { user, source: 'mysql' }; // Indica que se encontró en MySQL
        }
    }

    return null; // No se encontró el usuario
};

passport.use(new LocalStrategy({
    usernameField: 'emailOrUsername', // Campo que usaremos para recibir email o username
    passwordField: 'password'
}, async (emailOrUsername, password, done) => {
    try {
        const foundUser = await findUser(emailOrUsername);

        // Si no se encontró el usuario
        if (!foundUser) {
            return done(null, false, { message: 'Credenciales inválidas' });
        }

        // Comprobar la contraseña dependiendo de la fuente
        const { user, source } = foundUser;
        let isMatch;

        // Verifica la contraseña según la base de datos de origen
        if (source === 'mongo') {
            isMatch = await bcrypt.compare(password, user.password);
        } else if (source === 'mysql') {
            isMatch = await bcrypt.compare(password, user.password);
        }

        // Si la contraseña no coincide
        if (!isMatch) {
            return done(null, false, { message: 'Contraseña incorrecta' });
        }

        // Si la autenticación es exitosa
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Serializar usuario en la sesión
passport.serializeUser((user, done) => {
    done(null, user.id); // Serializa el ID del usuario
});

// Deserializar usuario desde la sesión
passport.deserializeUser(async (id, done) => {
    try {
        // Intentar buscar en MongoDB
        let user = await User.findById(id); // Asegúrate de que aquí estés usando el ID correcto
        if (user) {
            return done(null, user);
        }

        // Si no está en MongoDB, intentar buscar en MySQL
        const [results] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [user.id]); // Asegúrate de que estés usando la clave correcta
        if (results.length === 0) {
            return done(new Error('Usuario no encontrado en ninguna base de datos'));
        }

        const mysqlUser = results[0];
        return done(null, {
            id: mysqlUser.id,
            username: mysqlUser.username,
            email: mysqlUser.email
        });
    } catch (error) {
        return done(error);
    }
});

module.exports = passport;
