import SocketIOClient from "socket.io-client";

import { IEmitter } from "../types";
import { ISE } from "../constants";

export default class ClientEmitter implements IEmitter {
  constructor(private socket: SocketIOClient.Socket) {}

  emit = (event: any, data: any) => {
    this.socket.emit(event, data);
  };

  emitToUser = (...args: [string, string, any]) => {
    this.emitToRoom(...args);
  };

  emitToRoom = (room: string, channel: string, data: any) => {
    this.socket.emit(ISE.ChangeInRoom, {
      room,
      channel,
      change: data,
    });
  };

  emitToAllUserRooms = () => {};
}
