
    

var IdSocket ;
var SeleccionActual = "Sin Seleccion";

const socket = io('https://remoto.rhglobal.com.ar');

 socket.on('connect', () => {

    socket.emit('mensaje_cliente', { tipo:"1"});
    IdSocket = socket.id
    setTimeout(logueo, 2000); // 5000 milisegundos = 5 segundos
});

socket.on('evento_del_servidor', (data) => {
    


    if(data.Tipo == "3"){

      objetollegada = data;

      insertarUsuarios()
     }else if(data.Tipo == "4"){

      actualizarConversationMessages( objetollegada , data)

     }
});


function actualizarConversationMessages(clientesOriginales, clientesActualizados) {
  let idChat = clientesActualizados.Clientes[0].IDchat;

  
  clientesActualizados.Clientes.forEach(clienteActualizado => {
        // Encuentra el cliente correspondiente en la lista original por ID
        let clienteOriginalIndex = clientesOriginales.Clientes.findIndex(cliente => cliente._id === clienteActualizado._id);
        
        if (clienteOriginalIndex !== -1) {
            // Si se encuentra el cliente, actualiza su lista de 'conversationMessages'
            clientesOriginales.Clientes[clienteOriginalIndex].conversationMessages = clienteActualizado.conversationMessages;
        } else {
            // Si el cliente no existe en la lista original, lo agrega
            clientesOriginales.Clientes.push(clienteActualizado);
        }
    });

    let objetollegada = clientesOriginales;

    eliminarUsuarios() 

    insertarUsuarios()

    if(SeleccionActual == false){ } else {  
        
        
        chatActual = SeleccionActual
        ChatSeleccionado(SeleccionActual) }

   
    window.scrollTo(0, document.body.scrollHeight);

    setTimeout(function() {
    resaltarUsuarioPorAlt(idChat);
}, 1000); // 1000 milisegundos = 1 segundo


}


function resaltarUsuarioPorAlt(valorAlt) {
    // Selecciona todos los elementos con la clase 'usuario'
    var usuarios = document.querySelectorAll('.usuario');

    // Convierte valorAlt a una cadena si es un número
    var valorAltString = valorAlt.toString();

    // Itera sobre los elementos para encontrar el que coincide con el valor 'alt' dado
    usuarios.forEach(function(usuario) {
        if (usuario.getAttribute('alt') === valorAltString) {
            // Cambia el color de fondo a verde si no es verde, de lo contrario a blanco
            usuario.style.backgroundColor = usuario.style.backgroundColor === 'green' ? 'green' : 'green';
        }
    });
}

function resaltarUsuarioPorAlt2(valorAlt) {
    // Selecciona todos los elementos con la clase 'usuario'
    var usuarios = document.querySelectorAll('.usuario');

    // Convierte valorAlt a una cadena si es un número
    var valorAltString = valorAlt.toString();

    // Itera sobre los elementos para encontrar el que coincide con el valor 'alt' dado
    usuarios.forEach(function(usuario) {
        if (usuario.getAttribute('alt') === valorAltString) {
            // Cambia el color de fondo a verde si no es verde, de lo contrario a blanco
            usuario.style.backgroundColor = usuario.style.backgroundColor === '#f1f1f1' ? '#f1f1f1' : '#f1f1f1';

        }
    });
}







function logueo() {

    fetch('https://remoto.rhglobal.com.ar/onlinesocket', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: IdSocket })
})
.then(response => {
    if (!response.ok) {
        throw new Error('La solicitud falló con el estado ' + response.status);
    }
    return response.json();
})
.then(data => {
})
.catch(error => {
    console.error('Hubo un problema con la solicitud fetch:', error);
});


    /*
let contraseña = prompt("Ingresa el tocken de tu empresa")
// Datos que deseas enviar
let dato = {
tipo:"2",
id:IdSocket,
token:contraseña

}

socket.emit('mensaje_cliente', { mensaje: dato});

*/
}



let objetollegada = {}

function insertarUsuarios() {
    let contenedorSidebar = document.querySelector('.sidebar');

    objetollegada.Clientes.forEach(cliente => {
        let divUsuario = document.createElement('div');
        divUsuario.className = 'usuario';
        divUsuario.setAttribute('alt', cliente.IDchat);

        // Crear un elemento h1 y agregar el IDchat
        let h1 = document.createElement('h1');
        h1.textContent = cliente.IDchat;
        divUsuario.appendChild(h1);

        // Agregar el evento onclick al div
        divUsuario.onclick = function() {
            ChatSeleccionado(cliente.IDchat);
        };

        contenedorSidebar.appendChild(divUsuario);
    });
}

var SeleccionActual = false;


function ChatSeleccionado(idChat) {
  resaltarUsuarioPorAlt2(idChat);

  SeleccionActual = idChat;
  let messageArea = document.querySelector('.AreaDeMensajes');
  messageArea.innerHTML = '';

  let clienteSeleccionado = objetollegada.Clientes.find(cliente => cliente.IDchat === idChat);

  if (clienteSeleccionado) {
    clienteSeleccionado.conversationMessages.forEach(mensaje => {
      let divMensaje = document.createElement('div');
      divMensaje.className = mensaje.role === 'user' ? 'message-user' : 'message-system';
  
      // Verificar si el mensaje termina en .jpg
      if (mensaje.content.endsWith('.jpg')) {
        let img = document.createElement('img');
        img.src = mensaje.content; // Asegúrate de reemplazar 'https://tu-dominio.com' con tu dominio real
        img.alt = 'Imagen enviada';
        // Puedes agregar estilos adicionales si es necesario
        img.style.maxWidth = '400px'; // Ejemplo de estilo
        img.style.height = 'auto';
  
        divMensaje.appendChild(img);
      } else {
        // Usa innerText para mantener los saltos de línea
        divMensaje.innerText = mensaje.content;
      }
  
      messageArea.appendChild(divMensaje);
    });
  } else {

  }
}




// Llama a la función para ejecutarla
insertarUsuarios();





function eliminarUsuarios() {
    // Selecciona el elemento 'sidebar'
    var sidebar = document.querySelector('.sidebar');

    // Encuentra todos los elementos 'div' con clase 'usuario' dentro de 'sidebar'
    var usuarios = sidebar.querySelectorAll('.usuario');

    // Elimina cada elemento 'usuario'
    usuarios.forEach(function(usuario) {
        sidebar.removeChild(usuario);
    });
}




document.addEventListener("DOMContentLoaded", function() {
    // Esta función se ejecutará una vez que se haya cargado todo el contenido del DOM

    var botonEnviar = document.getElementById("botonEnviar");

    botonEnviar.addEventListener("click", function(event) {
        event.preventDefault(); // Previene el comportamiento predeterminado del formulario (si lo hay)
        console.log("Botón Enviar clickeado");

        // Aquí puedes añadir la lógica para enviar el mensaje
    });
});

////////////////////////////////////////////////////

function enviar() {

    
    // Seleccionar el elemento textarea
    const miTextarea = document.getElementById('mensaje');

    // Capturar el valor del textarea
    let valorTextarea = miTextarea.value;

    // Aquí puedes hacer lo que necesites con el valor capturado


    let dato = {
        tipo:"5",
        id:IdSocket,
        mensaje:valorTextarea,
        IDchat:SeleccionActual,
        
        }

    socket.emit('mensaje_cliente', { mensaje: dato});

    miTextarea.value = '';
}








    





