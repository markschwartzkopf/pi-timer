import { ClientMessage, ErrorData, ServerMessage } from '../global-types';

let flash=true;

document.getElementById('minute-up')!.onclick = () => {
  sendMsg({ type: 'minuteUp' });
};
document.getElementById('minute-down')!.onclick = () => {
  sendMsg({ type: 'minuteDown' });
};
let lastStartMinuteClick = 0;
const startMinutesTd = document.getElementById(
  'start-minutes'
) as HTMLTableCellElement;
startMinutesTd.style.touchAction = 'manipulation';
startMinutesTd.ontouchstart = (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
};
let oldMinutes = '00';
function editStartMinutes() {
  oldMinutes = startMinutesTd.innerHTML;
  startMinutesTd.contentEditable = 'true';
  startMinutesTd.focus();
  startMinutesTd.onblur = () => {
    const newMinutes = startMinutesTd.innerHTML;
    const newMinutesNumber = parseInt(newMinutes);
    if (newMinutesNumber && newMinutesNumber > 0 && newMinutes !== oldMinutes) {
      sendMsg({ type: 'setMinutes', minutes: newMinutesNumber });
    } else {
      startMinutesTd.innerHTML = oldMinutes;
    }
    startMinutesTd.contentEditable = 'false';
  };
  const range = document.createRange();
  range.selectNodeContents(startMinutesTd);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}
startMinutesTd.ontouchend = (e) => {  
  const now = Date.now();
  if (now - lastStartMinuteClick < 300) {
    editStartMinutes();
  }
  lastStartMinuteClick = now;
  e.preventDefault();
};
startMinutesTd.onkeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    startMinutesTd.blur();
  }
};
startMinutesTd.ondblclick = () => {
  editStartMinutes();
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
  sendMsg({ type: 'modifyTime', change: 30 });
};
const minusMinute = document.getElementById('minus-minute') as HTMLDivElement;
minusMinute.onclick = () => {
  sendMsg({ type: 'modifyTime', change: -30 });
};
const messageModal = document.getElementById('message-modal') as HTMLDivElement;
const messagebox = document.getElementById('messagebox') as HTMLDivElement;
const message = document.getElementById('message') as HTMLDivElement;
let messageFlash = false;
setInterval(() => {
  if (messageFlash) {
    if (flash) {
      const oldColor = message.style.color;
      message.style.color = oldColor === 'black' ? 'red' : 'black';
      messagebox.style.backgroundColor = oldColor === 'black' ? 'black' : 'red';
    } else {
      message.style.color = 'black';
      messagebox.style.backgroundColor = 'red';
    }
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
const warning = document.getElementById('warning') as HTMLDivElement;
warning.onclick = () => {
  messageFlash = !messageFlash;
  if (messageFlash) {
    warning.classList.remove('inactive');
  } else {
    warning.classList.add('inactive');
    message.style.color = 'white';
    messagebox.style.backgroundColor = 'black';
  }
};
const sendButton = document.getElementById('send') as HTMLDivElement;
sendButton.onclick = () => {
  if (sendButton.classList.contains('inactive')) return;
  sendMsg({
    type: 'sendMessage',
    message: message.innerHTML,
    warning: messageFlash,
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
    sendMsg({ type: 'sendMessage', message: '', warning: false });
    return;
  }
  //reset message modal
  messageFlash = false;
  warning.classList.add('inactive');
  sendButton.classList.add('inactive');
  message.innerHTML = '';
  message.style.color = 'white';
  messagebox.style.backgroundColor = 'black';
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
          flash = parsedData.settings.flash;
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
  startMinutesTd.innerHTML = startMinutes;
  document.getElementById('start-seconds')!.innerHTML = startSeconds;
  if (!currentTime) updateTime('');
}
