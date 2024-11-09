import { ClientMessage, ErrorData, ServerMessage } from '../global-types';

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
const startButton = document.getElementById('start') as HTMLDivElement;
startButton.onclick = () => {
  sendMsg({ type: 'start' });
};
const pauseButton = document.getElementById('pause') as HTMLDivElement;
pauseButton.onclick = () => {
  sendMsg({ type: 'pause' });
};
const resetButton = document.getElementById('reset') as HTMLDivElement;
resetButton.onclick = () => {
  sendMsg({ type: 'reset' });
};
const plusMinute = document.getElementById('plus-minute') as HTMLDivElement;
plusMinute.onclick = () => {
  sendMsg({ type: 'plusMinute' });
};
const minusMinute = document.getElementById('minus-minute') as HTMLDivElement;
minusMinute.onclick = () => {
  sendMsg({ type: 'minusMinute' });
};
const messageModal = document.getElementById('message-modal') as HTMLDivElement;
const message = document.getElementById('message') as HTMLDivElement;
let messageFlash = false;
setInterval(() => {
  if (messageFlash) {
    const oldColor = message.style.color;
    message.style.color = oldColor === 'black' ? 'red' : 'black';
    message.style.backgroundColor = oldColor === 'black' ? 'black' : 'red';
  }
}, 1000);
const sizePlus = document.getElementById('size-plus') as HTMLDivElement;
const sizeMinus = document.getElementById('size-minus') as HTMLDivElement;
sizePlus.onclick = () => {
  sendMsg({ type: 'messageSizePlus' });
};
sizeMinus.onclick = () => {
  sendMsg({ type: 'messageSizeMinus' });
};
const flashing = document.getElementById('flashing') as HTMLDivElement;
flashing.onclick = () => {
  messageFlash = !messageFlash;
  if (messageFlash) {
    flashing.classList.remove('inactive');
  } else {
    flashing.classList.add('inactive');
    message.style.color = 'white';
    message.style.backgroundColor = 'black';
  }
};
const sendButton = document.getElementById('send') as HTMLDivElement;
sendButton.onclick = () => {
  if (sendButton.classList.contains('inactive')) return;
  sendMsg({
    type: 'sendMessage',
    message: message.innerHTML,
    flashing: messageFlash,
  });
  messageModal.classList.remove('show');
};
message.oninput = () => {
  if (message.innerHTML) {
    sendButton.classList.remove('inactive');
  } else {
    sendButton.classList.add('inactive');
  }
};
let messageActive = false;
const summonOrBanishMessage = document.getElementById(
  'summon-message-modal'
) as HTMLDivElement;
summonOrBanishMessage.onclick = () => {
  if (messageActive) {
    sendMsg({ type: 'sendMessage', message: '', flashing: false });
    return;
  }
  //reset message modal
  messageFlash = false;
  flashing.classList.add('inactive');
  sendButton.classList.add('inactive');
  message.innerHTML = '';
  message.style.color = 'white';
  message.style.backgroundColor = 'black';
  messageModal.classList.add('show');
  message.focus();
};
messageModal.onclick = (e) => {
  if (e.target === messageModal) {
    messageModal.classList.remove('show');
  }
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
        const message = parsedData.text.message;
        messageActive = !!message;
        if (messageActive) {
          summonOrBanishMessage.innerHTML = 'Remove Message';
        } else {
          summonOrBanishMessage.innerHTML = 'Send Message';
        }
      }
      if (parsedData.settings) {
        document.getElementById(
          'message'
        )!.style.fontSize = `calc((${parsedData.settings.messageSize} * 7.33rem)/100)`;
      }
      if (parsedData.state) {
        switch (parsedData.state) {
          case 'running':
            startButton.classList.add('inactive');
            pauseButton.classList.remove('inactive');
            resetButton.classList.remove('inactive');
            plusMinute.classList.remove('inactive');
            minusMinute.classList.remove('inactive');
            break;
          case 'paused':
            startButton.classList.remove('inactive');
            pauseButton.classList.add('inactive');
            resetButton.classList.remove('inactive');
            plusMinute.classList.remove('inactive');
            minusMinute.classList.remove('inactive');
            break;
          case 'finished':
            startButton.classList.remove('inactive');
            pauseButton.classList.add('inactive');
            resetButton.classList.remove('inactive');
            plusMinute.classList.add('inactive');
            minusMinute.classList.add('inactive');
            break;
          case 'ready':
            startButton.classList.remove('inactive');
            pauseButton.classList.add('inactive');
            resetButton.classList.add('inactive');
            plusMinute.classList.add('inactive');
            minusMinute.classList.add('inactive');
            break;
        }
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
