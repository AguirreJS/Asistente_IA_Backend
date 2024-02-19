import { BaseClientes , Chats  } from "../../datos/ConfigDB.js";
import { MensajeWhatsapp , MensajesConOpciones } from "../../Mensajeria_api/API_mensajes.js";
import { createThread } from "../../IA/API_openIA.js";
import { ProcesadordepedidosporIA } from "../../IA/API_openIA.js";
import nodemailer from 'nodemailer';


export async function arraydFuncionesModulares(texto , IDchat , Id_chatbot , objecto ) {

    let valor = objecto.funcionUtilizada;


if (valor == 0 || valor == "0") {

    const cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot });

    

    MensajeWhatsapp( objecto.mensajeCuerpo, IDchat , null , Id_chatbot)

    setTimeout(() => {
      MensajeWhatsapp("🌟 Conectando Asistente 🤖", IDchat , null , Id_chatbot);
  }, 1000); 

  setTimeout(() => {
    MensajeWhatsapp("3️⃣", IDchat , null , Id_chatbot);
}, 1500); 

setTimeout(() => {
  MensajeWhatsapp("2️⃣", IDchat , null , Id_chatbot);
}, 2500); 

setTimeout(() => {
MensajeWhatsapp("1️⃣", IDchat , null , Id_chatbot);
}, 3500); 

setTimeout(() => {
createThread(IDchat , "Hola" , cliente.TKAsistente, 1 , Id_chatbot ) 
}, 3000); 


}    else if (valor == 1) {

   let correo =  obtenerCorreoObjetivo(texto)
if(correo == null){ 

    MensajeWhatsapp( "🚨 Recuerda: Para que el sistema reconozca tu correo electrónico, asegúrate de ingresarlo correctamente. 📝 Debe tener el siguiente formato: nombreusuario@example.com. Incluye tu nombre de usuario, seguido del símbolo @, y luego el dominio (como gmail.com, yahoo.com, etc.). 📥 Por favor, inténtalo nuevamente asegurándote de seguir este formato. 🌐" , IDchat , null ,  Id_chatbot)
    return false

} else { 

    const chat = await Chats.findOne({
      $and: [
        { IDchat: IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
        { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
      ]
    });
        chat.datos.correo = correo
        chat.save()
        return true
}

 function obtenerCorreoObjetivo(texto) {
    // Expresión regular para detectar un correo electrónico
    const regexCorreo = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    // Buscamos en el texto un match con la expresión regular
    const match = texto.match(regexCorreo);
    // Si se encuentra un correo, lo retornamos, de lo contrario retornamos null
    return match ? match[0] : null;
  } 

} else if( valor == 2){

   
    ProcesadordepedidosporIA(IDchat , Id_chatbot)

    setTimeout(function() {
        EnviodeMails(IDchat);
    }, 30000);


async function EnviodeMails(IDchat) {

    const numeroAleatorio = Math.floor(Math.random() * 900000) + 100000;
  
    const chat = await Chats.findOne({
      $and: [
        { IDchat: IDchat }, // Asume que `chatId` es la variable que contiene el valor a buscar para `IDchat`.
        { Id_chatbot: Id_chatbot } // Asume que `cliente.Id_chatbot` es el valor a buscar para `Id_chatbot`.
      ]
    });

    const cliente = await BaseClientes.findOne({ Id_chatbot: Id_chatbot});

    if (!chat) {
        console.log('Chat no encontrado');
        return;
    }

    const CorreoDetectado = chat.datos.correo;
    const direccion = chat.datos.direccion || "Retiro en el Local";
    const franja = chat.datos.Franja || "Sin especificar";
    const nota = chat.datos.nota || "No dejo niguna nota sobre su pedido";
  
    let asunto = " Nuevo Pedido N° " + numeroAleatorio;
    chat.datos.Npedido = numeroAleatorio;
    chat.save()
  
  
    let cuerpo = `
  
    📝 Pedido realizado a través de WP con el número ${'🔢' + numeroAleatorio}
    
    👤 Nombre: ${'📛' + chat.datos.nombre}
    
    🤔 Respuesta del asistente sobre la pregunta ¿artículos pedidos?
    ${'📜' + chat.pedido }
    
    📱 Teléfono: ${'🔗' + IDchat}
    
    🏠 Dirección: ${'📍' + direccion}
    
    ⏰ Franja Horaria: ${'⌛' + franja}
    
    📧 Correo: ${'💌' + CorreoDetectado}

    📜 Notas: ${ '📝' + nota}
    
    `;
    
    enviarCorreo(CorreoDetectado, asunto, cuerpo)

    setTimeout(() => {
        enviarCorreo(cliente.correoCliente, asunto , cuerpo);
      }, 1000);
  

    function enviarCorreo(correoDestino, asunto, cuerpo) {
  
      const correoSalida = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
          user: 'astronomia1997@gmail.com',
          pass: 'uwossymrhmswsrjq'
        }
      });
  
      const opcionesCorreo = {
        from: 'astronomia1997@gmail.com',
        to: CorreoDetectado,
        subject: asunto,
        text: cuerpo
      };
  
      correoSalida.sendMail(opcionesCorreo, (error, info) => {
        if (error) {
          console.log('Error al enviar el correo:', error);
        } else {
          console.log('Correo enviado con éxito:', info.response);
        }
      });
       


      }
  


 }




} else if (valor == 3) {

    const chat = await Chats.findOne({ IDchat: IDchat });
    const CorreoDetectado = chat.datos.correo;
    const direccion = chat.datos.direccion || "Retiro en el Local";
    const franja = chat.datos.Franja || "Sin especificar";
    const nota = chat.datos.nota || "No dejo niguna nota sobre su pedido";
  
   
      let numeroAleatorio = chat.datos.Npedido
  
  
    let cuerpo = `
  
    📝 Tienes un pedido en proceso estos son los datos del mismo: 
    
    Numero : ${'🔢' + numeroAleatorio}
    
    👤 Nombre: ${'📛' + chat.datos.nombre}
    
    🤔 Respuesta del asistente sobre la pregunta ¿artículos pedidos?
    ${'📜' + chat.pedido }
    
    🏠 Dirección: ${'📍' + direccion}
    
    ⏰ Franja Horaria: ${'⌛' + franja}
    
    📧 Correo: ${'💌' + CorreoDetectado}

    📜 Notas: ${ '📝' + nota}
    
    `;

    

    MensajeWhatsapp( cuerpo , IDchat , null , Id_chatbot)

    return false

} }