

import axios from 'axios';



export async function sendEmail(AsuntoCoreo, ContenidoCorre,CorreoObjetivo ) {

    let tenantID = "5ee63c21-4a48-44ae-b450-cd99773ff8d1" // Get from Azure App Registration
  let oAuthClientID = "75a64563-17da-4eb2-80e3-0955bcf3a42d" // Get from Azure App Registration
  let clientSecret = "ale8Q~GESApT.agS4FSb6MKvBJ3oc8tox4Woodop" // Get from Azure App Registration
  let oAuthToken; // declared, gets defined if successfully fetched
  
  let userFrom = "soporte@intervia.com.ar"
  let msgPayload = { 
    //Ref: https://learn.microsoft.com/en-us/graph/api/resources/message#properties
    message: {
      subject: AsuntoCoreo,
      body: {
        contentType: 'HTML',
        content: ContenidoCorre,
      },
      toRecipients: [{emailAddress: {address: CorreoObjetivo}}]
    }
  };
  
  //using axios as http helper
  await axios({ // Get OAuth token to connect as OAuth client
    method: 'post',
    url: `https://login.microsoftonline.com/${tenantID}/oauth2/token`,
    data: new URLSearchParams({
      client_id: oAuthClientID,
      client_secret: clientSecret,
      resource: "https://graph.microsoft.com",
      grant_type: "client_credentials"
    }).toString()
  })
  .then(r => oAuthToken = r.data.access_token)
  
  await axios ({ // Send Email using Microsoft Graph
    method: 'post',
    url: `https://graph.microsoft.com/v1.0/users/${userFrom}/sendMail`,
    headers: {
      'Authorization': "Bearer " + oAuthToken,
      'Content-Type': 'application/json'
    },
    data: msgPayload
  })}
  


  export function GeneradorEstructuraMail(Titulo ,  Descripcion , Boton , UrlBoton , Correo , Asunto ){

  let cuerpo =   `
    <!DOCTYPE html>
    <html>
    <head>
     <title>Email Verification</title>
     <link rel="stylesheet" type="text/css" href="styles.css">
    </head>
    <style>
    
    body {
     background-color: #333;
     font-family: Arial, sans-serif;
    }
    
    .container {
     width: 500px;
     background-color: #444;
     padding: 40px;
     margin: 50px auto;
     border-radius: 4px;
     box-shadow: 0px 0px 10px 1px rgba(255, 255, 255, 0.562);
    }
    
    h1 {
     font-size: 22px;
     margin-bottom: 20px;
     color: #ddd;
     text-align: center;
    }
    
    p {
     font-size: 18px;
     margin-bottom: 30px;
     color: #bbb;
    }
    
    .verify-button {
     display: block;
     width: 200px;
     height: 50px;
     background-color: #446688;
     color: #fff;
     border-radius: 4px;
     text-decoration: none;
     text-align: center;
     line-height: 50px;
     margin: 0 auto;
     color : white;
     }
    
    .verify-button:hover {
     background-color: #334d66;
     color : white;
     }
    
    .logo {
     display: block;
     width: 250px;
     height: auto;
     margin: 0 auto;
     margin-bottom: 30px;
     }
    
    </style>
    <body>
     <div class="container">
     <img src="https://remoto.rhglobal.com.ar/login/static/media/Intervia_inicio.816b27c7fd58d4fd6772.png" class="logo">
     <h1>${Titulo}</h1>
     <p>${Descripcion}</p>
     <a href="${UrlBoton}" class="verify-button">${Boton}</a>
     </div>
    </body>
    </html>
  
    `;


    sendEmail(Asunto, cuerpo ,Correo ) 

  }