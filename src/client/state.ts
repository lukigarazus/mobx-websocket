import SocketIOClient from "socket.io-client";

import ClientEmitter from "./emitter";
import AgnosticEmitter from "../agnosticEmitter";
import AgnosticState from "../agnosticState";
import { generateSocketEventHandlers } from "../handlers";

/**
 * Client wrapper for SharedState
 */
export default class ClientState extends AgnosticState {
  public emitter: AgnosticEmitter;

  constructor(public socket: SocketIOClient.Socket, classes: any[]) {
    super(classes);
    const emitter = new AgnosticEmitter(new ClientEmitter(this.socket));
    this.emitter = emitter;

    generateSocketEventHandlers.bind(this)("client");
  }
}
