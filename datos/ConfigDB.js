import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  Tipo: String,
  IDchat: Number,
  Id_chatbot: Number,
  pedido:String,
  UltimaActualizacion:Date,
  conversationMessages: [{ role: String, content: String , fecha:String}],
  ThreadId1: String,
  ThreadId2: String,
  Consumo: Number,
  AntiSpam: {
    ArbitrajeAntiMalUso: String,
    ArbitrajeIA: String,
    FalloEnRespuestaIA: String
  },
  datos: {
    BuscadoProductosActivo:String,
    nota:String,
    interruptor:String,
    pausa:String,
    tipo: String,
    direccion: String,
    Franja:String,
    numero: String,
    nombre: String,
    correo: String,
    Npedido:String,
  }
});

// Crear el modelo a partir del esquema
export const Chats = mongoose.model('Chats', chatSchema);

const BaseClientesSchema = new Schema({
  userActivo:Boolean,
  NameUser:String,
  PanelControlNumber:String,
  NewPssNumber:String,
  PssTemporal:String,
  Tipo:String,
  Webhook: String,
  TokenWH: String,
  TokenWP: String,
  Id_chatbot: String,
  TiempoEspera: Number,
  TKAsistente: String,
  TKopenIA:String,
  limiteConsumo:Number,
  correoCliente:String,
  BuscadoProductosActivo:Boolean,
  ParametrosDeteccion:[String],
  retornarParametros:Boolean,
  ubicacionMultimedia:String,
  Productos: [{
    CATEGORIA: String,
    PRODUCTO: String,
    CANTIDAD: String,
    TARJETA: String,
    EFECTIVO: String
  }],
  Bloque:[{
    tipoMensaje:String,
    mensajeCuerpo:String,
    mensajeOpciones:[{
      id:String,
      title:String
    }],
    MensajeInicial: Boolean,
    MensajeInicialContenido: String,
    texto:String,
    pausa:String,
    pausaSave:String,
    funcionUtilizada:Number,
    almacenamiento:Boolean,
    tipoAlmacenamieto:String,
    datoAlmacenado:String,
    return:Boolean,
    consultaInternaIA:String,

  }],
  LimiteBusqueda: String,
  ContraseñaUsuario: String,
  consultaInternaIA:String

});

// Crear el modelo para la nueva base de datos
export const BaseClientes = mongoose.model('BaseClientes', BaseClientesSchema);



const ConexionesAbiertasSchema = new Schema({
  Conexiones:String,
  Id_chatbot: String,

});

// Crear el modelo para la nueva base de datos
export const ConexionesAbiertas  = mongoose.model('ConexionesAbiertas', ConexionesAbiertasSchema);




