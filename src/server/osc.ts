import dgram from 'dgram';
import { blLog } from './logger';
import { pause, reset, start } from './http-ws-server';
import { setStart } from './data';

type OscInt = {
  type: 'int';
  value: number;
};
type OscFloat = {
  type: 'float';
  value: number;
};
type OscString = {
  type: 'string';
  value: string;
};
type OscArgument = OscInt | OscFloat | OscString;
type OscMessage = { address: string[]; arguments: OscArgument[] };

const PORT = 8000;

const server = dgram.createSocket('udp4');

const subscribedAddresses: {
  [k: string]: { port: number; secondsLeft: number };
} = {};
export function sendStateToClients(state: number | string) {
  const message: OscMessage = {
    address: ['state'],
    arguments: [
      typeof state === 'number'
        ? { type: 'int', value: state }
        : { type: 'string', value: state },
    ],
  };
  Object.entries(subscribedAddresses).forEach(([address, value]) => {
    send(message, address, value.port);
  });
}

setInterval(() => {
  Object.entries(subscribedAddresses).forEach(([address, value]) => {
    value.secondsLeft--;
    if (value.secondsLeft <= 0) {
      delete subscribedAddresses[address];
    }
  });
}, 1000);

server.on('error', (err) => {
  blLog.error(`Server error:\n${err.stack}`);
  server.close();
});

server.on('message', (buf, rinfo) => {
  let offset = 0;
  function skipToNextBlock() {
    if (offset % 4 === 0) offset += 4;
    while (offset % 4 !== 0) offset++;
  }
  let address = '';
  while (buf[offset] !== 0) {
    address += String.fromCharCode(buf[offset]);
    offset++;
  }
  skipToNextBlock();
  if (String.fromCharCode(buf[offset]) === ',') offset++;
  const types: ('int' | 'float' | 'string')[] = [];
  let canReadPast = true;
  while (buf[offset] !== 0) {
    const type = String.fromCharCode(buf[offset]);
    switch (type) {
      case 'i':
        if (canReadPast) types.push('int');
        break;
      case 'f':
        if (canReadPast) types.push('float');
        break;
      case 's':
        if (canReadPast) types.push('string');
        break;
      default:
        blLog.error(`Unknown type in OSC message: ${type}`);
        canReadPast = false;
        break;
    }
    offset++;
  }
  skipToNextBlock();
  const args: OscArgument[] = [];
  types.forEach((type) => {
    switch (type) {
      case 'int':
        args.push({ type: 'int', value: buf.readInt32BE(offset) });
        offset += 4;
        break;
      case 'float':
        args.push({ type: 'float', value: buf.readFloatBE(offset) });
        offset += 4;
        break;
      case 'string': {
        let str = '';
        while (buf[offset] !== 0) {
          str += String.fromCharCode(buf[offset]);
          offset++;
        }
        skipToNextBlock();
        args.push({ type: 'string', value: str });
        break;
      }
    }
  });
  skipToNextBlock();
  offset -= 4;
  if (offset !== buf.length) {
    blLog.error(
      `OSC message data does not match buffer length. Expected length ${offset} not ${buf.length}`
    );
    const hexString = buf.toString('hex');
    blLog.error(`Buffer content in hex: ${hexString}`);
  }
  if (address.startsWith('/')) {
    address = address.slice(1);
  } else blLog.error(`OSC message with invalid address: ${address}`);
  if (address.endsWith('/')) {
    address = address.slice(0, -1);
    blLog.error(`OSC message with invalid address: ${address}`);
  }
  const message: OscMessage = { address: address.split('/'), arguments: args };
  if (!canReadPast) {
    blLog.error(`OSC message with unknown type: ${JSON.stringify(message)}`);
  }
  if (!message.address) {
    blLog.error(`OSC message with empty address: ${JSON.stringify(message)}`);
  }

  switch (message.address[0]) {
    case 'subscribe': {
      const networkAddress = rinfo.address;
      subscribedAddresses[networkAddress] = {
        port: rinfo.port,
        secondsLeft: 10,
      };
      break;
    }
    case 'start':
      start();
      break;
    case 'pause':
      pause();
      break;
    case 'reset': {
      const argument = message.arguments[0];
      if (argument && (argument.type === 'int' || argument.type === 'float')) {
        setStart('absoluteMinutes', argument.value);
        reset();
      } else reset();
      break;
    }
    default:
      blLog.error(`OSC message with unknown address: ${message.address}`);
      break;
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`OSC server listening on port: ${address.port}`);
});

export function initializeOscServer() {
  server.bind(PORT);
}

function send(message: OscMessage, address: string, port: number) {
  const addressBuf = strToBuf('/' + message.address.join('/'));
  let argTypes = ',';
  const argBufs: Buffer[] = [];
  const args = message.arguments;
  if (args.length > 0) {
    for (let i = 0; i < args.length; i++) {
      argTypes += args[i].type[0];
      argBufs.push(oscArgumentToBuffer(args[i]));
    }
  }
  const typesBuf = strToBuf(argTypes);
  const argsBuf = Buffer.concat(argBufs);
  const bufferToSend = Buffer.concat([addressBuf, typesBuf, argsBuf]);
  const client = dgram.createSocket('udp4');
  client.send(bufferToSend, port, address, (err) => {
    if (err) {
      blLog.error(`Error sending OSC message: ${err}`);
    }
    client.close();
  });
}

function oscArgumentToBuffer(arg: OscArgument): Buffer {
  switch (arg.type) {
    case 'float': {
      const floatBuf = Buffer.allocUnsafe(4);
      floatBuf.writeFloatBE(arg.value, 0);
      return floatBuf;
    }
    case 'int': {
      const intBuf = Buffer.allocUnsafe(4);
      intBuf.writeInt32BE(arg.value, 0);
      return intBuf;
    }
    case 'string': {
      const unpaddedBuf = Buffer.from(arg.value);
      let newBufLength = unpaddedBuf.length + 1;
      while (newBufLength % 4 !== 0) newBufLength++;
      const paddedBuf = Buffer.alloc(newBufLength);
      paddedBuf.write(arg.value);
      return paddedBuf;
    }
  }
}

function strToBuf(str: string): Buffer {
  const buf = Buffer.from(str);
  const bufPad = Buffer.alloc(4 - (buf.length % 4));
  return Buffer.concat([buf, bufPad]);
}
