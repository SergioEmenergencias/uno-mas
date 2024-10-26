const mongoose = require("mongoose");
const { Schema } = mongoose;

const respuestaSchema = new Schema({
    texto: {
        type: String,
        required: true
    },
    usuario: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

const foroSchema = new Schema({
    pregunta: {
        type: String,
        required: true
    },
    contexto: {
        type: String,
        required: true
    },
    usuario: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    respuestas: [respuestaSchema]  // Array de respuestas
});

const Foros = mongoose.model("Foros", foroSchema);
module.exports = Foros;
