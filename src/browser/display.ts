//import { clientMessage, ErrorData, serverMessage } from "../global-types";
import {
  ClientText,
  ErrorData,
  ServerMessage,
  TimerSettings,
} from '../global-types';

let settings: TimerSettings = {
  timeSize: 50,
  messageSize: 30,
  yellow: 2,
  red: 1,
  flash: 0,
};
const timeDiv = document.getElementById('time') as HTMLDivElement;

const server_address = location.origin.replace(/^http/, 'ws');

const ws = new WebSocket(server_address);
ws.binaryType = 'arraybuffer';

ws.onopen = () => {
  console.log(`Connection to ${server_address} open`);
};

ws.onerror = (err) => {
  blError('WebSocket error', { error: JSON.stringify(err) });
};

ws.onmessage = (msg) => {
  if (typeof msg.data === 'string') {
    try {
      const parsedData = JSON.parse(msg.data) as ServerMessage;
      if (parsedData.settings) {
        settings = parsedData.settings;
      }
      if (parsedData.text) {
        updateScreen(parsedData.text);
      }
    } catch (error) {
      blError('Error parsing JSON data', { data: error });
    }
  } else {
    blError('Received non-string data', { data: msg.data });
  }
};

/* function sendMsg(msg: clientMessage) {
	ws.send(JSON.stringify(msg));
} */

function blError(description: string, data?: ErrorData) {
  console.error(`Foundry-Schedule Error: "${description}"`);
  if (data)
    console.error(`Foundry-Schedule Error data: "${JSON.stringify(data)}"`);
  if (ws.OPEN) ws.send(JSON.stringify({ error: description, data: data }));
}
let flashTimeout: NodeJS.Timeout | undefined;
function updateScreen(text: ClientText) {
  timeDiv.innerHTML = text.message ? text.message : text.time;
  if (text.message) {
    timeDiv.style.fontSize = `${settings.messageSize}vh`;
  } else {
    timeDiv.style.fontSize = `${settings.timeSize}vh`;
  }
  if (text.state !== 'flashing' && flashTimeout) {
    clearTimeout(flashTimeout);
    flashTimeout = undefined;
    document.body.style.backgroundColor = 'black';
  }
  switch (text.state) {
    case 'normal':
      timeDiv.style.color = 'white';
      break;
    case 'yellow':
      timeDiv.style.color = 'yellow';
      break;
    case 'red':
      timeDiv.style.color = 'red';
      break;
    case 'flashing':
      if (!flashTimeout) {
        flashTimeout = setInterval(() => {
          const oldColor = timeDiv.style.color;
          timeDiv.style.color = oldColor === 'black' ? 'red' : 'black';
          document.body.style.backgroundColor =
            oldColor === 'black' ? 'black' : 'red';
        }, 1000);
      }

      break;
  }
}