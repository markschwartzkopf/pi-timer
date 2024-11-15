import {
  ClientMessage,
  ErrorData,
  ServerMessage,
  TimerSettings,
} from '../global-types';

const server_address = location.origin.replace(/^http/, 'ws');

const timeSizeRange = document.getElementById('time-size') as HTMLInputElement;
const messageSizeRange = document.getElementById(
  'message-size'
) as HTMLInputElement;
const yellowInput = document.getElementById('yellow') as HTMLInputElement;
const yellowDisable = document.getElementById(
  'yellow-disable'
) as HTMLInputElement;
const redInput = document.getElementById('red') as HTMLInputElement;
const redDisable = document.getElementById('red-disable') as HTMLInputElement;
const flashInput = document.getElementById('flash') as HTMLInputElement;
const flashDisable = document.getElementById(
  'flash-disable'
) as HTMLInputElement;
const rebootButton = document.getElementById('reboot') as HTMLButtonElement;
rebootButton.onclick = () => {
  if (confirm('Are you sure you want to reboot the timer Pi?'))
    sendMsg({ type: 'reboot' });
};

let settings: TimerSettings = {
  timeSize: 50,
  messageSize: 30,
  yellow: 2,
  red: 1,
  flash: 0,
};

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
          if (parseInt(timeSizeRange.value) !== settings.timeSize)
            timeSizeRange.value = settings.timeSize.toString();
          if (parseInt(messageSizeRange.value) !== settings.messageSize)
            messageSizeRange.value = settings.messageSize.toString();
          if (settings.yellow !== null) yellowDisable.style.display = '';
          if (parseFloat(yellowInput.value) !== settings.yellow) {
            if (settings.yellow === null) {
              yellowInput.value = '';
              yellowDisable.style.display = 'none';
            } else {
              yellowInput.value = settings.yellow.toString();
            }
          }
          if (settings.red !== null) redDisable.style.display = '';
          if (parseFloat(redInput.value) !== settings.red) {
            if (settings.red === null) {
              redInput.value = '';
              redDisable.style.display = 'none';
            } else {
              redInput.value = settings.red.toString();
            }
          }
          if (settings.flash !== null) flashDisable.style.display = '';
          if (parseFloat(flashInput.value) !== settings.flash) {
            if (settings.flash === null) {
              flashInput.value = '';
              flashDisable.style.display = 'none';
            } else {
              flashInput.value = settings.flash.toString();
            }
          }
        }
        if (parsedData.canReboot) {
          console.log('Reboot button enabled');
          rebootButton.style.display = '';
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

function sendMsg(msg: ClientMessage) {
  ws.send(JSON.stringify(msg));
}

function blError(description: string, data?: ErrorData) {
  console.error(`Foundry-Schedule Error: "${description}"`);
  if (data)
    console.error(`Foundry-Schedule Error data: "${JSON.stringify(data)}"`);
  if (ws.OPEN) ws.send(JSON.stringify({ error: description, data: data }));
}

timeSizeRange.onmouseup = () => {
  setTime();
};
timeSizeRange.ontouchend = () => {
  setTime();
};

function setTime() {
  const timeSize = parseInt(timeSizeRange.value);
  sendMsg({ type: 'setSetting', setting: 'timeSize', value: timeSize });
}

messageSizeRange.onmouseup = () => {
  setMessage();
};

messageSizeRange.ontouchend = () => {
  setMessage();
};

function setMessage() {
  const messageSize = parseInt(messageSizeRange.value);
  sendMsg({ type: 'setSetting', setting: 'messageSize', value: messageSize });
}

yellowInput.onchange = () => {
  let newValue = parseFloat(yellowInput.value);
  if (newValue < 0) {
    newValue = 0;
    yellowInput.value = '0';
  }
  if (!isNaN(newValue)) {
    sendMsg({ type: 'setSetting', setting: 'yellow', value: newValue });
  }
};

yellowDisable.onclick = () => {
  sendMsg({ type: 'setSetting', setting: 'yellow', value: null });
};

redInput.onchange = () => {
  let newValue = parseFloat(redInput.value);
  if (newValue < 0) {
    newValue = 0;
    redInput.value = '0';
  }
  if (!isNaN(newValue)) {
    sendMsg({ type: 'setSetting', setting: 'red', value: newValue });
  }
};

redDisable.onclick = () => {
  sendMsg({ type: 'setSetting', setting: 'red', value: null });
};

flashInput.onchange = () => {
  let newValue = parseFloat(flashInput.value);
  if (newValue < 0) {
    newValue = 0;
    flashInput.value = '0';
  }
  if (!isNaN(newValue)) {
    sendMsg({ type: 'setSetting', setting: 'flash', value: newValue });
  }
};

flashDisable.onclick = () => {
  sendMsg({ type: 'setSetting', setting: 'flash', value: null });
};
