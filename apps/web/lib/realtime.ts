'use client';

import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let softphone: Socket | null = null;
let realtime: Socket | null = null;

export function getSoftphoneSocket(): Socket {
  if (!softphone) {
    softphone = io(`${URL}/softphone`, { transports: ['websocket'] });
  }
  return softphone;
}

export function getRealtimeSocket(): Socket {
  if (!realtime) {
    realtime = io(`${URL}/realtime`, { transports: ['websocket'] });
  }
  return realtime;
}
