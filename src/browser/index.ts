import {
  ClientMessage,
  ErrorData,
  ServerMessage,
} from '../global-types';

document.getElementById('minute-up')!.onclick = () => {
  sendMsg({ type: 'minuteUp' });
};
document.getElementById('minute-down')!.onclick = () => {
  sendMsg({ type: 'minuteDown' });
};
document.getElementById('second-up')!.onclick = () => {
  sendMsg({ type: 'secondUp' });
};
document.getElementById('second-down')!.onclick = () => {
  sendMsg({ type: 'secondDown' });
};
document.getElementById('start')!.onclick = () => {
  sendMsg({ type: 'start' });
};
document.getElementById('pause')!.onclick = () => {
  sendMsg({ type: 'pause' });
};
document.getElementById('reset')!.onclick = () => {
  sendMsg({ type: 'reset' });
};
document.getElementById('plus-minute')!.onclick = () => {
  sendMsg({ type: 'plusMinute' });
};
document.getElementById('minus-minute')!.onclick = () => {
  sendMsg({ type: 'minusMinute' });
};

const server_address = location.origin.replace(/^http/, 'ws');

let startMinutes = '00';
let startSeconds = '00';
let currentTime = '00:00';

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
      if (parsedData.props) {
        updateStart(parsedData.props.startTime);        
      }
      if (parsedData.text) {
        updateTime(parsedData.text.time);
        console.log(parsedData.text);
      }
    } catch (error) {
      blError('Error parsing JSON data', { data: error });
    }
  } else {
    blError('Received non-string data', { data: msg.data });
  }
};

function sendMsg(msg: ClientMessage) {
  ws.send(JSON.stringify(msg));
}

function blError(description: string, data?: ErrorData) {
  console.error(`Foundry-Schedule Error: "${description}"`);
  if (data)
    console.error(`Foundry-Schedule Error data: "${JSON.stringify(data)}"`);
  if (ws.OPEN) ws.send(JSON.stringify({ error: description, data: data }));
}

function updateTime(time: string) {
  currentTime = time;
  if (time) {
    const [timeMinutes, timeSeconds] = time.split(':');
    document.getElementById('current-minutes')!.innerHTML = timeMinutes;
    document.getElementById('current-seconds')!.innerHTML = timeSeconds;
  } else {
    document.getElementById('current-minutes')!.innerHTML = startMinutes;
    document.getElementById('current-seconds')!.innerHTML = startSeconds;
  }
}

function updateStart(minutesIn: number) {
  startSeconds = ((minutesIn % 1) * 60).toString().padStart(2, '0');
  startMinutes = Math.floor(minutesIn).toString().padStart(2, '0');
  document.getElementById('start-minutes')!.innerHTML = startMinutes;
  document.getElementById('start-seconds')!.innerHTML = startSeconds;
  if (!currentTime) updateTime('');
}
