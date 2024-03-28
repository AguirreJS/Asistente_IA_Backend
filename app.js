import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import fetch from 'node-fetch';
import { Server as SocketIOServer } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from 'body-parser';
import cors  from 'cors'
import mongoose from 'mongoose';
import session from 'express-session';
import {buscarYAlmacenar } from './datos/ProcesadorMedio.js';
import { EnvioRespuestaWP , ProcesadorDeMensajesAcumulativos ,  ManejarYalmacenarImagenes , ManejarYalmacenarAudios } from './Mensajeria_api/API_mensajes.js';
import { manejarAdiosImagenes } from './Arbitraje/Arbitraje.js';
import { keywordInterceptor } from './PedidosFinalizados/Procesarpedidolisto.js';
import { Chats , BaseClientes , ConexionesAbiertas } from './datos/ConfigDB.js'
import { ManejarSolicitud } from './Frontend/Api_Front/Socket.js';
import { ReactivarIA } from './PedidosFinalizados/ManipuladordeEstado.js';
import { sendEmail , GeneradorEstructuraMail } from './Mensajeria_api/Api_correo.js';



let Dominio = "https://remoto.rhglobal.com.ar"

const app = express();
app.use(express.json()); // Middleware para parsear JSON

app.use(session({
  secret:'99%Seguro',
  resave: true,
  saveUninitialized:true,

}))

// Configura el servidor HTTPS con los certificados
const httpsServer = https.createServer({
    key: fs.readFileSync('Certificado/private.key'),
    ca: fs.readFileSync('Certificado/ca_bundle.crt'),
    cert: fs.readFileSync('Certificado/certificate.crt')
}, app);


// Iniciar Socket.IO con el servidor HTTPS
export const io = new SocketIOServer(httpsServer, {
  cors: {
      origin: '*', // O puedes usar '*' para permitir cualquier origen
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
  }
});
io.on('connection', (socket) => {
  socket.on('mensaje_cliente', (data) => {
    ManejarSolicitud( data , socket.id)
  });

});



// Iniciar el servidor HTTPS en el puerto 8558
httpsServer.listen(8558, () => {
  console.log("Servidor HTTPS iniciado en el puerto 8558");
});



mongoose.connect('mongodb://127.0.0.1:27017/BaseMongo')
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB', err));


  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  



app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


  
  app.use(express.static('public')); // 'public' es el nombre de tu carpeta donde está index.html



  app.get('/', (req, res) => {
   console.log( req.session.correo)
    res.send("Estamos trabajando en este sitio");
  });



app.get("/multimedia/:clienteId/:imagenId", async (req, res) => {
    let clienteId = req.params.clienteId;
    // Reemplazar "Multi-" por una cadena vacía para obtener solo la parte numérica
    clienteId = clienteId.replace("Multi-", "");


    let imagePath = path.join(__dirname, 'Mensajeria_api', 'multimedia', req.params.clienteId, req.params.imagenId);

    const cliente = await BaseClientes.findOne({ Id_chatbot: clienteId })

    if(cliente.correoCliente == req.session.correo ){
      res.sendFile(imagePath, (err) => {
        if (err) {
            // Maneja el error si la imagen no se puede enviar
            console.log(err);
            res.status(404).send('Imagen no encontrada');
        }
    });


    } else {

      res.send("No posee permisos sobre esta imagen, porfavor inicia sesion");

    }
  
    // Tu lógica aquí
});






  app.get('/login', (req, res) => {

    res.sendFile(path.join(process.cwd(), 'public', 'login', 'index.html'));
  });


  
  app.get('/chat', (req, res) => {
    
        res.sendFile(path.join(process.cwd(), 'public', 'chat', 'index.html'));
      });



      app.get('/chat1234', (req, res) => {

      const numeroDeConexionesEnLinea = io.of("/").sockets.size;

console.log(`Número de conexiones en línea: ${numeroDeConexionesEnLinea}`);
});

  
app.post('/SolicitudEnvioMensaje', (req, res) => {
    

  let socket = req.body.id;

  let Object = {
    tipo: req.body.tipo,
    socket: req.body.id,
    session: req.session.online,
    correo: req.session.correo,
    Mensaje: req.body.mensaje,
    IDchat: req.body.IDchat
  }

  // Manejar la solicitud y realizar las operaciones necesarias
  ManejarSolicitud(Object, socket);

  // Enviar una respuesta JSON para confirmar que la solicitud fue manejada con éxito
  res.json({ success: true });
});

      
// Manejar solicitudes POST a /onlinesocket
app.post('/onlinesocket', (req, res) => {

 let socket = req.body.id;


/*
let Object = {
socket : req.body.id,
Datos : "2",
session : true,
correo:"soporte@intervia.com.ar"

} */


let Object = {
  socket : req.body.id,
  Datos : "2",
  session : req.session.online,
  correo:req.session.correo
  
  }
  

ManejarSolicitud( Object , socket )
  // Lógica de negocio con el objeto recibido
  // ...

  // Envía una respuesta al cliente
  res.status(200).json({ message: 'Solicitud recibida con éxito' });
});


app.post('/ActivarAsistente', async (req, res) => {
  // Los datos enviados en el body del request están ahora en req.body
  const { IA, IDchat } = req.body; // Extrae las variables utilizando destructuring
let correo = req.session.correo
  // Imprime las variables recibidas para verificar

  const cliente = await BaseClientes.findOne({ correoCliente: correo })


  ReactivarIA( IA , IDchat , cliente.Id_chatbot);


  // Puedes procesar aquí los datos recibidos según necesites
  // ...

  // Envía una respuesta al cliente
  res.json({ message: 'Datos recibidos con éxito', IA, IDchat });
});



app.post('/cerrarsesion', (req, res) => {
  const { id } = req.body; // Extrae el ID del cuerpo de la solicitud
  req.session.correo = "";
  req.session.online = undefined;
  req.session.save(function(err) {
        } );

  res.status(200).send('Sesión cerrada'); // Envía una respuesta al cliente
})



  
 
  app.post("/webhook/:id", async (req, res) => {

    ///manejar imagenes


    if (req.body && 
      req.body.entry &&
      req.body.entry[0] && 
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0] &&
      req.body.entry[0].changes[0].value.messages[0].image &&
      req.body.entry[0].changes[0].value.messages[0].image.id) {

        ManejarYalmacenarImagenes(req)
}
    
if (req.body && 
  req.body.entry &&
  req.body.entry[0] && 
  req.body.entry[0].changes &&
  req.body.entry[0].changes[0] &&
  req.body.entry[0].changes[0].value &&
  req.body.entry[0].changes[0].value.messages &&
  req.body.entry[0].changes[0].value.messages[0] &&
  req.body.entry[0].changes[0].value.messages[0].type == 'audio'){

    ManejarYalmacenarAudios(req)
   
  
  }



///////////////////////////////

    const codigov = req.params.id;

    // Realizar la búsqueda de manera asíncrona
    const cliente = await BaseClientes.findOne({ Webhook: codigov })
    


    if (req.body.object === 'whatsapp_business_account') {
      res.sendStatus(200);
  } else {
      // Si no es un evento de WhatsApp Business, responde con un error
      res.sendStatus(400);
  }


    const webhookEvent = req.body;



    // Asegúrate de validar y autenticar tu webhook aquí
  // Revisa si es un mensaje de WhatsApp
if (webhookEvent.object === 'whatsapp_business_account') {

  webhookEvent.entry.forEach(entry => {
    entry.changes.forEach(change => {
      // Verifica que 'messages' existe y contiene al menos un elemento
      if (change.value.messages !== undefined && change.value.messages.length > 0) {
        const message = change.value.messages[0];

        // Manejo de mensajes interactivos
        if (message.type === 'interactive') {
          const selectedButtonId = message;
          if(selectedButtonId.interactive &&  selectedButtonId.interactive.button_reply.title){
          buscarYAlmacenar(selectedButtonId.from, "user", selectedButtonId.interactive.button_reply.title , cliente.Id_chatbot)
         keywordInterceptor( selectedButtonId.interactive.button_reply.id ,selectedButtonId.from , cliente.Tipo , cliente.Id_chatbot)
          return true;}
        }
      }
    });
  });
}


      

    let multimedia = manejarAdiosImagenes (req.body);
    if (multimedia == true) { 
    
      let phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from;
      EnvioRespuestaWP( phone_number_id , cliente.MensajeMultimedia , from)
      
    } else { 
      if (
        req.body.object && 
        req.body.entry &&
        req.body.entry[0].changes &&
        req.body.entry[0].changes[0].value.messages &&
        req.body.entry[0].changes[0].value.messages[0].text &&
        req.body.entry[0].changes[0].value.messages[0].text.body !== undefined
      ) {
        let phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id;
        let from = req.body.entry[0].changes[0].value.messages[0].from;
        let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body;
   
        if(phone_number_id && phone_number_id == cliente.Id_chatbot ){  
         
        ProcesadorDeMensajesAcumulativos(msg_body, from, phone_number_id)
        } else ( console.log("No coincide el ID de charbot"))
      } 
    }}); 
  
  

/////////// Autenticar y aprobar conexion con facebook

app.get('/webhook/:id', async (req, res) => {


        const codigov = req.params.id;


       
        // Realizar la búsqueda de manera asíncrona
        const cliente = await BaseClientes.findOne({ Webhook: codigov });
    
        if (cliente) {


    const verify_token =  cliente.TokenWH;
  
    // Parse params from the webhook verification request
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];
  
    // Check if a token and mode were sent
    if (mode && token) {
    
      // Check the mode and token sent are correct
      if (mode === "subscribe" && token == verify_token) {
   
        // Respond with 200 OK and challenge token from the request
    
        res.status(200).send(challenge);
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);
      }
    }
  }});






/// Resivir mensajes desde la api de whatsapp

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())

app.get('/webhook', function(req, res) {
  if (
    req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] == 'HolaMundo'
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});



app.post("/webhook", function (request, response) {
  console.log('Incoming webhook: ' + JSON.stringify(request.body));
  response.sendStatus(200);
});





////////////////////////////
app.post('/validacioncredenciales', async (req, res) => {
  try {
    const cliente = await BaseClientes.findOne({ correoCliente: req.body.correo });
    if (!cliente) {
      // Caso en que el correo electrónico no existe
      return res.json({ respuesta: "NoExiste" });
    }
    if (cliente.ContraseñaUsuario === req.body.contraseña) {
      // Caso en que las credenciales son correctas
      req.session.online = true;
      req.session.correo = req.body.correo;
      req.session.Identificador = req.session.Identificador || generarNumeroRandom();
      req.session.save(function(err) {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al guardar la sesión');
        }
        // Respuesta exitosa
        return res.json({ respuesta: true });
      });
    } else {
      // Caso en que la contraseña es incorrecta
      return res.json({ respuesta: false });
    }
  } catch (error) {
    console.error('Error en la validación de credenciales:', error);
    res.status(500).send('Error interno del servidor');
  }
});

function generarNumeroRandom() {
  let resultado = '';
  for (let i = 0; i < 20; i++) {
    resultado += Math.floor(Math.random() * 10).toString();
  }
  return resultado;
}

app.post('/registrodeusuario', async (req, res) => { 
  

  const cliente = await BaseClientes.findOne({ correoCliente: req.body.email }); 

  if(cliente) {
    res.json({redirectUrl: false}); 
    return false
  }


  function generarNumeroAlfanumerico(longitud) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < longitud; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
  }
  
  let Alfanum = generarNumeroAlfanumerico(30)

  console.log(Alfanum)
  // Enviar la URL de redireccionamiento como respuesta JSON


  const nuevoObjeto = new BaseClientes({
    correoCliente: req.body.email,
    ContraseñaUsuario : req.body.password,
    NameUser: req.body.name,
    userActivo:false,
    PanelControlNumber:Alfanum,
    
  });

  await nuevoObjeto.save();


  res.json({redirectUrl: Alfanum});

  let url = Dominio + "/ControlPanel/"+ Alfanum;

  GeneradorEstructuraMail("Confirme su correo electronico" ,  "Porfavor haga click en el boton mas abajo para confirmar el Email ingresado para la cuenta" , "Confirmar cuenta" , url , req.body.email , "Confirmacion de Correo Electronico Intervia" )

});


app.get('/ControlPanel/:id', async function(req, res) {
  const id = req.params.id;
  
  try {
    const Cliente = await BaseClientes.findOne({ PanelControlNumber: id  }); 

    if (Cliente) {
      console.log(Cliente)
      Cliente.userActivo = true;
      // Guardar el documento modificado

      req.session.online = true;
      req.session.correo = Cliente.correoCliente;


      await Cliente.save();
      // Redireccionar a la ruta '/ControlPanel'
      res.redirect('/ControlPanel');
    } else {
      res.send('Esta ceunta no existe');
    }
  } catch (error) {
    console.error('Error al guardar el documento:', error);
    res.status(500).send('Ocurrió un error al intentar activar el usuario.');
  }
});




///////////////// REESTABLECER CONTRASEÑA USUARIO

app.post('/restartuser', async (req, res) => { 


  function generarNumeroAlfanumerico(longitud) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < longitud; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
  }

let Alfanum = generarNumeroAlfanumerico(35)

  const Cliente = await BaseClientes.findOne({ correoCliente: req.body.email });
  
  if(Cliente){

    let url = Dominio +"/resetpas/"+ Alfanum;

    Cliente.PssTemporal = req.body.password;
    Cliente.NewPssNumber = Alfanum;

    await Cliente.save();
    res.json({rest: true});
    GeneradorEstructuraMail("Aprobar el reestablecimiento de su contraseña" , "Por favor haga clic en el botón de abajo para confirmar el restablecimiento de la contraseña para la cuenta asociada a este correo electrónico." , "Confirmar cambio" , url , req.body.email , "Confirmación de Restablecimiento de Contraseña")
  } else {
  // Enviar la URL de redireccionamiento como respuesta JSON
  res.json({rest: false});}

});

////// Confirmacion de receteo de contraseña

app.get('/resetpas/:id', async function(req, res) {
  const id = req.params.id;
  
  try {
    const Cliente = await BaseClientes.findOne({ NewPssNumber: id  }); 

    if (Cliente) {
 
     Cliente.ContraseñaUsuario = Cliente.PssTemporal;

      await Cliente.save();
      // Redireccionar a la ruta '/ControlPanel'
      res.redirect('/login');
    } else {
      res.send('Esta cuenta no existe');
    }
  } catch (error) {
    console.error('Error al guardar el documento:', error);
    res.status(500).send('Ocurrió un error al intentar activar el usuario.');
  }
});


app.get('/login/:id', async function(req, res) {
  const id = req.params.id; 

  res.redirect('/ControlPanel');

})


app.get('/ControlPanel', async function(req, res) {
  // Asumiendo que tienes un archivo llamado "archivo.pdf" en el directorio "public"
  const filePath = path.join(__dirname, 'public', 'verificar.html');
  
  // Enviar el archivo al cliente
  res.sendFile(filePath, function(err) {
    if (err) {
      // Si hay un error al enviar el archivo, envía un mensaje de error
      res.status(500).send('Error al enviar el archivo');
    }
  });
});



app.get('/Policy', (req, res) => { 


  const filePath = path.join(__dirname, 'public', 'PrivacyPolicy' ,'Policy.html');
  // Enviar el archivo al cliente
  res.sendFile(filePath, function(err) {
    if (err) {
      // Si hay un error al enviar el archivo, envía un mensaje de error
      res.status(500).send('Error al enviar el archivo');
    }
  });
});



app.get('/estadodeautenticacion', async (req, res) => {

  let correoCliente = req.session.correo;

let ArraydListo = [];

  const Cliente = await BaseClientes.findOne({ NewPssNumber: id  }); 

  const data = Array(10).fill(false);
  console.log("Estado")
  // Enviar el array como respuesta en formato JSON
  res.json(data);
});


