
import mongoose from 'mongoose';
import { Chats , BaseClientes } from '../datos/ConfigDB.js'
import { ProcesadordepedidosporIA } from '../IA/API_openIA.js'
import { MensajeWhatsapp } from '../Mensajeria_api/API_mensajes.js';
import { createThread } from '../IA/API_openIA.js';
import { MensajesConOpciones } from '../Mensajeria_api/API_mensajes.js';
import { ProblmasIA } from '../Arbitraje/Arbitraje.js';
import { buscarYAlmacenar } from '../datos/ProcesadorMedio.js';
import { arraydFuncionesModulares } from './FuncionesModulares/FuncionesReutilizables.js';




export async function keywordInterceptor(texto, IDchat , Tipo ) {


  if ( Tipo == "Venta" ){
    let venta = await PerfilVentas( texto , IDchat )
   if( venta == true) {
    return true
   } else { return false}

  } else if ( Tipo == "Asistente"){
    console.log("Se detecto perfil asistente")
    return false
  }





 }


  

export function detectarprocesamietodePedido(texto , frase) {
  
     // Construir la expresión regular usando el constructor RegExp
    const regex = new RegExp(`${frase[0]}|${frase[0]}|${frase[0]}`, "i");

    // Usar la expresión regular para buscar en el texto
    return regex.test(texto);
}




  
  async function PerfilVentas ( texto, IDchat ) {

   

        //////////////////////////////////////

    const chat = await Chats.findOne({ IDchat: IDchat });

      const cliente = await BaseClientes.findOne({ Id_chatbot: chat.Id_chatbot });


      function evaluarVariantes() {
        // Llama a buscarBloquesPorValor con la primera variante
        let resultado1 = buscarBloquesPorValor(cliente.Bloque, texto, chat.datos.interruptor);
    
        // Si resultado1 es un objeto (no falso), retorna ese objeto
        if (resultado1) return resultado1;
    
        // Llama a buscarBloquesPorValor con la segunda variante
        let resultado2 = buscarBloquesPorValor(cliente.Bloque, chat.datos.pausa, chat.datos.interruptor);
    
        // Si resultado2 es un objeto (no falso), retorna ese objeto
        if (resultado2) return resultado2;
    
        // Si ambas variantes retornaron falso, retorna falso
        return false;
    }

    let resultado = evaluarVariantes() ;
    console.log(resultado)


    if( resultado == false ){ return false } else {
      
      if( resultado[0].return){ 
        
        if(resultado[0].return == false){
        escanearresultado(resultado[0] , texto , IDchat)
        return false  
            }     } 
      
      else{
      escanearresultado(resultado[0] , texto , IDchat) 
      return true }
    }


    function buscarBloquesPorValor(Bloque, valorBuscado, ordenDeBusqueda) {
      const bloquesFiltrados = Bloque.filter(bloque => {
        if (ordenDeBusqueda === 1) {
          // Buscar primero en pausa, luego en texto
          return bloque.pausa === valorBuscado || bloque.texto === valorBuscado;
        } else if (ordenDeBusqueda === 0) {
          // Buscar primero en texto, luego en pausa
          return bloque.texto === valorBuscado || bloque.pausa === valorBuscado;
        } else {
          // Por defecto, buscar primero en texto
          return bloque.texto === valorBuscado || bloque.pausa === valorBuscado;
        }
      });
    
      // Retorna false si no se encontraron bloques, de lo contrario retorna los bloques filtrados
      return bloquesFiltrados.length > 0 ? bloquesFiltrados : false;
    }

    


async function escanearresultado(objeto , texto , IDchat) {


  ////////////////////// funciones modulares //////////////////////

  if(objeto.funcionUtilizada == 0){

arraydFuncionesModulares(texto , IDchat , cliente.Id_chatbot , objeto )

  } else if (objeto.funcionUtilizada == 1) {

let boolean = await arraydFuncionesModulares(texto , IDchat , cliente.Id_chatbot , objeto )
if (boolean == false) { return true  } else if (boolean == true) { console.log("El correo fue aprobado puede proceder")}
  
} else if (objeto.funcionUtilizada == 2) {

  console.log("preparando envio de mail")
  arraydFuncionesModulares(texto , IDchat , cliente.Id_chatbot , objeto )

} else if (objeto.funcionUtilizada == 3) {

  let boolean = await arraydFuncionesModulares(texto , IDchat , cliente.Id_chatbot , objeto )
  if (boolean == false) { return true  } else if (boolean == true) { console.log("El correo fue aprobado puede proceder")}
    
  }

//////////////////////////////////////////////////////////////////////////
  if (objeto.almacenamiento) {
    if (objeto.almacenamiento === true) {
      let elementoAlmacenado = objeto.tipoAlmacenamieto;
      console.log(elementoAlmacenado)
      if(objeto.datoAlmacenado){
      chat.datos[elementoAlmacenado] = objeto.datoAlmacenado;
      console.log(chat.datos[elementoAlmacenado])
      chat.save();} else
      {
        chat.datos[elementoAlmacenado] = texto;
      console.log(chat.datos[elementoAlmacenado])
      chat.save()

      }
    }
  }
  
  if(objeto.pausaSave){
    chat.datos.pausa = objeto.pausaSave;
    setTimeout(() => {
      chat.save().catch(error => {
          console.error('Error al guardar el chat:', error);
      });
  }, 1000);
    }

    if(objeto.tipoMensaje){
      if(objeto.tipoMensaje == "1"){

        console.log("Tipo mensaje listo para enviar")
        let option = objeto.mensajeOpciones;
        let cuerpo = objeto.mensajeCuerpo;

        MensajesConOpciones(chat.Id_chatbot, IDchat, cuerpo , option)

      } if (objeto.tipoMensaje == "0"){


        MensajeWhatsapp( objeto.mensajeCuerpo , IDchat)
      
      }

      if (objeto.interruptor){
        if(objeto.tipoMensaje == "1"){
          chat.datos.interruptor = 1;
          setTimeout(() => {
            chat.save().catch(error => {
                console.error('Error al guardar el chat:', error);
            });
        }, 2000);      
        }
      }
    }


}

  }









    ///////////////////////////////////////////////

/*
const franjasHorarias = {
    "Franja1": "De 12 a 16",
    "Franja2": "De 17 a 20"
  };


        

          console.log("Texto  " + texto + " Pausa   " +  chat.datos.pausa  )

          if(texto == ".Bloque.MensajeInicial"){
            
            const cliente = await BaseClientes.findOne({ Id_chatbot: chat.Id_chatbot });


            let option =   [
              { id: 'asistente', title: 'Asistente' },
              { id: 'website', title: 'Sitio Web' }
              // Más botones según sea necesario
            ]
          
           MensajesConOpciones(chat.Id_chatbot, IDchat, cliente.Bloque.MensajeInicialContenido, option)

          } else if (texto == "website") { 

            MensajeWhatsapp( "¡Excelente! 🌟 Para descubrir más, visita nuestro sitio web 🌐 en Carnicería Tito y Gonza en https://www.carniceriatitoygonza.com.ar. ¡Te esperamos! 🥩🛒" , IDchat)
            
            return true

 
           }  else if (texto == "asistente") { 
            const cliente = await BaseClientes.findOne({ Id_chatbot: chat.Id_chatbot });

            let mensajefuncionamiento = `

            🌟 ¡Excelente elección! ¿Te interesa saber cómo funciona? 🤖

            Nuestra IA está completamente informada sobre todos los artículos de la lista y preparada para tomar nota de tus pedidos. 📝 Los precios se adaptan al contexto de la conversación, y aunque la IA no accede directamente a los precios, estos aparecerán al final de cada mensaje siempre que se mencionen. Podrás ver los precios tanto para pagos con tarjeta 💳 como para transferencia o efectivo 💰. Al concluir tu compra, solicitaremos algunos datos para el envío o para el retiro en tienda. Si tienes alguna duda, no dudes en preguntarle a la IA. Estamos aquí para asistirte. 💬            
            
            `

            MensajeWhatsapp( mensajefuncionamiento , IDchat)

            setTimeout(() => {
              MensajeWhatsapp("🌟 Conectando Asistente 🤖", IDchat);
          }, 1000); 

          setTimeout(() => {
            MensajeWhatsapp("3️⃣", IDchat);
        }, 1500); 

        setTimeout(() => {
          MensajeWhatsapp("2️⃣", IDchat);
      }, 2500); 

      setTimeout(() => {
        MensajeWhatsapp("1️⃣", IDchat);
    }, 3500); 

    setTimeout(() => {
      createThread(IDchat , "Hola" , cliente.TKAsistente, 1 ) 
  }, 3000); 
          
            return true


           }
          
          if(chat.datos.pausa == "Fallo") {
          
            ProblmasIA("Ejecutando Buscador de Productos" , IDchat)
            return true
          }
          
          
          if (chat.datos.pausa == "1") {

            const direccion = chat.datos.direccion || "Retiro en el Local";
            const franja = chat.datos.Franja || "Sin especificar";  

            let cuerpo = `🚀 Ya posees un pedido en proceso. 

📱 Pedido realizado a través de Whatsapp con el número ${chat.datos.Npedido}

👤 Nombre de la persona:
 ${'📛' + chat.datos.nombre}
            
🤖 Le preguntamos a la IA la lista de los artículos pedidos, esta fue su respuesta:

${'📋' + chat.pedido}
            
🏠 Dirección: 
${'📍' + direccion}

⏰ Franja Horaria:
 ${'⌛' + franja}
            
📧 Tu Correo: 
${'💌' + chat.datos.correo}
            
            `;
            
            
           
              MensajeWhatsapp( cuerpo , IDchat , "1")
              return true
          }
          
          
          if (texto == "SeguirAgregando") { MensajeWhatsapp("Que deceas agregar a tu pedido", IDchat)
          
              chat.datos.pausa = "";
              chat.save()
              return true
          
          }
          
          
          if (texto == "Tipo2") {
          
              let respuesta = "Escriba su direccion para el envio no olvide numero de piso/departamento y localidad, recuerde que los envios dentro de caba son gratuitos si la compra supera los $20.000"
          MensajeWhatsapp( respuesta , IDchat)
          chat.datos.pausa = "Franja";
          chat.datos.tipo = "Tipo1";
          chat.save()
          return true
          
           } else if (texto == "Tipo1" || texto == "Franja1" || texto == "Franja2" ){
          
              let respuesta = "¿podría indicarnos su nombre completo, por favor?"
          
              MensajeWhatsapp( respuesta , IDchat)
             
                
                if (texto in franjasHorarias) {
                  chat.datos.Franja = franjasHorarias[texto];
                  chat.datos.pausa = "Nombre";
                  chat.save();
                  return true
                } else {
              chat.datos.pausa = "Nombre";
              chat.datos.tipo = "Tipo1";
              chat.save()
              return true}
          
          }
          else if (texto == "Face2" || chat.datos.pausa == "Face2") {
            console.log("Face 2 sellecion de opciones")
              chat.datos.numero= IDchat;
              chat.save()
          
          
            let option = [
                  { id: 'Tipo1', title: 'Retiro en el Local' },
                  { id: 'Tipo2', title: 'Envio a Domicilio' },
                  {id:'SeguirAgregando' , title: 'Agregar al Carro'}
                ]
          
               MensajesConOpciones(chat.Id_chatbot, IDchat, "Seleccione la opcion que se adapte a su necesidad", option)
               
               return true
             
          } else if (chat.datos.pausa == "Direccion") {
              let respuesta = "¿podría indicarnos su nombre completo, por favor?"
              MensajeWhatsapp( respuesta , IDchat)
              chat.datos.pausa = "Nombre";
              chat.datos.direccion = texto;
              chat.save()
              return true
          
           } else if (chat.datos.pausa == "Franja") {
                
              chat.datos.direccion = texto;
              chat.save()
          
            let option =   [
              { id: 'Franja1', title: 'de 12 a 16' },
              { id: 'Franja2', title: 'de 17 a 20' }
              // Más botones según sea necesario
            ]
          
           MensajesConOpciones(chat.Id_chatbot, IDchat, "Seleccione la franja horaria que mas se dapate a su necesidad", option)
          
           return true
             
          } else if (chat.datos.pausa == "Nombre") {
              let respuesta = "¿Por ultimo necesitamos un de correo electronico para procesar el pedido?"
              MensajeWhatsapp( respuesta , IDchat)
              chat.datos.pausa = "Correo";
              chat.datos.nombre = texto;
              chat.save()
              return true
          
             
          }
          
          
       
          
          if(correodetectado){
              ProcesadordepedidosporIA(IDchat)
              console.log("Correo detectado");
          setTimeout(() => {EnviodeMails(IDchat);}, 30000);
              chat.datos.pausa ="1"
              chat.datos.correo = texto;
              chat.save()
              let respuesta = "Muchas gracias por realizar tu pedido en estos momentos el mismo fue enviado para preparar, espero que TITO nuestra IA entrenada haya podido responder a todas tus consultas, por el momento vamos a dejar a tito descansar pero no te precupes a partir de mañana podras realizar nuevas pedidos, por lo pronto una persona se pondra en contacto con vos para la entrega. Saludos."
              MensajeWhatsapp( respuesta , IDchat)
          } else {
              chat.datos.pausa = "ErrorCorreo";
              chat.save()
              let respuesta = "Error al procesar el correo, porfavor verifique que lo esta escribiendo correctamente."
              MensajeWhatsapp( respuesta , IDchat)
              
          }
          
          
          
          
          return true
          
          } else if (chat.datos.pausa == "ErrorCorreo") {
   
              if(correodetectado){
                  ProcesadordepedidosporIA(IDchat)
                  console.log("Correo detectado");
                  setTimeout(() => {EnviodeMails(IDchat);}, 30000);
                  chat.datos.pausa = "1"
                  chat.datos.correo = texto;
                  chat.save()
                  let respuesta = "Muchas gracias por realizar tu pedido en estos momentos el mismo fue enviado para preparar, espero que TITO nuestra IA entrenada haya podido responder a todas tus consultas, por el momento vamos a dejar a tito descansar pero no te precupes a partir de mañana podras realizar nuevas pedidos, por lo pronto una persona se pondra en contacto con vos para la entrega. Saludos."
                  MensajeWhatsapp( respuesta , IDchat)
              } else {
                  chat.datos.pausa = "ErrorCorreo";
                  chat.save()
                  let respuesta = "Error al procesar el correo, porfavor verifique que lo esta escribiendo correctamente."
                  MensajeWhatsapp( respuesta , IDchat)
                  
              }
              
              
              return true
              
              }
          
          
          
          
        

*/
      





