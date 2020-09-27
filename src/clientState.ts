import SocketIOClient from "socket.io-client";

import AgnosticState from "./agnosticState";
import SharedState from "./sharedState";
import { IClientRoomChange, IEmitter } from "./types";
import { ISE } from "./constants";
import { generateSocketEventHandlers } from "./handlers";

const clientEmitDebug = (eventName: string, data: any) => {
  console.log(`Client emits "${eventName}"`, data);
};

class ClientEmitter implements IEmitter {
  constructor(private socket: SocketIOClient.Socket) {}

  emit = (event: any, data: any) => {
    clientEmitDebug(event, data);
    this.socket.emit(event, data);
  };

  emitToUser = (...args: [string, string, any]) => {
    this.emitToRoom(...args);
  };

  emitToRoom = (room: string, channel: string, data: any) => {
    clientEmitDebug(ISE.ChangeInRoom, data);
    this.socket.emit(ISE.ChangeInRoom, {
      room,
      channel,
      change: data,
    } as IClientRoomChange<SharedState>);
  };

  emitToAllUserRooms = () => {};
}

/**
 * Client wrapper for SharedState
 */
export default class ClientState extends AgnosticState {
  emitter: ClientEmitter;

  constructor(public socket: SocketIOClient.Socket, classes: any[]) {
    super(classes);
    const emitter = new ClientEmitter(this.socket);
    this.emitter = emitter;

    generateSocketEventHandlers.bind(this)("client");
  }
}
