import { BaseClientes , Chats , ConexionesAbiertas } from "../../datos/ConfigDB.js";
import { Mongoose } from "mongoose";
import { io } from "../../app.js";
import { MensajeManual} from '../../Mensajeria_api/API_mensajes.js'
import { ManipuadorDeContinuidad } from "../../PedidosFinalizados/ManipuladordeEstado.js";
import session from "express-session";



export async function ManejarSolicitud(Datos, Socket) {


    if (Datos.tipo == "1") {
        const IDConexion = await ConexionesAbiertas.findOne({ Conexiones: Socket });
        if (!IDConexion) {
            const nuevaConexion = new ConexionesAbiertas({
                Conexiones: Socket // Aquí añades los datos que quieras guardar
            });
            try {
                await nuevaConexion.save();
             
            } catch (error) {
                console.error('Error al guardar el webhook:', error);
            }
            return;
        }
    } else if (Datos.Datos == "2") { // Asumo que quieres verificar Datos.tipo aquí
   
     
        let IDConexion = await ConexionesAbiertas.findOne({ Conexiones: Socket });

        const Clientes = await BaseClientes.findOne({ correoCliente: Datos.correo });
        if (!Clientes) {
          console.log("No se encontró el cliente.");
          return; // Termina la ejecución si no hay cliente
        }
      
        if (Datos.session !== true && Datos.session !== "true") {
          console.log("La sesión no está activa.");
          return; // Termina la ejecución si la sesión no está activa
        }
      
        // Envía chats usando la ID del chatbot y el socket
        EnvioChats(Clientes.Id_chatbot, Socket);
      
        if (IDConexion) {
          // Si la conexión existe, actualiza la ID del chatbot
          IDConexion.Id_chatbot = Clientes.Id_chatbot;
        } else {
          // Si la conexión no existe, crea una nueva
          IDConexion = new ConexionesAbiertas({
            Conexiones: Socket,
            Id_chatbot: Clientes.Id_chatbot,
            // Añade cualquier otro campo necesario
          });
        }
      
        // Guarda los cambios o la nueva conexión en la base de datos
        await IDConexion.save();
        console.log("Conexión y datos del cliente manejados correctamente.");
      
    } else if (Datos.tipo == "5") {

      

        if (typeof Datos.IDchat === "number") {
            let objeto = Datos
         
            ManipuadorDeContinuidad(objeto.IDchat, "SinCliente", "FrenoManualAplicado")

            MensajeManual(objeto)
        }

        
    }  ////////////////////// Modo desarrollo eliminar para la version oficial 





}

async function EnvioChats(Id_chatbot, Socket) {
    const Clientes = await Chats.find({ Id_chatbot: Id_chatbot });



    if (Clientes && Clientes.length > 0){
      

        // Ordenando los clientes por UltimaActualizacion
        Clientes.sort((a, b) => {
            // Convertir las fechas a objetos Date para comparar
            const fechaA = new Date(a.UltimaActualizacion);
            const fechaB = new Date(b.UltimaActualizacion);

            // Orden descendente: el más reciente primero
            return fechaB - fechaA;
        });

        io.to(Socket).emit('evento_del_servidor', { Tipo: "3", Clientes: Clientes });
    } else {
        console.log("No hay chats")

    }
}


//ActualizarAConexiones(5492945523530)
export async function ActualizarAConexiones(IDchat) {
    try {
        // Buscar los chats por IDchat
        const chats = await Chats.find({ IDchat: IDchat });

        if (chats && chats.length > 0) {
            const ChatString = chats[0].Id_chatbot;

            // Primero, eliminar conexiones abiertas que no tienen un Id_chatbot asociado
            await ConexionesAbiertas.deleteMany({ Id_chatbot: { $exists: false } });

            if (ChatString) {
                // Buscar conexiones abiertas que coincidan con el Id_chatbot encontrado
                const conexiones = await ConexionesAbiertas.find({ Id_chatbot: ChatString });

                conexiones.forEach(async (conexion) => {
                    io.to(conexion.Conexiones).emit('evento_del_servidor', { Tipo: "4", Clientes: chats }, async (response) => {
                        // Verificar si la respuesta es null
                        if (response === null) {
                            // Eliminar la conexión específica que respondió con null
                            await ConexionesAbiertas.deleteOne({ _id: conexion._id });
                            console.log(`Conexión eliminada por falta de respuesta: ${conexion._id}`);
                        } else {
                            console.log(`Confirmación recibida de ${conexion.Conexiones}:`);
                        }
                    });
                });
            } else {
                console.log('No se encontró Id_chatbot para el chat proporcionado. Solo se han eliminado las conexiones inválidas.');
            }
        } else {
            console.log('No se encontraron chats con el IDchat proporcionado. Verifique el IDchat.');
        }
    } catch (error) {
        console.error('Error al actualizar conexiones:', error);
    }
}





// Desconectar socket
/*
function desconectarYReconectar() {
  for (const [id, socket] of io.of("/").sockets) {
      socket.disconnect(true);
  }
}


setInterval(desconectarYReconectar, 10000);

*/
