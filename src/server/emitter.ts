import socketIO from "socket.io";

import { IEmitter } from "../types";

export default class ServerEmitter implements IEmitter {
  constructor(private io: socketIO.Server) {}

  emit = (...args: [string, any]) => {
    this.io.emit(...args);
  };

  emitToUser = (userSocket: string, ...args: [string, any]) => {
    this.emitToRoom(userSocket, ...args);
  };

  emitToRoom = (room: string, channel: string, data?: any) => {
    this.io.to(room).emit(channel, data);
  };

  emitToAllUserRooms = (channel: string, data?: any) => {
    this.io.emit(channel, data);
  };
}
