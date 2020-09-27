import socketIO, { Socket } from "socket.io";

import AgnosticState from "./agnosticState";
import { IEmitter } from "./types";
import { generateSocketEventHandlers } from "./handlers";

const serverEmitDebug = (eventName: string, data: any) => {
  console.log(`Server emits "${eventName}"`, data);
};

class ServerEmitter implements IEmitter {
  constructor(private io: socketIO.Server) {}

  emit = (...args: [string, any]) => {
    serverEmitDebug(...args);
    this.io.emit(...args);
  };

  emitToUser = (userSocket: string, ...args: [string, any]) => {
    serverEmitDebug(...args);
    this.emitToRoom(userSocket, ...args);
  };

  emitToRoom = (room: string, channel: string, data?: any) => {
    serverEmitDebug(channel, data);
    this.io.to(room).emit(channel, data);
  };

  emitToAllUserRooms = (channel: string, data?: any) => {
    serverEmitDebug(channel, data);
    this.io.emit(channel, data);
  };
}

/**
 * Server wrapper for SharedState
 */
export default class ServerState extends AgnosticState {
  public emitter: ServerEmitter;
  public sockets: Set<Socket> = new Set();
  public rooms: { [key: string]: Set<Socket> } = {};
  public instances: { [key: string]: any } = {};

  constructor(ioObject: socketIO.Server, classes: any[]) {
    super(classes);

    ioObject.on("connection", (socket: Socket) => {
      this.sockets.add(socket);

      socket.on("disconnect", () => {
        this.sockets.delete(socket);
        Object.keys(socket.rooms).forEach((roomName) => {
          this.rooms[roomName].delete(socket);
        });
      });

      generateSocketEventHandlers.bind(this)("server", socket);
    });

    const emitter = new ServerEmitter(ioObject);
    this.emitter = emitter;
  }
}
