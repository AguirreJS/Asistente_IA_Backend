
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

        const chats = await Chats.findOne({ IDchat: chat });
        chats.datos.pausa = "Manual"
        chats.save()

        return true
        

    } else  if (cliente && chat) {
    
        if ( chat && chat.datos.pausa == "Manual" ||  chat.Consumo >= cliente.limiteConsumo) {


           if (chat.datos.pausa == "Manual") {
        

            return true;

                } else if (chat.Consumo >= cliente.limiteConsumo) {

                    const chats = await Chats.findOne({ IDchat: chat.IDchat });

                    console.log(chats.datos.pausa)
             
                    if(chats.datos.pausa && chats.datos.pausa == "Fallo" ){
                  
                    
                    MensajeWhatsapp(mensaje2enrespuesta, chat.IDchat);
                        // Aquí debes agregar algo para usar 'mensajenuevo', por ejemplo, enviar este mensaje
                      } else {

                        MensajeWhatsapp(mensajePredeterminadoParaError, chat.IDchat);
                        chat.datos.pausa = "Fallo";
                        chat.save();
                      }

            return true;

                }
         

        }
    } 

    return false
}

export async function ReactivarIA(IA, IDchat) {
    console.log(IA);

    if (IA == "Si") {
        const chats = await Chats.findOne({ IDchat: IDchat });

        if (!chats) {
            console.log("Chat no encontrado");
            return; // Asegúrate de manejar este caso adecuadamente
        }

        const cliente = await BaseClientes.findOne({ Id_chatbot: chats.Id_chatbot });

        if (!cliente) {
            console.log("Cliente no encontrado");
            return; // Asegúrate de manejar este caso adecuadamente
        }

        createThread(IDchat, "Nuevo Hilo Creado", cliente.TKAsistente, "2");

        chats.datos.pausa = "";
        // Eliminar el campo BuscadoProductosActivo estableciéndolo a undefined
        chats.datos.BuscadoProductosActivo = undefined;

        await chats.save();

    } else {
        const chats = await Chats.findOne({ IDchat: IDchat });
        if (!chats) {
            console.log("Chat no encontrado");
            return; // Asegúrate de manejar este caso adecuadamente
        }
        chats.datos.pausa = "";
        await chats.save();
    }
}


