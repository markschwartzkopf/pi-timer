import fs from 'fs';
import { TimerProps, TimerSettings } from '../global-types';
import { blLog } from './logger';

//starter data that will be overwritten from stored data if it exists:
let props: TimerProps = {
  startTime: 3,
};
export function getProps() {
  return props;
}

let settings: TimerSettings = {
  timeSize: 50,
  messageSize: 30,
  yellow: 2,
  red: 1,
  flash: 0,
};
export function getSettings() {
  return settings;
}

export function sendData(type: 'props' | 'settings' | 'state' | 'text'): void {
  sendDataFunction(type);
}

let sendDataFunction: (
  type: 'props' | 'settings' | 'state' | 'text'
) => void = () => {
  blLog.error('sendData function not initialized');
};

export function setSendDataFunction(
  func: (type: 'props' | 'settings' | 'state' | 'text') => void
) {
  sendDataFunction = func;
}

export function initializeData() {
  //data directory
  const dataDir = './data';
  // Check if directory exists, and create it if it doesn't
  return fs.promises
    .access(dataDir)
    .catch(() => {
      return fs.promises.mkdir(dataDir, { recursive: true }).catch((err) => {
        blLog.error('Error creating data directory', err);
      });
    })
    .then(() => {
      return fs.promises
        .readFile(dataDir + '/props.json')
        .then((data) => {
          console.log('reading props file');
          props = JSON.parse(data.toString());
        })
        .catch(async () => {
          console.error('creating props file');
          fs.promises.writeFile(dataDir + '/props.json', JSON.stringify(props));
        });
    })
    .then(() => {
      return fs.promises
        .readFile(dataDir + '/settings.json')
        .then((data) => {
          console.log('reading settings file');
          settings = JSON.parse(data.toString());
        })
        .catch(async () => {
          console.error('creating settings file');
          fs.promises.writeFile(
            dataDir + '/settings.json',
            JSON.stringify(settings)
          );
        });
    })
    .catch((err) => {
      blLog.error('Error initializing data:', err);
    });
}

export function setStart(
  unit: 'minutes' | 'seconds' | 'absoluteMinutes',
  modification: 'up' | 'down' | number
) {
  if (typeof modification === 'number') {
    const startMinutes = Math.floor(props.startTime);
    const startSeconds = (props.startTime % 1) * 60;
    if (unit === 'minutes') {
      props.startTime = modification + startSeconds / 60;
    } else if (unit === 'seconds') {
      props.startTime = startMinutes + modification / 60;
    } else if (unit === 'absoluteMinutes') {
      props.startTime = modification;
    }
  } else {
    let increment = 0;
    if (unit === 'minutes') {
      increment = modification === 'up' ? 1 : -1;
    } else {
      increment = modification === 'up' ? 0.25 : -0.25;
    }
    props.startTime += increment;
  }
  fs.promises.writeFile('./data/props.json', JSON.stringify(props));
  sendData('props');
}

export function setSize(
  type: 'timeSize' | 'messageSize',
  newSize: number | 'plus' | 'minus'
) {
  if (newSize === 'plus') {
    settings[type] += 1;
  } else if (newSize === 'minus') {
    settings[type] -= 1;
  } else {
    settings[type] = newSize;
  }
  fs.promises
    .writeFile('./data/settings.json', JSON.stringify(settings))
    .catch((err) => {
      blLog.error('Error writing settings file', err);
    });
  sendData('settings');
}

export function setColor(
  color: 'yellow' | 'red' | 'flash',
  newColor: number | null
) {
  settings[color] = newColor;
  fs.promises
    .writeFile('./data/settings.json', JSON.stringify(settings))
    .catch((err) => {
      blLog.error('Error writing settings file', err);
    });
  sendData('settings');
}
