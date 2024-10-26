const mongoose = require('mongoose');
const { Schema } = mongoose;

const publicSchema = Schema({
  name: {
    type: String,
    required: true,
    // Add validation rules if needed (e.g., regular expressions)
  },
  Imagen: [{
    type: String,
    required: true
  }],
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true // Create an index on the user field for faster querying
  },
  telefono:{
    type:String,
    ref:"User",
    required:true,
  }
});

const Publics=mongoose.model('publicSchema',publicSchema)

module.exports=Publics;
