import { Socket } from "socket.io";

import { InternalSocketEventNames, ISE, NoIntantiateEmit } from "./constants";
import ClientState from "./client/state";
import ServerState from "./server/state";
import SharedState from "./sharedState";
import { IChangeMethod, ISyncState, IMutation } from "./types";

interface IHandler {
  client?(this: ClientState, ...args: any): void;
  server?: (socket: Socket) => (this: ServerState, ...args: any) => void;
}

type IHandlers = {
  [key in InternalSocketEventNames]: IHandler;
};

const wrapMethods = (
  f: (
    this: ClientState | ServerState,
    key: string,
    side: string,
    ...args: any
  ) => void,
  obj: IHandlers
) => {
  (Object.keys(obj) as (keyof IHandlers)[]).forEach((key) => {
    const oldClient = obj[key].client;
    const oldServer = obj[key].server;
    obj[key].client = function(...args: any) {
      f.bind(this)(key, "client", ...args);
      oldClient && oldClient.bind(this)(...args);
    };
    obj[key].server = (socket) =>
      function(...args: any) {
        f.bind(this)(key, "server", ...args);
        oldServer && oldServer(socket).bind(this)(...args);
      };
  });
  return obj;
};

export const handlers: IHandlers = wrapMethods(
  function(key, side, ...args) {
    console.log(`"${key}" event on ${side}`, ...args);
  },
  {
    [InternalSocketEventNames.Change]: {
      client(change: IChangeMethod) {
        if (change) {
          if (this.emitter) {
          }
          const instance = this.classes[change.className].instances[change.id];
          if (instance) {
            instance.syncOff();
            // @ts-ignore we know that this is a method
            instance[change.property](...change.arguments);
            instance.syncOn();
          }
        }
      },
      server: (socket) =>
        function(change: IChangeMethod) {
          const instance = this.classes[change.className].instances[change.id];
          if (instance) {
            instance.syncOff();
            // @ts-ignore We know that this is a function
            instance[change.property](...change.arguments);
            instance.syncOn();
            socket.broadcast.emit(ISE.Change, change);
          }
        },
    },
    [InternalSocketEventNames.ChangeInRoom]: {
      client() {},
      server: (socket) =>
        function(changeRoom) {
          socket
            .to(changeRoom.room)
            .broadcast.emit(ISE.Change, changeRoom.change);
        },
    },
    [InternalSocketEventNames.ChangeInRooms]: {
      client() {},
      server: (socket) =>
        function(change) {
          Object.keys(socket.rooms).forEach((room) => {
            socket.to(room).broadcast.emit(ISE.Change, change);
          });
        },
    },
    [InternalSocketEventNames.ClientAcceptedChange]: {
      client() {},
      server: () => function() {},
    },
    [InternalSocketEventNames.ClientInstantiated]: {
      client() {},
      server: (socket) =>
        function(data) {
          const Constructor = this.classes[
            data.className
          ] as typeof SharedState;
          const serverInstance = this.classes[data.className].instances[
            data.id
          ];
          if (serverInstance) {
            // socket.emit(ISE.ServerAcceptedChange, {
            //   id: data.id,
            //   className: data.className,
            // });
            this.emitter.emitToRoom(socket.id, ISE.ServerSyncState, {
              id: data.id,
              className: data.className,
              syncStateObject: serverInstance.getSyncStateObject(Constructor),
            });
          } else {
            const instance = new Constructor({
              ...data.arguments,
              emitter: this.emitter,
              id: data.id,
              [NoIntantiateEmit]: true,
            });
            this.classes[data.className].instances[data.id] = instance;
            this.instances[data.id] = instance;
            // socket.emit(ISE.ServerAcceptedChange, {
            //   id: data.id,
            //   className: data.className,
            // });
          }
        },
    },
    [InternalSocketEventNames.ClientRejectedChange]: {
      client() {},
      server: () => function() {},
    },
    [InternalSocketEventNames.ClientSyncState]: {
      client() {},
      server: () => function() {},
    },
    [InternalSocketEventNames.Mutation]: {
      client(mutation: IMutation) {
        if (this.emitter) {
        }
        const instance = this.classes[mutation.className].instances[
          mutation.id
        ];
        if (instance) {
          instance.syncOff();
          // @ts-ignore
          instance[mutation.property] = mutation.value;
          instance.syncOn();
        }
      },
      server: (socket) =>
        function(mutation: IMutation) {
          const instance = this.classes[mutation.className].instances[
            mutation.id
          ];
          if (instance) {
            instance.syncOff();
            // @ts-ignore
            instance[mutation.property] = mutation.value;
            instance.syncOn();
            socket.broadcast.emit(ISE.Mutation, mutation);
          }
        },
    },
    [InternalSocketEventNames.MutationInRoom]: {
      client() {},
      server: () => function() {},
    },
    [InternalSocketEventNames.MutationInRooms]: {
      client() {},
      server: () => function() {},
    },
    [InternalSocketEventNames.ServerAcceptedChange]: {
      client() {},
      server: () => function() {},
    },
    [InternalSocketEventNames.ServerInstantiated]: {
      client(instantiate) {},
      server: () => function() {},
    },
    [InternalSocketEventNames.ServerRejectedChange]: {
      client() {},
      server: () => function() {},
    },
    [InternalSocketEventNames.ServerSyncState]: {
      client(data: ISyncState) {
        if (data.id) {
          const Constructor = this.classes[data.className];
          const clientInstance = Constructor.instances[data.id];
          clientInstance.emitter.emitOff();
          clientInstance.syncOff();
          if (clientInstance)
            clientInstance.handleSyncStateObject(data.syncStateObject);
          clientInstance.emitter.emitOn();
          clientInstance.syncOn();
        }
      },
      server: () => function() {},
    },
    [InternalSocketEventNames.SyncRequest]: {
      server: (socket) =>
        function(data: IChangeMethod) {
          if (data.id) {
            const Constructor = this.classes[data.className];
            const serverInstance = Constructor.instances[data.id];
            const syncObj = serverInstance.getSyncStateObject();
            serverInstance.emitter.emitToRoom(
              socket.id,
              InternalSocketEventNames.ServerSyncState,
              {
                id: data.id,
                className: data.className,
                syncStateObject: syncObj,
              }
            );
          }
        },
    },
  }
);

export const generateSocketEventHandlers = function(
  side: "server" | "client",
  socket?: Socket
) {
  (Object.keys(handlers) as (keyof typeof handlers)[]).forEach((key) => {
    if (handlers[key][side]) {
      if (side === "client")
        // @ts-ignore
        this.socket.on(key, handlers[key][side].bind(this));
      else {
        if (socket) {
          // @ts-ignore
          socket.on(key, handlers[key][side](socket).bind(this));
        }
      }
    }
  });
};
