import { Chats } from '../datos/ConfigDB.js'

export async function contarTokens(texto, IDchat) {
    try {
        const chat = await Chats.findOne({ IDchat: IDchat });

        if (!chat) {
            console.log('Chat no encontrado');
            return;
        }

        if (typeof chat.Consumo !== 'number') {
            chat.Consumo = 0;
        }

        if (typeof texto !== 'string') {
            console.log('El argumento debe ser un string');
            return;
        }

        // Ajuste del costo por 1000 caracteres
        const costoPor1000Caracteres = 0.03; // Nuevo valor
        const costoPorCaracter = costoPor1000Caracteres / 1000;
        const costoTotal = texto.length * costoPorCaracter;

        const resultado = chat.Consumo + costoTotal;
        chat.Consumo = resultado;
        await chat.save();

        console.log("Total costo chat " + resultado);
    } catch (error) {
        console.error("Error al contar tokens: ", error);
    }
}

