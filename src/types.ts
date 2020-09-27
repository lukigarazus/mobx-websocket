export interface IChangeMethod {
  property: string;
  arguments: any[];
  className: string;
  id: string;
}

export interface IClientRoomChange<T> {
  room: string;
  channel: string;
  change: IChangeMethod;
}

export interface IEmitter {
  emit: (message: string, data?: any) => void;
  emitToUser: (userSocketId: string, message: string, data?: any) => void;
  emitToRoom: (room: string, message: string, data?: any) => void;
  emitToAllUserRooms: (message: string, data?: any) => void;
}

export interface IInstantiate {
  id: string;
  className: string;
  arguments: any[];
}

export interface IServerAccept {
  id: string;
  className: string;
}

export interface ISyncState {
  id: string;
  className: string;
  syncStateObject: { [key: string]: any };
}

export interface IMutation {
  id: string;
  className: string;
  value: any;
  property: string;
}
