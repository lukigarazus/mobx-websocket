import socketIO, { Socket } from "socket.io";

import ServerEmitter from "./emitter";
import AgnosticState from "../agnosticState";
import AgnosticEmitter from "../agnosticEmitter";
import { generateSocketEventHandlers } from "../handlers";

/**
 * Server wrapper for SharedState
 */
export default class ServerState extends AgnosticState {
  public emitter: AgnosticEmitter;
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

    const emitter = new AgnosticEmitter(new ServerEmitter(ioObject));
    this.emitter = emitter;
  }
}
