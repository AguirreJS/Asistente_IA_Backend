
import { Chats , BaseClientes } from '../datos/ConfigDB.js'
import { MensajeBaneo } from '../Mensajeria_api/API_mensajes.js'
import { MensajeWhatsapp , EnvioRespuestaWP } from '../Mensajeria_api/API_mensajes.js';
import { mensaje2enrespuesta } from '../PedidosFinalizados/ManipuladordeEstado.js';



let reglas = "Esta fue una charla entre la IA y un usuario Del 1 al 10 como definirias el comportamiento de este usuario sinedo 10 muy insultante (unicamente insultos merecen un puntaje mayor a 5), porfavor solo limitate a responder el puntaje que consideres como respuesta"





export async function chequearYAgregarAntiSpam(IDchat) {
  
  const chat = await Chats.findOne({ IDchat: IDchat });

  if (!chat) {
    // Manejar el caso si el chat no se encuentra
    console.log('Chat no encontrado');
    return;
  }

  if (chat.AntiSpam.ArbitrajeAntiMalUso == "AP") {
    await Chats.updateOne({ _id: chat._id }, { $set: { "AntiSpam.ArbitrajeAntiMalUso": "1" } });
  } else if (chat.AntiSpam.ArbitrajeAntiMalUso == "1") {
    await Chats.updateOne({ _id: chat._id }, { $set: { "AntiSpam.ArbitrajeAntiMalUso": "2" } });
  } else if (chat.AntiSpam.ArbitrajeAntiMalUso == "2") {
    await Chats.updateOne({ _id: chat._id }, { $set: { "AntiSpam.ArbitrajeAntiMalUso": "3" } });
  } else if (chat.AntiSpam.ArbitrajeAntiMalUso == "3") {
    await Chats.updateOne({ _id: chat._id }, { $set: { "AntiSpam.ArbitrajeAntiMalUso": "0" } });
  }

}





setInterval(PrepararChataParaArbitraje, 20000);


export async function PrepararChataParaArbitraje() {
 
// Buscar los documentos
const chats = await Chats.find({ "AntiSpam.ArbitrajeAntiMalUso": "0" });

// Recorrer y actualizar cada documento
for (let chat of chats) {
    // Actualizar el documento
    await Chats.updateOne({ _id: chat._id }, { $set: { "AntiSpam.ArbitrajeAntiMalUso": "1" } });


    procesarDatos( chat.conversationMessages , chat.IDchat,)

}

  
}


function procesarDatos(objeto, IDchat) {
  // Crear una copia del objeto para no modificar el original
  let charlaCopia = JSON.parse(JSON.stringify(objeto));

  // Eliminar el campo _id de cada mensaje, si existe
  charlaCopia.forEach(obj => {
      delete obj._id;
  });

  // Crear el nuevo objeto que quieres insertar
  const nuevoMensaje = { role: 'system', content: reglas };

  // Insertar el nuevo objeto al inicio del arreglo conversationMessages de la copia
  charlaCopia.unshift(nuevoMensaje);


}




export async function AplicarBan( texto, IDchat) {


  const resultado = texto.match(/\d+/);

  if (resultado) {
      const numero = parseInt(resultado[0]);


      // Verificar si el número es mayor o igual a 6
      if (numero >= 6) {



       // Actualizar el campo AntiSpam.ArbitrajeAntiMalUso en el chat con IDchat
       await Chats.updateOne({ IDchat: IDchat }, { $set: { "AntiSpam.ArbitrajeAntiMalUso": "BAN" } });

       
       MensajeBaneo(IDchat)


      } else {

        await Chats.updateOne({ IDchat: IDchat }, { $set: { "AntiSpam.ArbitrajeAntiMalUso": "AP" } });
      }
  } else {
      return "No se encontró un número en el texto.";
  }


}





function eliminarAcentos(palabra) {
  return palabra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function EliminarlasS(palabras) {
  let resultado = [];

  palabras.forEach(palabraOriginal => {
      // Limpia la palabra eliminando caracteres especiales, incluyendo comas.
      let palabra = palabraOriginal.replace(/[?.!-,]/g, '');

      // Agrega la palabra limpia al resultado.
      resultado.push(palabra);


      // Genera y agrega la versión de la palabra sin acentos.
      let palabraSinAcentos = eliminarAcentos(palabra);
      if (palabraSinAcentos !== palabra) {
          resultado.push(palabraSinAcentos);
      }



      // Comprueba si la palabra limpia termina en "s" y tiene más de 1 letra.
      if (palabra.endsWith('s') && palabra.length > 1) {
          // Elimina la última letra "s" y agrega la palabra modificada al resultado.
          let palabraSinS = palabra.slice(0, -1);
          resultado.push(palabraSinS);

          // Si la palabra original tenía acentos, también agrega la versión sin "s" y sin acentos.
          let palabraSinS_y_Acentos = eliminarAcentos(palabraSinS);
          if (palabraSinS_y_Acentos !== palabraSinS) {
              resultado.push(palabraSinS_y_Acentos);
          }
      }
  });

  return resultado;
}



function obtenerUltimoContenidoUsuario(mensajes) {
  // Recorremos la lista en orden inverso
  for (let i = mensajes.length - 1; i >= 0; i--) {
    if (mensajes[i].role === "user") {
      // Devolvemos el contenido del primer mensaje de usuario que encontramos
      return mensajes[i].content;
    }
  }
  // Devolvemos null o un mensaje predeterminado si no se encuentra ningún mensaje de usuario
  return null;
}

export async function filtrarPorProducto(palabraClave, IDchat , Id_chatbot) {

  const chat =await Chats.findOne({
           $and: [
             { IDchat: IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
             { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
           ]
         });

  const cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot });

  if (chat.datos.BuscadoProductosActivo == "false" || cliente.BuscadoProductosActivo == false){ return false}

  async function objetolisto(IDchat) {
   

    let ultimoMensaje = obtenerUltimoContenidoUsuario(chat.conversationMessages);

   



    return {
      Limite: cliente.LimiteBusqueda,
      Productos: cliente.Productos,
      UltimoMensaje: ultimoMensaje // Agregar el último mensaje aquí
    };
  }

  let { Limite, Productos, UltimoMensaje } = await objetolisto(IDchat);

  // Aquí podrías incluir lógica para considerar el último mensaje en tu filtro
  // Por ejemplo, combinar la palabra clave con el último mensaje para el filtrado
  let palabras = EliminarlasS((palabraClave + " " + UltimoMensaje).toLowerCase().trim().split(" ").filter(palabra => palabra.length >= 4));
 


  let resultados = Productos.filter(objeto => 
    palabras.some(palabraClave => 
      objeto.CATEGORIA.toLowerCase().split(" ").includes(palabraClave)
    )
  );

  // Aplicar el límite de búsqueda
  resultados = resultados.slice(0, Limite);

  if (resultados.length === 0) {
      return false;
  }

  return resultados.map(objeto => `🥩 ${objeto.CANTIDAD}  👉 ${objeto.PRODUCTO} 💵 ${objeto.EFECTIVO} 💳 ${objeto.TARJETA} `).join(`
  `);
}






export function manejarAdiosImagenes(message) {
  // Verificar primero si 'entry' y 'changes' existen y tienen elementos
  if (message.entry && message.entry.length > 0 && 
      message.entry[0].changes && message.entry[0].changes.length > 0) {
    
    const change = message.entry[0].changes[0];
    
    // Ahora verifica si 'value' y 'messages' existen y tienen elementos
    if (change.value && change.value.messages && change.value.messages.length > 0) {
      
      const firstMessage = change.value.messages[0];

      // Verifica si el primer mensaje es de tipo 'image'
      if (firstMessage.type === 'image' && firstMessage.image) {
        // Procesar mensaje de imagen
        // Aquí puedes manejar la imagen, por ejemplo, guardar la URL o descargarla
        return true;
      } 
      // Verifica si el primer mensaje es de tipo 'audio'
      else if (firstMessage.type === 'audio' && firstMessage.audio) {
        // Procesar mensaje de audio
        // Aquí puedes manejar el audio, por ejemplo, guardar la URL o descargarlo
        return true;
      }
    }
  }
  return false;
}




export async function ProblmasIA(mensaje, IDchat , Id_chatbot) {
  const chat =  await Chats.findOne({
    $and: [
      { IDchat: IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
      { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
    ]
  });


  if (chat.datos.pausa == "Fallo") {


MensajeWhatsapp(mensaje2enrespuesta, IDchat , null , Id_chatbot);
    // Aquí debes agregar algo para usar 'mensajenuevo', por ejemplo, enviar este mensaje
  } else {
    MensajeWhatsapp(mensaje, IDchat , null , Id_chatbot);
    chat.datos.pausa = "Fallo";
    chat.save();
  }
}


