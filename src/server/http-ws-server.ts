import http from 'http';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WebSocket } from 'ws';
import { blLog, ErrorData } from './logger';
import {
  ClientMessage,
  ClientText,
  ServerMessage,
  TimerState,
} from '../global-types';
import {
  getProps,
  getSettings,
  sendData,
  setSendDataFunction,
  setSize,
  setStart,
} from './data';
//import {} from './data';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
};

const STATIC_PATH = path.join(__dirname, '../../dist/browser/');
const PORT = process.env.PORT || 9099;

let time = getProps().startTime * 60;
let timeAtStart = time;
let startTime = Date.now();
let state: TimerState = 'ready';
let message: Omit<ClientText, 'time'> = { message: '', state: 'normal' };

const httpServer = http
  .createServer((req, res) => {
    let filePath = '.' + req.url;
    /* istanbul ignore next */
    if (filePath == './') {
      filePath = './index.html';
    }
    const fileExtention = String(path.extname(filePath)).toLowerCase();
    let contentType = 'text/html';
    if (fileExtention in mimeTypes)
      contentType = mimeTypes[fileExtention as keyof typeof mimeTypes];
    const localPath = path.join(STATIC_PATH, filePath);
    fs.readFile(localPath)
      .then((buf) => {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(buf, 'utf-8');
      })
      .catch((err) => {
        if (err.code && err.code === 'ENOENT') {
          console.log(`Missing file requested at ${localPath}`);
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('File not found', 'utf-8');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('Unknown error: ' + JSON.stringify(err), 'utf-8');
        }
      });
  })
  .listen(PORT, () => {
    console.log(`Http server started on port ${PORT}`);

    const connections: WebSocket[] = [];

    setSendDataFunction((type: 'props' | 'settings' | 'state' | 'text') => {
      const msg: ServerMessage = {};
      switch (type) {
        case 'props':
          msg.props = getProps();
          if (state === 'ready') time = getProps().startTime * 60;
          break;
        case 'settings':
          msg.settings = getSettings();
          break;
        case 'state':
          msg.state = state;
          break;
        case 'text':
          msg.text = clientText();
          break;
      }
      connections.forEach((ws) => {
        ws.send(JSON.stringify(msg));
      });
    });

    console.log('Starting ws server attached to http server');
    const wss = new WebSocket.Server({ server: httpServer });

    wss.on('connection', (ws) => {
      const msg: ServerMessage = {
        props: getProps(),
        settings: getSettings(),
        state: state,
        text: clientText(),
        ipAddress: getLocalIP()
      };
      ws.send(JSON.stringify(msg));

      connections.push(ws);
      console.log(
        `WebSocket connection opened. Total connections: ${connections.length}`
      );

      ws.on('error', console.error);

      ws.on('message', (data) => {
        try {
          const obj = JSON.parse(data.toString());
          if (typeof obj === 'object' && obj.error) {
            const err = obj.error as string;
            const data = obj.data as ErrorData | undefined;
            blLog.browserError(err, data);
          } else {
            const msg = obj as ClientMessage;
            switch (msg.type) {
              case 'minuteUp':
                setStart('minutes', 'up');
                break;
              case 'minuteDown':
                setStart('minutes', 'down');
                break;
              case 'secondUp':
                setStart('seconds', 'up');
                break;
              case 'secondDown':
                setStart('seconds', 'down');
                break;
              case 'messageSizePlus':
                setSize('messageSize', 'plus');
                break;
              case 'messageSizeMinus':
                setSize('messageSize', 'minus');
                break;
                case 'sendMessage':
                  {
                    message = { message: msg.message, state: msg.flashing ? 'flashing' : 'normal' };
                    sendData('text');
                  }
                  break;
              case 'start':
                {
                  if (state === 'finished') {
                    time = getProps().startTime * 60;
                  }
                  timeAtStart = time;
                  startTime = Date.now();
                  state = 'running';
                  sendData('state');
                }
                break;
              case 'pause':
                {
                  state = 'paused';
                  sendData('state');
                }
                break;
              case 'reset':
                {
                  time = getProps().startTime * 60;
                  timeAtStart = time;
                  startTime = Date.now();
                  state = 'ready';
                  sendData('state');
                  sendData('text');
                }
                break;
              case 'plusMinute':
                if (state !== 'running' && state !== 'paused') return;
                {
                  time += 60;
                  timeAtStart = time;
                  startTime = Date.now();
                  sendData('text');
                }
                break;
              case 'minusMinute':
                if (state !== 'running' && state !== 'paused') return;
                if (time > 60) {
                  time -= 60;
                  timeAtStart = time;
                  startTime = Date.now();
                  sendData('text');
                } else {
                  time = 0;
                  timeAtStart = time;
                  startTime = Date.now();
                  state = 'finished';
                  sendData('text');
                  sendData('state');
                }
                break;
              default:
                // @ts-ignore
                console.log('Unknown message type: ' + msg.type);
                console.log('received: ' + data.toString());
                break;
            }
          }
        } catch {
          blLog.error('Error parsing JSON from WebSocket', {
            data: data.toString(),
          });
        }
      });

      ws.on('close', () => {
        //keyChange.off('change', socketKeysub);
        console.log('WebSocket connection closed');
        const index = connections.indexOf(ws);
        if (index === -1) {
          blLog.error(`Closed WebSocket missing from WebSocket array`);
          return;
        }
        connections.splice(index, 1);
      });
    });
  });

setInterval(() => {
  if (state === 'running') {
    const newTime = Math.round(timeAtStart - (Date.now() - startTime) / 1000);
    if (newTime !== time) {
      time = newTime;
      if (time <= 0) {
        time = 0;
        state = 'finished';
        sendData('state');
      }
      sendData('text');
    }
  }
}, 100);

function clientText(): ClientText {
  let timeString = '';
  const preciseMinutes = time / 60;
  const minutes = Math.floor(preciseMinutes);
  const seconds = time % 60;
  if (state === 'ready') {
    timeString = '';
  } else {
    timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  const settings = getSettings();
  let textState: ClientText['state'] = 'normal';

  if (
    state != 'ready' &&
    settings.yellow != null &&
    preciseMinutes <= settings.yellow
  ) {
    textState = 'yellow';
  }
  if (
    state != 'ready' &&
    settings.red != null &&
    preciseMinutes <= settings.red
  ) {
    textState = 'red';
  }
  if (
    state != 'ready' &&
    settings.flash != null &&
    preciseMinutes <= settings.flash
  ) {
    textState = 'flashing';
  }
  const rtn: ClientText = { time: timeString, state: textState };
  if (message.message) {
    rtn.message = message.message;
    rtn.state = message.state;
  }
  return rtn;
}



function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'No IP address found'; // Fallback to localhost if no external IP is found
}