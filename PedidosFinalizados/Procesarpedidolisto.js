
import mongoose from 'mongoose';
import { Chats , BaseClientes } from '../datos/ConfigDB.js'
import { ProcesadordepedidosporIA } from '../IA/API_openIA.js'
import { MensajeWhatsapp } from '../Mensajeria_api/API_mensajes.js';
import { createThread } from '../IA/API_openIA.js';
import { MensajesConOpciones } from '../Mensajeria_api/API_mensajes.js';
import { ProblmasIA } from '../Arbitraje/Arbitraje.js';
import { arraydFuncionesModulares } from './FuncionesModulares/FuncionesReutilizables.js';




export async function keywordInterceptor(texto, IDchat , Tipo , Id_chatbot ) {


  if ( Tipo == "Venta" ){
    let venta = await PerfilVentas( texto , IDchat , Id_chatbot )
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




  
  async function PerfilVentas ( texto, IDchat , Id_chatbot ) {

   

        //////////////////////////////////////

    const chat = await Chats.findOne({
      $and: [
        { IDchat: IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
        { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
      ]
    });

      const cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot });


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
        escanearresultado(resultado[0] , texto , IDchat , Id_chatbot)
        return false  
            }     } 
      
      else{
      escanearresultado(resultado[0] , texto , IDchat , Id_chatbot) 
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

    


async function escanearresultado(objeto , texto , IDchat , Id_chatbot) {


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


        MensajeWhatsapp( objeto.mensajeCuerpo , IDchat , null , Id_chatbot )
      
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






      





