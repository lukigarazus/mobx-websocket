import ClientState from "./client/state";
import SharedState from "./sharedState";
import ServerState from "./server/state";
import {
  sync,
  syncInRoom,
  syncInRooms,
  syncable,
  syncableInRoom,
  syncableInRooms,
  shareableState,
} from "./decorators";
import AgnosticEmitter from "./agnosticEmitter";
import { ExecutionSide, NoIntantiateEmit } from "./constants";

export const generateID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export {
  ClientState,
  ServerState,
  SharedState,
  sync,
  syncInRoom,
  syncInRooms,
  syncable,
  syncableInRoom,
  syncableInRooms,
  shareableState,
  ExecutionSide,
  NoIntantiateEmit,
  AgnosticEmitter,
};
