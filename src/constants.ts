export const NoIntantiateEmit = Symbol("sync");
export const ServerInstantiatedFromClientInstantiation = Symbol("sync-req");

export enum InternalSocketEventNames {
  Change = "change",
  ChangeInRoom = "change in room",
  ChangeInRooms = "change in rooms",
  ClientInstantiated = "client instantiated",
  ServerInstantiated = "server instantiated",
  ServerAcceptedChange = "server accept change",
  ClientAcceptedChange = "client accepted change",
  ServerRejectedChange = "server reject change",
  ClientRejectedChange = "client reject change",
  ServerSyncState = "server sync state",
  ClientSyncState = "client sync state",
  Mutation = "mutation",
  MutationInRoom = "mutation in room",
  MutationInRooms = "mutation in rooms",
}

export enum ExecutionSide {
  Client = "client",
  Server = "server",
}

export const ISE = InternalSocketEventNames;
