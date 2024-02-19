import OpenAI from 'openai';
import { MensajeWhatsapp } from '../Mensajeria_api/API_mensajes.js';
import { ProblmasIA  } from '../Arbitraje/Arbitraje.js';
import mongoose from 'mongoose';
import { Chats , BaseClientes } from '../datos/ConfigDB.js'
import nodemailer from 'nodemailer';
import { detectarprocesamietodePedido } from '../PedidosFinalizados/Procesarpedidolisto.js'
import { keywordInterceptor } from '../PedidosFinalizados/Procesarpedidolisto.js';
import { contarTokens } from './Tokens.js';


export let mensajePredeterminadoParaError = "Estamos experimentando algunos inconvenientes con nuestro asistente de IA 🤖. Sin embargo, puedes seguir utilizando nuestro chat para buscar precios 💰. Nuestro algoritmo avanzado continuará detectando y recomendando artículos de manera eficiente 🛒🔍. ¡Gracias por tu paciencia y comprensión! 🙏🤖💬";

let TiempoAesperarParaLAia = 50000;

async function RetornarTokenOpen(IDchat) {
  try {
      const chat = await Chats.findOne({ IDchat: IDchat });
      if (!chat) {
          throw new Error('Chat no encontrado.');
      }

      const cliente = await BaseClientes.findOne({ Id_chatbot: chat.Id_chatbot });
      if (!cliente) {
          throw new Error('Cliente no encontrado.');
      }

      return cliente.TKopenIA; // o simplemente retorna `openai` si necesitas el objeto completo

  } catch (error) {
      console.error('Error al obtener el token:', error.message);
      // Manejo adicional del error si es necesario
      return null; // o lanzar el error según tu lógica de manejo de errores
  }
}





export async function createThread(Idchat, mensaje, ASSISTANT, A, Id_chatbot) {
  const openai = new OpenAI({
    apiKey: await RetornarTokenOpen(Idchat),
  });

  const thread = await openai.beta.threads.create();
  // Retorna un objeto con ambos ID
  if (A == "1" || A == "2") {
    const resultado = await Chats.findOneAndUpdate(
      // Actualizado para buscar coincidencias tanto en IDchat como en Id_chatbot
      { IDchat: Idchat, Id_chatbot: Id_chatbot },
      { ThreadId1: thread.id }
    );
  }
  if (A == "1") {
    addMessageToThread(thread.id, mensaje, Idchat);
    setTimeout(() => {
      runAssistantAndGetResponse(thread.id, ASSISTANT, Idchat)
    }, 100);
  }
}




export async function addMessageToThread(threadId, userMessage , IDchat , Id_chatbot) {

  const openai = new OpenAI({
    apiKey: await RetornarTokenOpen(IDchat),
});


  contarTokens(userMessage , IDchat , Id_chatbot)

    try {
      const messageContent = String(userMessage);
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: messageContent
      });
     
    } catch (error) {
    
      // Aquí puedes implementar lógica para reintentar o manejar el error
    }
  }







 export async function runAssistantAndGetResponse(threadId, assistantId, chatId , denegar) {

  const openai = new OpenAI({
    apiKey: await RetornarTokenOpen(chatId),
});



const cliente = await BaseClientes.findOne({ TKAsistente: assistantId });


  const chat = await Chats.findOne({
    $and: [
      { IDchat: chatId }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
      { Id_chatbot: cliente.Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
    ]
  });


  try {
    // Crea una ejecución (run) en el hilo con el ID del asistente proporcionado
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // Muestra la respuesta del asistente
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
let tiempoTranscurrido = 0; // Contador de tiempo en milisegundos

while (runStatus.status !== 'completed') {

    console.log(tiempoTranscurrido)
    await new Promise(resolve => setTimeout(resolve, 500)); // Espera 500ms antes de volver a consultar
    tiempoTranscurrido += 500; // Incrementa el tiempo transcurrido

    // Consulta nuevamente el estado
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);

    // Si han pasado 2 minutos (120000 milisegundos), ejecuta ManejodeEsperaIA()
    if (tiempoTranscurrido >= TiempoAesperarParaLAia) {
      if(chat.AntiSpam.FalloEnRespuestaIA == "Reintento") { 
        ProblmasIA(mensajePredeterminadoParaError, chatId , cliente.Id_chatbot )
        return false
      } else {
        ManejodeEsperaIA(threadId, assistantId, chatId , denegar);
        return false
        break; // Rompe el bucle si no quieres que continúe después de llamar a ManejodeEsperaIA  
      }
    }
   
}

chat.AntiSpam.FalloEnRespuestaIA = "Procesado";
await chat.save();
    // Una vez que se completa la ejecución, recupera los mensajes añadidos por el Asistente al Hilo.
    const messages = await openai.beta.threads.messages.list(threadId);
   

    // Solo los mensajes de la ejecución actual
    const runMessages = messages.data.filter(m => m.run_id === run.id);

    // Mensajes del asistente de la ejecución actual para evitar repetición
    const assistantMessages = runMessages
    .filter(m => m.role === 'assistant')
    .map(m => m.content.map(c => c.text.value).join(' ')) // Accede al 'valor' del objeto 'texto'
    .join('\n');

  let MensajeFinal = limpiarTexto(assistantMessages)

  contarTokens(MensajeFinal , chatId , cliente.Id_chatbot) //manejar diferentes id chats

 
  if( denegar && denegar == "1"){
    chat.pedido = await MensajeFinal;
    chat.save();
   
  return true
  } 

if (cliente.ParametrosDeteccion){

    let Faseunodeteccion =   detectarprocesamietodePedido( MensajeFinal , cliente.ParametrosDeteccion) 
  console.log(Faseunodeteccion)
    if(Faseunodeteccion ) { 

    console.log("Se detecto la Face 2 del proceso")
    keywordInterceptor( "DeteccionClave" , chatId , cliente.Tipo , cliente.Id_chatbot)
    


    if(cliente.retornarParametros == false){
            
    } else {
      chat.datos.pausa = 'DeteccionClave';
      chat.save();
      return true
    }

} 
}


    
  // Enviar el mensajeee
  MensajeWhatsapp( MensajeFinal, chatId , null , chat.Id_chatbot)

    return  MensajeFinal;

   } catch (error) {
    console.error("Error en runAssistantAndGetResponse:", error);
    throw error; // Relanza el error para que la función que llama sea consciente de que ocurrió un error.
  }
  
}







  

export async function ProcesadordepedidosporIA (IDchat , Id_chatbot){

  
  const chat = await Chats.findOne({
    $and: [
      { IDchat: IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
      { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
    ]
  });


  const cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot });
 let Mensaje1 = cliente.consultaInternaIA;


 addMessageToThread(chat.ThreadId1, Mensaje1 , IDchat);

 setTimeout(function() {
  if(cliente.TKAsistente) {
      runAssistantAndGetResponse(chat.ThreadId1, cliente.TKAsistente, IDchat, "1");
  } else {
      // Add code here to execute if cliente.TKAsistente is not true
      
  }
}, 3000);


  }



  
  

  


  async function ManejodeEsperaIA(threadId, assistantId, chatId , denegar) {

    const chat = await Chats.findOne({ IDchat: chatId });
    if (chat) {
      chat.AntiSpam.FalloEnRespuestaIA = "Reintento";
      await chat.save();
  } 

   runAssistantAndGetResponse(threadId, assistantId, chatId , denegar)


  }




  function limpiarTexto(texto) {
    // Esta expresión regular busca patrones del tipo 【número†source】
    var regex = /【\d+†source】/g;
    return texto.replace(regex, '');
}