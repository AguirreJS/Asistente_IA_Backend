import { Console } from 'console';
import { createThread,  addMessageToThread, runAssistantAndGetResponse  } from '../IA/API_openIA.js';
import { Chats , BaseClientes } from './ConfigDB.js'
import moment from 'moment-timezone';
export let messageBuffer = {};
export let timer = {};
import { keywordInterceptor } from '../PedidosFinalizados/Procesarpedidolisto.js';
import { ActualizarAConexiones } from '../Frontend/Api_Front/Socket.js';
import { ManipuadorDeContinuidad } from '../PedidosFinalizados/ManipuladordeEstado.js';
import { title } from 'process';






  const TiempoEjecucionRespuesta = 1000;


/// Proceso que se encarga de buscar si el usuario existe y si escribio alguna ves


export async function procesarMensajes(chatId , Id_chatbot) {

  let mensajesUnificados = messageBuffer[chatId].join(' ');

  await buscarYAlmacenar(chatId, "user", mensajesUnificados , Id_chatbot)

  const cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot });
  
  const ASSISTANT = cliente.TKAsistente;

  let Ban= await Chats.findOne({
    $and: [
      { IDchat: chatId }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
      { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
    ]
  });


  if ( await ManipuadorDeContinuidad(Ban , cliente , mensajesUnificados , Id_chatbot) == true) {





messageBuffer[chatId] = [];
delete timer[chatId];
  //MensajeBaneo(chatId) Desactualizado version Telegram

} else { 


  const valor = await buscarValor(chatId , Id_chatbot); // Reemplaza buscarValor por la función correcta que devuelve "New" o un valor existente


  if (valor === "New") {

    await buscarYAlmacenar(chatId, "user", mensajesUnificados , Id_chatbot)
   
    let Inicial = await keywordInterceptor( "inicial", chatId , cliente.Tipo , cliente.Id_chatbot);


if(Inicial == false)  /// Antes de comunicarse con la IA puede enviarse un mensaje inicial
   
    { createThread(chatId, mensajesUnificados , ASSISTANT , "1");   }
   
    else if ( Inicial == true) {    createThread(chatId, mensajesUnificados , ASSISTANT , "2");}  

  } else {
  
 

    if( await  keywordInterceptor( mensajesUnificados , chatId , cliente.Tipo , cliente.Id_chatbot ) == false )
          
          { await procesarYalmacenar(chatId, mensajesUnificados , ASSISTANT );} 
              
  }

  messageBuffer[chatId] = [];
  delete timer[chatId];
}

}



async function procesarYalmacenar(chatId, mensajesUnificados , asistente) {

  const chat = await Chats.findOne({ IDchat: chatId });
  let hilo = chat.ThreadId1;
  if (hilo) {

    addMessageToThread(hilo, mensajesUnificados , chatId); 
    setTimeout(() => {
      runAssistantAndGetResponse(hilo, asistente, chatId);
    }, TiempoEjecucionRespuesta);
  } else {
    console.log('No se encontró un hilo con el ID proporcionado esto detiene inmediatamente la comverzacion, porfavor revise el error');
  }
}


//Busca en la base de datos si existe el IDchat


export async function buscarValor( clave , Id_chatbot) {

  try {
    // Buscar en la base de datos un documento con el IDchat proporcionado
    let objetoEncontrado = await Chats.findOne({
      $and: [
        { IDchat: clave }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
        { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
      ]
    });
console.log(objetoEncontrado)
    if (objetoEncontrado) {
      // Si se encuentra el objeto, devolver su IDchat
      return objetoEncontrado.IDchat;
    } else {

      let datos = {
        interruptor: "inicial"
    };

      let cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot });

      if(cliente){
      objetoEncontrado = new Chats({
        Tipo:cliente.Tipo,
        datos:datos,
        IDchat: clave,
        Id_chatbot: Id_chatbot // Agregar el campo Telefono aquí
      });
      objetoEncontrado.AntiSpam = {
          ArbitrajeAntiMalUso: "AP"
      };
      await objetoEncontrado.save();
      return "New";

    }else { console.log("Fallo en la busqueda del ID_charbot que deberia devolver el tipo para cargar un nuevo chat")}
    }
  } catch (e) {
    console.error('Error al buscar en la base de datos:', e);
    throw e; // O manejar el error como prefieras
  }
}
  






export async function buscarYAlmacenar(IDchat, rol, mensaje , Id_chatbot) {
  console.log(IDchat + Id_chatbot)
  try {
    // Buscar el documento con el IDchat especificado
    let chat = await Chats.findOne({
      $and: [
        { IDchat: IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
        { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
      ]
    });

console.log(chat)
    const fechaArgentina = moment().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD HH-mm");

    if (chat) {
      // Si el documento ya tiene un array conversationMessages, lo utilizamos; si no, creamos uno nuevo
      if (!chat.conversationMessages) {
        chat.conversationMessages = [];
      }
      chat.conversationMessages.push({ role: rol, content: mensaje , fecha : fechaArgentina });
if(rol == "user"){
      // Obtener la fecha y hora actual en UTC
      const nowUtc = new Date();
      // Ajustar la hora a la de Argentina (UTC-3, por ejemplo)
      const offset = -3; // Cambia este valor según sea necesario
      nowUtc.setHours(nowUtc.getHours() + offset);

      // Formatear la fecha al formato deseado
      chat.UltimaActualizacion = nowUtc.toISOString();
     }

      await chat.save();
      ActualizarAConexiones(IDchat);
    } else {
      console.log("No se encontró un IDchat, no se almacenó la conversación debido a este error");
    }
  } catch (err) {
    console.error("Error al interactuar con la base de datos al momento de guardar la conversación: ", err);
  }
}






  let Productos  = [
    {"CATEGORIA":"ACHURA EMBUTIDO CHINCHULINES CHINCHU CHUNCHULIN","PRODUCTO":"CHINCHULIN","CANTIDAD":"1Kg","TARJETA":"3432","EFECTIVO":"3120"},
    {"CATEGORIA":"ACHURA EMBUTIDO CHORIZO","PRODUCTO":"CHORIZO / CHORIZO BOMBON PREMIUM","CANTIDAD":"1Kg","TARJETA":"6160","EFECTIVO":"5600"},
    {"CATEGORIA":"ACHURA EMBUTIDO LENGUA","PRODUCTO":"LENGUA","CANTIDAD":"1Kg","TARJETA":"6050","EFECTIVO":"5500"},
    {"CATEGORIA":"ACHURA EMBUTIDO MOLLEJAS","PRODUCTO":"MOLLEJAS","CANTIDAD":"1Kg","TARJETA":"7040","EFECTIVO":"6400"},
    {"CATEGORIA":"ACHURA EMBUTIDO MORCILLA","PRODUCTO":"MORCILLA PREMIUM","CANTIDAD":"1Kg","TARJETA":"4070","EFECTIVO":"3700"},
    {"CATEGORIA":"ACHURA EMBUTIDO MORCILLA","PRODUCTO":"MORCILLA VAZCA","CANTIDAD":"1Kg","TARJETA":"4290","EFECTIVO":"3900"},
    {"CATEGORIA":"ACHURA EMBUTIDO RIÑON","PRODUCTO":"RIÑON","CANTIDAD":"1Kg","TARJETA":"3432","EFECTIVO":"3120"},
    {"CATEGORIA":"ACHURA EMBUTIDO SALCHICA","PRODUCTO":"SALCHICHA DE VIENA AHUMADA","CANTIDAD":"1Kg","TARJETA":"7040","EFECTIVO":"6400"},
    {"CATEGORIA":"ACHURA EMBUTIDO SALCHICA","PRODUCTO":"SALCHICHA PARRILLERA","CANTIDAD":"1Kg","TARJETA":"7040","EFECTIVO":"6400"},
    {"CATEGORIA":"ALBONDIGAS","PRODUCTO":"ALBONDIGAS DE CARNE","CANTIDAD":"1/2 K","TARJETA":"3850","EFECTIVO":"3500"},
    {"CATEGORIA":"ALBONDIGAS POLLO","PRODUCTO":"ALBONDIGAS DE POLLO","CANTIDAD":"1/2 K","TARJETA":"2750","EFECTIVO":"2500"},
    {"CATEGORIA":"CERDO BONDIOLA","PRODUCTO":"BONDIOLA","CANTIDAD":"1Kg","TARJETA":"8250","EFECTIVO":"7500"},
    {"CATEGORIA":"CERDO CARRE","PRODUCTO":"CARRE","CANTIDAD":"1Kg","TARJETA":"7150","EFECTIVO":"6500"},
    {"CATEGORIA":"CERDO COSTILLAS COSTILLA","PRODUCTO":"COSTILLITAS","CANTIDAD":"1Kg","TARJETA":"5087.5","EFECTIVO":"4625"},
    {"CATEGORIA":"CERDO MANTILLA","PRODUCTO":"MANTILLA","CANTIDAD":"1Kg","TARJETA":"8500","EFECTIVO":"7650"},
    {"CATEGORIA":"CERDO MATAMBRITO","PRODUCTO":"MATAMBRITO","CANTIDAD":"1Kg","TARJETA":"8250","EFECTIVO":"7500"},
    {"CATEGORIA":"CERDO PECHITO","PRODUCTO":"PECHITO","CANTIDAD":"1Kg","TARJETA":"5087.5","EFECTIVO":"4625"},
    {"CATEGORIA":"CERDO PULPA","PRODUCTO":"PULPA","CANTIDAD":"1Kg","TARJETA":"5912.5","EFECTIVO":"5375"},
    {"CATEGORIA":"CERDO RIBS","PRODUCTO":"RIBS","CANTIDAD":"1Kg","TARJETA":"6187.5","EFECTIVO":"5625"},
    {"CATEGORIA":"COMBO ABUELA","PRODUCTO":"COMBO ABUELA","CANTIDAD":"(1 Combo)","TARJETA":"33110","EFECTIVO":"30100"},
    {"CATEGORIA":"COMBO ARGENTINO","PRODUCTO":"COMBO ARGENTINO","CANTIDAD":"(1 Combo)","TARJETA":"48950","EFECTIVO":"44500"},
    {"CATEGORIA":"COMBO BURGER BLEND","PRODUCTO":"COMBO BURGER BLEND","CANTIDAD":"(1 Combo)","TARJETA":"17050","EFECTIVO":"15500"},
    {"CATEGORIA":"COMBO BURGER RELLENA X 4","PRODUCTO":"COMBO BURGER RELLENA X 4","CANTIDAD":"(1 Combo)","TARJETA":"14300","EFECTIVO":"13000"},
    {"CATEGORIA":"COMBO CERDO PREMIUM","PRODUCTO":"COMBO CERDO PREMIUM","CANTIDAD":"(1 Combo)","TARJETA":"32120","EFECTIVO":"29200"},
    {"CATEGORIA":"COMBO CHURRASQUITO DE POLLO","PRODUCTO":"COMBO CHURRASQUITO DE POLLO","CANTIDAD":"(1 Combo)","TARJETA":"30250","EFECTIVO":"27500"},
    {"CATEGORIA":"COMBO FAMILIAR","PRODUCTO":"COMBO FAMILIAR","CANTIDAD":"(1 Combo)","TARJETA":"45650","EFECTIVO":"41500"},
    {"CATEGORIA":"COMBO FIESTERO","PRODUCTO":"COMBO FIESTERO","CANTIDAD":"(1 Combo)","TARJETA":"39600","EFECTIVO":"36000"},
    {"CATEGORIA":"COMBO FIT","PRODUCTO":"COMBO FIT","CANTIDAD":"(1 Combo)","TARJETA":"30250","EFECTIVO":"27500"},
    {"CATEGORIA":"COMBO FIT PREMIUM","PRODUCTO":"COMBO FIT PREMIUM","CANTIDAD":"(1 Combo)","TARJETA":"31020","EFECTIVO":"28200"},
    {"CATEGORIA":"COMBO FUEGO","PRODUCTO":"COMBO FUEGO","CANTIDAD":"(1 Combo)","TARJETA":"16830","EFECTIVO":"15300"},
    {"CATEGORIA":"COMBO FULL RELLENO","PRODUCTO":"COMBO FULL RELLENO","CANTIDAD":"(1 Combo)","TARJETA":"23320","EFECTIVO":"21200"},
    {"CATEGORIA":"COMBO HORNO CON POLLO DE CAMPO","PRODUCTO":"COMBO HORNO CON POLLO DE CAMPO","CANTIDAD":"(1 Combo)","TARJETA":"27500","EFECTIVO":"25000"},
    {"CATEGORIA":"COMBO KIDS","PRODUCTO":"COMBO KIDS","CANTIDAD":"(1 Combo)","TARJETA":"14300","EFECTIVO":"13000"},
    {"CATEGORIA":"COMBO MILA","PRODUCTO":"COMBO MILA","CANTIDAD":"(1 Combo)","TARJETA":"24200","EFECTIVO":"22000"},
    {"CATEGORIA":"COMBO POLLO DE CAMPO","PRODUCTO":"COMBO POLLO DE CAMPO","CANTIDAD":"(1 Combo)","TARJETA":"25300","EFECTIVO":"23000"},
    {"CATEGORIA":"COMBO RIBS","PRODUCTO":"COMBO RIBS","CANTIDAD":"(1 Combo)","TARJETA":"17600","EFECTIVO":"16000"},
    {"CATEGORIA":"COMBO SINGLE BLEND","PRODUCTO":"COMBO SINGLE BLEND","CANTIDAD":"(1 Combo)","TARJETA":"19360","EFECTIVO":"17600"},
    {"CATEGORIA":"COMBO SINGLE PREMIUM","PRODUCTO":"COMBO SINGLE PREMIUM","CANTIDAD":"(1 Combo)","TARJETA":"17820","EFECTIVO":"16200"},
    {"CATEGORIA":"COMBO SNACK","PRODUCTO":"COMBO SNACK","CANTIDAD":"(1 Combo)","TARJETA":"18150","EFECTIVO":"16500"},
    {"CATEGORIA":"COMBO TITO&GONZA","PRODUCTO":"COMBO TITO&GONZA","CANTIDAD":"(1 Combo)","TARJETA":"27500","EFECTIVO":"25000"},
    {"CATEGORIA":"COMBO ASADO PREMIUM","PRODUCTO":"COMBO ASADO PREMIUM","CANTIDAD":"(1 Combo)","TARJETA":"28600","EFECTIVO":"26000"},
    {"CATEGORIA":"CHEDAR PANCETA","PRODUCTO":"BITE DE CHEDAR Y PANCETA","CANTIDAD":"1/4 K","TARJETA":"1650","EFECTIVO":"1500"},
    {"CATEGORIA":"MEDALLON QUESO ESPINACA MERLUZA","PRODUCTO":"MEDALLON DE MERLUZA CON ESPINACA Y QUESO","CANTIDAD":"1/2 K","TARJETA":"2200","EFECTIVO":"2000"},
    {"CATEGORIA":"MEDALLON POLLO","PRODUCTO":"MEDALLON DE POLLO","CANTIDAD":"1/2 K","TARJETA":"2200","EFECTIVO":"2000"},
    {"CATEGORIA":"MEDALLON POLLO","PRODUCTO":"MEDALLON DE POLLO RELLENO DE JAMON Y QUESO","CANTIDAD":"1/2 K","TARJETA":"2200","EFECTIVO":"2000"},
    {"CATEGORIA":"CREOQUETA ESPINACA","PRODUCTO":"MINI CROQUETAS DE ESPINACA","CANTIDAD":"1/4 K","TARJETA":"1650","EFECTIVO":"1500"},
    {"CATEGORIA":"MINALESA MILANESAS","PRODUCTO":"MINI MILANESA DE MERLZA A LA ROMANA","CANTIDAD":"1/2 K","TARJETA":"2200","EFECTIVO":"2000"},
    {"CATEGORIA":"NUGGET","PRODUCTO":"NUGGET CROCANTES","CANTIDAD":"1/2 K","TARJETA":"2200","EFECTIVO":"2000"},
    {"CATEGORIA":"PALITOS DE POLLO","PRODUCTO":"PALITOS DE POLLO A LAS HIERBAS","CANTIDAD":"1/2 K","TARJETA":"2200","EFECTIVO":"2000"},
    {"CATEGORIA":"PAPA BASTON PAPAFRITAS","PRODUCTO":"PAPAS BASTON","CANTIDAD":"1/2 K","TARJETA":"2200","EFECTIVO":"2000"},
    {"CATEGORIA":"PAPA BASTON PAPAFRITAS CARITAS","PRODUCTO":"PAPAS CARITA","CANTIDAD":"1/2 K","TARJETA":"2200","EFECTIVO":"2000"},
    {"CATEGORIA":"PAPA BASTON PAPAFRITAS NOICET","PRODUCTO":"PAPAS NOISETTE","CANTIDAD":"1/2 K","TARJETA":"2200","EFECTIVO":"2000"},
    {"CATEGORIA":"RELLENO RELLENAS RELLENA RELLENOS","PRODUCTO":"BOMBAS DE CARNE RELLENAS","CANTIDAD":"1/2 K","TARJETA":"2640","EFECTIVO":"2400"},
    {"CATEGORIA":"RELLENO RELLENAS RELLENA RELLENOS","PRODUCTO":"BOMBAS DE POLLO RELLENAS","CANTIDAD":"1/2 K","TARJETA":"2376","EFECTIVO":"2160"},
    {"CATEGORIA":"RELLENO RELLENAS RELLENA RELLENOS","PRODUCTO":"BONDIOLA RELLENA","CANTIDAD":"1Kg","TARJETA":"8690","EFECTIVO":"7900"},
    {"CATEGORIA":"RELLENO RELLENAS RELLENA RELLENOS","PRODUCTO":"CARRE RELLENO","CANTIDAD":"1Kg","TARJETA":"8690","EFECTIVO":"7900"},
    {"CATEGORIA":"RELLENO RELLENAS RELLENA RELLENOS HAMBURGESA","PRODUCTO":"HAMBURGUESA RELLENA","CANTIDAD":"220Gr","TARJETA":"1188","EFECTIVO":"1080"},
    {"CATEGORIA":"HAMBURGESA","PRODUCTO":"HAMBURGUESA SIMPLE","CANTIDAD":"100G","TARJETA":"660","EFECTIVO":"600"},
    {"CATEGORIA":"MATABRE","PRODUCTO":"MATAMBRE DE CARNE","CANTIDAD":"1Kg","TARJETA":"8800","EFECTIVO":"8000"},
    {"CATEGORIA":"MATABRE POLLO","PRODUCTO":"MATAMBRE DE POLLO","CANTIDAD":"1Kg","TARJETA":"6050","EFECTIVO":"5500"},
    {"CATEGORIA":"MATABRE POLLO","PRODUCTO":"MATAMBRE DE POLLO COCIDO","CANTIDAD":"UNIDAD APR","TARJETA":"3300","EFECTIVO":"3000"},
    {"CATEGORIA":"MINALESA MILANESAS","PRODUCTO":"MILANESA DE BONDIOLA RELLENA DE JAMON Y QUESO","CANTIDAD":"1Kg","TARJETA":"6050","EFECTIVO":"5500"},
    {"CATEGORIA":"MINALESA MILANESAS","PRODUCTO":"MILANESA DE CERDO","CANTIDAD":"1Kg","TARJETA":"5280","EFECTIVO":"4800"},
    {"CATEGORIA":"MINALESA MILANESAS","PRODUCTO":"MILANESA DE PECHUGA","CANTIDAD":"1Kg","TARJETA":"3960","EFECTIVO":"3600"},
    {"CATEGORIA":"MINALESA MILANESAS","PRODUCTO":"MILANESA DE POLLO RELLENA DE JYQ","CANTIDAD":"1Kg","TARJETA":"4950","EFECTIVO":"4500"},
    {"CATEGORIA":"MINALESA MILANESAS","PRODUCTO":"MILANESA DE PYM","CANTIDAD":"1Kg","TARJETA":"3960","EFECTIVO":"3600"},
    {"CATEGORIA":"MINALESA MILANESAS","PRODUCTO":"MILANESA DE TERNERA","CANTIDAD":"1Kg","TARJETA":"6490","EFECTIVO":"5900"},
    {"CATEGORIA":"PAN RELLENO","PRODUCTO":"PAN DE CARNE RELLENO","CANTIDAD":"UNIDAD","TARJETA":"5830","EFECTIVO":"5300"},
    {"CATEGORIA":"RELLENO RELLENAS RELLENA RELLENOS POLLO","PRODUCTO":"POLLO RELLENO","CANTIDAD":"UNIDAD APR","TARJETA":"9350","EFECTIVO":"8500"},
    {"CATEGORIA":"RELLENO RELLENAS RELLENA RELLENOS MILANESA MILANESAS","PRODUCTO":"SUPREMITA RELLENA","CANTIDAD":"1Kg","TARJETA":"5500","EFECTIVO":"5000"},
    {"CATEGORIA":"RELLENO RELLENAS RELLENA RELLENOS","PRODUCTO":"TERNERA RELLENA","CANTIDAD":"1Kg","TARJETA":"10450","EFECTIVO":"9500"},
    {"CATEGORIA":"PROVOLETA QUESO","PRODUCTO":"PROVOLETA","CANTIDAD":"UNIDAD","TARJETA":"660","EFECTIVO":"600"},
    {"CATEGORIA":"OTROS OLIVA ACEITE","PRODUCTO":"ACEITE OLIVA","CANTIDAD":"1 LITRO","TARJETA":"3480","EFECTIVO":"3190"},
    {"CATEGORIA":"OTROS OLIVA ACEITE","PRODUCTO":"ACEITE OLIVA","CANTIDAD":"1/2 L","TARJETA":"2299","EFECTIVO":"2090"},
    {"CATEGORIA":"OTROS OLIVA ACEITE","PRODUCTO":"ACEITE OLIVA VIDRIO","CANTIDAD":"1/2 L","TARJETA":"3025","EFECTIVO":"2750"},
    {"CATEGORIA":"POLLO ALISTAS","PRODUCTO":"ALITAS DE POLLO DE CAMPO","CANTIDAD":"1Kg","TARJETA":"1100","EFECTIVO":"1000"},
    {"CATEGORIA":"POLLO DE CAMPO","PRODUCTO":"CHURRASQUITO DE P Y M","CANTIDAD":"1Kg","TARJETA":"5500","EFECTIVO":"5000"},
    {"CATEGORIA":"POLLO DE CAMPO PATA MUSLO","PRODUCTO":"PATA Y MUSLO","CANTIDAD":"1Kg","TARJETA":"2090","EFECTIVO":"1900"},
    {"CATEGORIA":"POLLO DE CAMPO PATA MUSLO","PRODUCTO":"PROMO PATA Y MUSLO X 3Kg","CANTIDAD":"3K","TARJETA":"5390","EFECTIVO":"4900"},
    {"CATEGORIA":"POLLO DE CAMPO","PRODUCTO":"POLLO ENTERO","CANTIDAD":"1Kg","TARJETA":"2310","EFECTIVO":"2100"},
    {"CATEGORIA":"POLLO DE CAMPO MILANESAS","PRODUCTO":"SUPREMA","CANTIDAD":"1Kg","TARJETA":"5500","EFECTIVO":"5000"},
    {"CATEGORIA":"REBOZADO QUEZO","PRODUCTO":"BASTON DE QUESO REBOZADO","CANTIDAD":"1Kg","TARJETA":"5016","EFECTIVO":"4560"},
    {"CATEGORIA":"BIFE ANCHO TERNERA","PRODUCTO":"BIFE ANCHO","CANTIDAD":"1Kg","TARJETA":"6160","EFECTIVO":"5600"},
    {"CATEGORIA":"BIFE ANGOSTO TERNERA","PRODUCTO":"BIFE ANGOSTO","CANTIDAD":"1Kg","TARJETA":"6490","EFECTIVO":"5900"},
    {"CATEGORIA":"BIFE CHORIZO TERNERA","PRODUCTO":"BIFE CHORIZO","CANTIDAD":"1Kg","TARJETA":"9460","EFECTIVO":"8600"},
    {"CATEGORIA":"BOLA DE LOMO TERNERA","PRODUCTO":"BOLA DE LOMO","CANTIDAD":"1Kg","TARJETA":"7920","EFECTIVO":"7200"},
    {"CATEGORIA":"COLITA DE CUADRIL TERNERA","PRODUCTO":"COLITA DE CUADRIL","CANTIDAD":"1Kg","TARJETA":"8800","EFECTIVO":"8000"},
    {"CATEGORIA":"CUADRADA TERNERA","PRODUCTO":"CUADRADA","CANTIDAD":"1Kg","TARJETA":"7920","EFECTIVO":"7200"},
    {"CATEGORIA":"CUADRIL TERNERA","PRODUCTO":"CUADRIL","CANTIDAD":"1Kg","TARJETA":"8195","EFECTIVO":"7450"},
    {"CATEGORIA":"ENTRAÑA ACHURA","PRODUCTO":"ENTRAÑA","CANTIDAD":"1Kg","TARJETA":"8580","EFECTIVO":"7800"},
    {"CATEGORIA":"FALDA TERNERA","PRODUCTO":"FALDA","CANTIDAD":"1Kg","TARJETA":"4840","EFECTIVO":"4400"},
    {"CATEGORIA":"LOMO TERNERA","PRODUCTO":"LOMO","CANTIDAD":"1Kg","TARJETA":"10450","EFECTIVO":"9500"},
    {"CATEGORIA":"NALGA TERNERA","PRODUCTO":"NALGA","CANTIDAD":"1Kg","TARJETA":"8580","EFECTIVO":"7800"},
    {"CATEGORIA":"OSOBUCO TERNERA","PRODUCTO":"OSOBUCO","CANTIDAD":"1Kg","TARJETA":"4840","EFECTIVO":"4400"},
    {"CATEGORIA":"PALETA TERNERA","PRODUCTO":"PALETA","CANTIDAD":"1Kg","TARJETA":"6820","EFECTIVO":"6200"},
    {"CATEGORIA":"PALOMITA TERNERA","PRODUCTO":"PALOMITA","CANTIDAD":"1Kg","TARJETA":"7150","EFECTIVO":"6500"},
    {"CATEGORIA":"PECETO TERNERA","PRODUCTO":"PECETO","CANTIDAD":"1Kg","TARJETA":"9460","EFECTIVO":"8600"},
    {"CATEGORIA":"PICADA ESPECIAL PICADA CARNE","PRODUCTO":"PICADA ESPECIAL","CANTIDAD":"1Kg","TARJETA":"5720","EFECTIVO":"5200"},
    {"CATEGORIA":"ROASTBEEF","PRODUCTO":"ROASTBEEF","CANTIDAD":"1Kg","TARJETA":"6215","EFECTIVO":"5650"},
    {"CATEGORIA":"TAPA DE ASADO","PRODUCTO":"TAPA DE ASADO","CANTIDAD":"1Kg","TARJETA":"6105","EFECTIVO":"5550"},
    {"CATEGORIA":"TAPA DE NALGA","PRODUCTO":"TAPA DE NALGA","CANTIDAD":"1Kg","TARJETA":"8195","EFECTIVO":"7450"},
    {"CATEGORIA":"VACIO","PRODUCTO":"VACIO","CANTIDAD":"1Kg","TARJETA":"7865","EFECTIVO":"7150"},
    {"CATEGORIA":"ASADO DE TERNERA","PRODUCTO":"ASADO DE TERNERA","CANTIDAD":"1Kg","TARJETA":"7040","EFECTIVO":"6400"}
    ]
  

  let MensajedeContenido = `Que decea Agregar?`

  let limite = 10;



var tokwp = "EAASbMC5ZC4ngBOxsv4iiq8dcTBPqeR0FjREsCetMZAfuMCRXfMdqKSQHYRYzE5yCMICDuBAmhG7SprzS7jXbEC2VOwphZB86o81Wbn8J0x6ZCPlJ7ZAo4OPyJPNEYb2z8G4zgAZBYLAg4oSY1PCQzwp6vz03ZAt23BhjQpbpBBWZBvVOAndxsZCdqiZAl3MmCb6waAZBRXtlO5yVjxeUXpOeSgZD"

/// CrearNuevoWebHook( "akjshdjkhs" , "jkosdsklajd" , tokwp , "sdasdsad" ,  "195389366992702" , 10000 , "asst_k6ckqRCoWNpCnD9z3ACe5DBf" , "Venta" , true , MensajedeContenido , ["siendo procesado" , "procesado" , "dirección de entrega"], Productos , limite )



async function CrearNuevoWebHook(NewWH , TokenWH , TokenWP , Openia , Id_chatbot , TiempoEspera , asistente , Tipo ,parametros , Productos , limite ){
  
// Crear una nueva instancia de BaseClientes
const nuevoWebhook = new BaseClientes({
  Tipo : Tipo,
  Webhook: NewWH,
  TokenWH : TokenWH,
  TokenWP:  TokenWP,
  TKopenIA: Openia,
  Id_chatbot : Id_chatbot,
  TiempoEspera : TiempoEspera,
  TKAsistente : asistente,
  ParametrosDeteccion : parametros,
  Productos: Productos,
  LimiteBusqueda: limite,
  ContraseñaUsuario : "0RiginaL",
  limiteConsumo: "0.20"


});

// Guardar la instancia en la base de datos
try {
  await nuevoWebhook.save();

} catch (error) {
  console.error('Error al guardar el webhook:', error);
}
}





async function agregarBloqueRandom(idChatbot) {
  try {
    // Encuentra el documento por Id_chatbot
    let cliente = await BaseClientes.findOne({ Id_chatbot: idChatbot });
    
    if (!cliente) {
      // Manejo del caso en que el cliente no se encuentra
      console.log('Cliente no encontrado');
      return;
    }

    // Crea un nuevo objeto Bloque
    const nuevoBloque = {
      tipoMensaje:0,
      mensajeCuerpo:"Ya posee un pedido en Proceso",
      pausa:"procesandoPedio",
      text:"procesandoPedio",
      pausaSave:'procesandoPedio',
      funcionUtilizada:3
    };

    // Verifica si ya existe el array Bloque y lo actualiza, en caso contrario lo crea
    if (cliente.Bloque) {
      cliente.Bloque.push(nuevoBloque);
    } else {
      cliente.Bloque = [nuevoBloque];
    }

    // Guarda los cambios en el cliente
    await cliente.save();
  } catch (error) {
    console.error('Error al agregar el bloque:', error);
  }
}

// Ejemplo de uso
//agregarBloqueRandom(195389366992702); 