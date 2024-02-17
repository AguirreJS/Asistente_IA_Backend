import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import fs from 'fs';
import axios from 'axios';
import mongoose from 'mongoose';
import { Chats , BaseClientes } from '../datos/ConfigDB.js'
import { buscarYAlmacenar, buscarValor, procesarMensajes , messageBuffer , timer } from '../datos/ProcesadorMedio.js';
import {chequearYAgregarAntiSpam  } from '../Arbitraje/Arbitraje.js'
import { filtrarPorProducto } from '../Arbitraje/Arbitraje.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);






// export const bot = new TelegramBot(token, { polling: true });
// Escucha los mensajes entrantes constantemente
// API de telegram, mensaje principal esta funcion se mantiene activa veerificando si un mensaje ingreso constantemente. 


export async function  ProcesadorDeMensajesAcumulativos ( mensaje, from , phone_number_id ) {
 
  const cliente = await BaseClientes.findOne({ Id_chatbot: phone_number_id });

  let tiempodeesperadefinido =  cliente.TiempoEspera;



    const chatId = from;


    // Inicializa el buffer para almacenar temporalmente la info del chat
    if (!messageBuffer[chatId]) {
        messageBuffer[chatId] = [];
    }

    // Agrega el mensaje al buffer
    messageBuffer[chatId].push(mensaje);

    // Restablece el temporizador si ya existe
    if (timer[chatId]) {
        clearTimeout(timer[chatId]);
    }

    // Establece un nuevo temporizador
    timer[chatId] = setTimeout(() => {
        procesarMensajes(from , phone_number_id);   //// llamadabases.js
    }, tiempodeesperadefinido); // 10 segundos
}















export async function MensajeWhatsapp(mensaje, chatId , A , Id_chatbot) {

  let info;
  try {
    
 info = await Chats.findOne({
        $and: [
          { IDchat: chatId }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
          { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
        ]
      });
      
  } catch (error) {
      // Manejo del error
      console.error(error);
  }

  if(A == "1") {
    EnvioRespuestaWP( info ? info.Id_chatbot : null , mensaje, chatId);   buscarYAlmacenar(chatId, "cliente", mensaje , Id_chatbot) ;
  } else {

   let precios ; 

   try {
    precios = await filtrarPorProducto(mensaje , chatId );
} catch (error) {
    // Manejo del error
 
}

    setTimeout(() => chequearYAgregarAntiSpam(chatId), 20000);



   
if(precios == false ){   EnvioRespuestaWP( info ? info.Id_chatbot : null , mensaje, chatId);   buscarYAlmacenar(chatId, "system", mensaje , Id_chatbot); } else {

  let fucion =` 🗣 ${mensaje} 
  

  🔍👨‍💻PRECIOS RECOMENDADOS POR EL ALGORITMO:👩‍💻🔎
  
  ${precios}

  `


  EnvioRespuestaWP( info ? info.Id_chatbot : null , fucion, chatId);

  buscarYAlmacenar(chatId, "system", fucion , info.Id_chatbot) ;
}
  
   
}}


export async function EnvioRespuestaWP(phone_number_id, mensaje, from) {

  console.log(phone_number_id + "ID_chatbot")
  const cliente = await BaseClientes.findOne({ Id_chatbot: phone_number_id });
  const token = cliente.TokenWP;
  const MAX_LENGTH = 2900;

  // Función para enviar mensaje
  async function enviarSegmento(segmento) {
    return axios({
      method: "POST",
      url: `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      data: {
        messaging_product: "whatsapp",
        to: from,
        text: { body: segmento },
      },
      headers: { "Content-Type": "application/json" },
    });
  }



  if (mensaje.length > MAX_LENGTH) {
    for (let i = 0; i < mensaje.length; i += MAX_LENGTH) {
      const segmento = mensaje.substring(i, i + MAX_LENGTH);
      await enviarSegmento(segmento);
    }
  } else {
    await enviarSegmento(mensaje);
  }
}



      export async function MensajesConOpciones(phone_number_id, from, mensaje, buttons) {
        




        const cliente = await BaseClientes.findOne({ Id_chatbot: phone_number_id });



        buscarYAlmacenar(from, "system", mensaje , phone_number_id)



            const bearerToken = cliente.TokenWP;

            var url = `https://graph.facebook.com/v15.0/${phone_number_id}/messages`;
          
            var data = {
              messaging_product: 'whatsapp',
              to: from,
              type: "interactive",
              interactive: {
                type: "button",
                body: {
                  text: mensaje
                },
                action: {
                  buttons: buttons.map(button => ({
                    type: "reply",
                    reply: {
                      id: button.id,
                      title: button.title
                    }
                  }))
                }
              }
            };
          
            var postReq = {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data),
              json: true
            };
          
            try {
              const response = await fetch(url, postReq);
              const jsonResponse = await response.json();
              return jsonResponse;
            } catch (error) {
              console.error(error);
              return error;
            }
          }







export function MensajeBaneo(chatId) {



  bot.sendMessage(chatId, `Nuestro Sistema detecto una infraccion de nuestras politicas de comportamiento esto se debe a el uso de lenguaje ofensivo o demasiadas preguntas fuera de contexto, por lo pronto no se lo pondra en contacto directo con la IA hasta nuevo aviso`);

}


export function MensajeManual(objeto , ID_charbot){

  let mensaje = objeto.Mensaje
  let chatID = objeto.IDchat


  MensajeWhatsapp(mensaje, chatID , "1" , ID_charbot)

}

  
  
export async function ManejarYalmacenarImagenes(req) {
  let Id_chatbot = req.body.entry[0].changes[0].value.metadata.phone_number_id;
  let fromValue = req.body.entry[0].changes[0].value.messages[0].from;


  const cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot });

  const ubicacion = cliente.ubicacionMultimedia;

  const mediaId = req.body.entry[0].changes[0].value.messages[0].image.id;



  // Asegurarse de que el directorio existe antes de intentar guardar la imagen
  const dirPath = path.join(__dirname, `multimedia/${ubicacion}/${fromValue}-${mediaId}.jpg` , Id_chatbot);
  const dir = path.dirname(dirPath);
console.log(dirPath)
  setTimeout(() => {
    buscarYAlmacenar(fromValue, "user", `multimedia/${ubicacion}/${fromValue}-${mediaId}.jpg` , Id_chatbot); // Cambio la extensión a .mp3
    },2000);
  

  // Verifica si el directorio existe, si no, lo crea
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (mediaId) {
    let token = cliente.TokenWP;
    const apiUrl = `https://graph.facebook.com/v18.0/${mediaId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Datos de la imagen:', data);

      const imageResponse = await fetch(data.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!imageResponse.ok) {
        throw new Error(`Error al descargar la imagen: ${imageResponse.statusText}`);
      }

      const buffer = await imageResponse.buffer();

      // Guardar la imagen en el directorio especificado
      fs.writeFile(dirPath, buffer, (err) => {
        if (err) {
          console.error('Error al guardar la imagen:', err);
        } else {
          console.log('Imagen guardada con éxito en:', dirPath);

        }
      });
    } catch (error) {
      console.error('Error al recuperar la imagen:', error);
    }
  }
}




export async function ManejarYalmacenarAudios(req) {
  let Id_chatbot = req.body.entry[0].changes[0].value.metadata.phone_number_id;
  let fromValue = req.body.entry[0].changes[0].value.messages[0].from;

  
  const cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot });
  const ubicacion = cliente.ubicacionMultimedia; // Asumiendo que esta propiedad existe y es válida para audios

  const mediaId = req.body.entry[0].changes[0].value.messages[0].audio.id;
  console.log(mediaId);

  // Asegurarse de que el directorio existe antes de intentar guardar el audio
  const dirPath = path.join(__dirname, `multimedia/${ubicacion}/${fromValue}-${mediaId}.mp3` , Id_chatbot);
  const dir = path.dirname(dirPath);
  console.log(dirPath);

  setTimeout(() => {
    buscarYAlmacenar(fromValue, "user", `multimedia/${ubicacion}/${fromValue}-${mediaId}.mp3` , Id_chatbot);
  }, 2000);

  // Verifica si el directorio existe, si no, lo crea
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (mediaId) {
    let token = cliente.TokenWP;
    const apiUrl = `https://graph.facebook.com/v18.0/${mediaId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Datos del audio:', data);

      const audioResponse = await fetch(data.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!audioResponse.ok) {
        throw new Error(`Error al descargar el audio: ${audioResponse.statusText}`);
      }

      const buffer = await audioResponse.buffer();

      // Guardar el audio en el directorio especificado
      fs.writeFile(dirPath, buffer, (err) => {
        if (err) {
          console.error('Error al guardar el audio:', err);
        } else {
          console.log('Audio guardado con éxito en:', dirPath);
        }
      });
    } catch (error) {
      console.error('Error al recuperar el audio:', error);
    }
  }
}