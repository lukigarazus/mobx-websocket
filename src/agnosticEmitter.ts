import { IEmitter } from "./types";
import { checkIfServer } from "./util";

interface IEvent {
  func: (...args: any[]) => void;
  args: any[];
}

export default class AgnosticEmitter {
  private isServer: boolean;
  private syncQueue: IEvent[] = [];
  private sideSpecificEmitter: IEmitter;

  private async = false;
  public asyncOn = () => (this.async = true);
  public asyncOff = () => (this.async = false);

  private emitEnabled = true;
  public emitOn = () => (this.emitEnabled = true);
  public emitOff = () => (this.emitEnabled = false);

  private debugMessage = (event: string, ...args: any) => {
    console.log(`${this.isServer ? "Server" : "Client"} "${event}"`, ...args);
  };

  private enqueueEvent = ({ func, args }: IEvent) => {
    if (this.emitEnabled) {
      if (this.async || this.isServer) {
        func(...args);
      } else {
        if (this.syncQueue.length) {
          this.syncQueue.push({ func, args });
        } else {
          func(...args);
        }
      }
    } else {
      console.log("Emitter blocked");
    }
  };

  public onAccept = () => {
    if (this.syncQueue.length) {
      const event = this.syncQueue.shift();
      if (event) {
        event.func(...event.args);
      }
    }
  };

  constructor(emitter: IEmitter) {
    this.sideSpecificEmitter = emitter;
    this.isServer = checkIfServer();
    emitter;
  }

  emit = (channel: string, data?: any) => {
    this.debugMessage("emit", channel, data);
    this.enqueueEvent({
      func: this.sideSpecificEmitter.emit,
      args: [channel, data],
    });
  };

  emitToUser = (socketId: string, channel: string, data?: any) => {
    this.debugMessage("emit to user", channel, data);
    this.enqueueEvent({
      func: this.sideSpecificEmitter.emitToUser,
      args: [socketId, channel, data],
    });
  };

  emitToRoom = (roomId: string, channel: string, data?: any) => {
    this.debugMessage("emit to room", channel, data);
    this.enqueueEvent({
      func: this.sideSpecificEmitter.emitToRoom,
      args: [roomId, channel, data],
    });
  };

  emitToAllUserRooms = (_socketId: string, channel: string, data?: any) => {
    this.debugMessage("emit to all user rooms", channel, data);
    this.enqueueEvent({
      func: this.sideSpecificEmitter.emitToAllUserRooms,
      args: [channel, data],
    });
  };
}
