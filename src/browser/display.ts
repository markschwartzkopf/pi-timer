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
  warning: 0,
  flash: false,
};
const timeDiv = document.getElementById('time') as HTMLDivElement;

const server_address = location.origin.replace(/^http/, 'ws');

let cursorTimeout: NodeJS.Timeout | null = null;

let currentText: 'time' | 'message' = 'time';

function hideCursor() {
  document.body.style.cursor = 'none';
  document.body.parentElement!.style.cursor = 'none';
  document.getElementById('ip-address')!.style.display = 'none';
}

setTimeout(() => {
  hideCursor();
}, 100);

document.addEventListener('mousemove', () => {
  if (cursorTimeout) {
    clearInterval(cursorTimeout);
  }
  cursorTimeout = setTimeout(() => {
    hideCursor();
  }, 5000);
  document.body.style.cursor = 'default';
  document.body.parentElement!.style.cursor = 'default';
  document.getElementById('ip-address')!.style.display = 'unset';
});

let ws = new WebSocket(server_address);

function connectWebSocket() {
  if (ws.readyState !== ws.CONNECTING) {
    const oldWs = ws;
    oldWs.close();
    ws = new WebSocket(server_address);
  }
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
          if (currentText === 'time') {
            timeDiv.style.fontSize = `${settings.timeSize}vh`;
          } else {
            timeDiv.style.fontSize = `${settings.messageSize}vh`;
          }
        }
        if (parsedData.text) {
          updateScreen(parsedData.text);
        }
        if (parsedData.ipAddress) {
          document.getElementById('ip-address')!.innerHTML =
            parsedData.ipAddress;
        }
      } catch (error) {
        blError('Error parsing JSON data', { data: error });
      }
    } else {
      blError('Received non-string data', { data: msg.data });
    }
  };
}
connectWebSocket();

setInterval(() => {
  if (ws.readyState !== ws.OPEN) {
    console.log('Reconnecting to WebSocket');
    connectWebSocket();
  }
}, 1000);

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
    currentText = 'message';
    timeDiv.style.fontSize = `${settings.messageSize}vh`;
  } else {
    currentText = 'time';
    timeDiv.style.fontSize = `${settings.timeSize}vh`;
  }
  if (text.state !== 'warning' && flashTimeout) {
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
    case 'warning':
      if (!flashTimeout) {
        flashTimeout = setInterval(() => {
          const oldColor = timeDiv.style.color;
          if (settings.flash) {
            timeDiv.style.color = oldColor === 'black' ? 'red' : 'black';
            document.body.style.backgroundColor =
              oldColor === 'black' ? 'black' : 'red';
          } else {
            timeDiv.style.color = 'black';
            document.body.style.backgroundColor = 'red';
          }
        }, 1000);
      }
      break;
  }
}
