const jwt = require('jsonwebtoken');

// Middleware para hacer que los datos del usuario estén disponibles en las vistas

// Middleware para verificar el token y extraer el usuario
// Middleware para verificar el token y pasar los datos del usuario a req.user
const VerificarUser = (req, res, next) => {
    const token = req.cookies.token; // Tomar el token de la cookie
    
    if (!token) {
        return res.status(403).json({ mensaje: "Token no proporcionado" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '52D5FA11-9E49-49D4-A0FD-394E0D0FE98E');
        req.user = decoded; // Asignar los datos decodificados a `req.user`
        console.log(user.userName, user.id)
        next();
    } catch (err) {
        console.log("Token inválido o expirado:", err.message);
        return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }
};

module.exports={
    VerificarUser
}