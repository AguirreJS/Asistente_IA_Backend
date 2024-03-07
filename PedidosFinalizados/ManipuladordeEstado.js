
import { BaseClientes , Chats } from "../datos/ConfigDB.js";
import { mensajePredeterminadoParaError } from "../IA/API_openIA.js";
import { MensajeWhatsapp } from "../Mensajeria_api/API_mensajes.js";
import { createThread } from "../IA/API_openIA.js";


export let mensaje2enrespuesta = `  
Te invitamos a visitar nuestro sitio web: https://www.carniceriatitoygonza.com.ar para más opciones y ofertas 🥩🛒.

Sin embargo WhatsApp está aquí para ti! Utilízalo nuestro chat como prefieras📱 😊 

`

export async function ManipuadorDeContinuidad(chat, cliente, Mensaje) {

    if ( Mensaje == "FrenoManualAplicado" ) {


        const chats = await Chats.findOne({
            $and: [
              { IDchat: chat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
              { Id_chatbot: cliente.Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
            ]
          });
        chats.datos.pausa = "Manual"
        chats.save()

        return true
        

    } else  if (cliente && chat) {
    
        if ( chat && chat.datos.pausa == "Manual" ||  chat.Consumo >= cliente.limiteConsumo) {


           if (chat.datos.pausa == "Manual") {
        

            return true;

                } else if (chat.Consumo >= cliente.limiteConsumo) {

                    const chats = await Chats.findOne({
                        $and: [
                          { IDchat: chat.IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
                          { Id_chatbot: cliente.Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
                        ]
                      });

             
                    if(chats.datos.pausa && chats.datos.pausa == "Fallo" ){
                  
                      
                    
                    MensajeWhatsapp(cliente.MensajeLimiteConsumo, chat.IDchat , null , cliente.Id_chatbot);
                    

                      } else {

                        MensajeWhatsapp(cliente.MensajeLimiteConsumo, chat.IDchat , null , cliente.Id_chatbot);
                        chat.datos.pausa = "Fallo";
                        chat.save();
                      }

            return true;

                }
         

        }
    } 

    return false
}

export async function ReactivarIA(IA, IDchat , Id_chatbot) {
    console.log(IA);

    if (IA == "Si") {
        const chats = await Chats.findOne({
            $and: [
              { IDchat: IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
              { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
            ]
          });

        if (!chats) {
            console.log("Chat no encontrado");
            return; // Asegúrate de manejar este caso adecuadamente
        }

        const cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot });

        if (!cliente) {
            console.log("Cliente no encontrado");
            return; // Asegúrate de manejar este caso adecuadamente
        }

        createThread(IDchat, "Nuevo Hilo Creado", cliente.TKAsistente, "2" , Id_chatbot);

        chats.datos.pausa = "";
        // Eliminar el campo BuscadoProductosActivo estableciéndolo a undefined
        chats.datos.BuscadoProductosActivo = undefined;

        await chats.save();

    } else {
        const chats = await Chats.findOne({
            $and: [
              { IDchat: IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
              { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
            ]
          });
        if (!chats) {
            console.log("Chat no encontrado");
            return; // Asegúrate de manejar este caso adecuadamente
        }
        chats.datos.pausa = "";
        await chats.save();
    }
}


