import { autorun, observable } from "mobx";

import { IEmitter, IServerAccept } from "./types";
import { ISE, NoIntantiateEmit } from "./constants";
import { guardExecutionSide } from "./util";

// const instanceMap: { [key: string]: any } = {};

/**
 * Base class to extend
 */
export default class SharedState {
  static isSyncedInstantiate = (args: any) => args[NoIntantiateEmit];
  static instances: { [key: string]: any } = {};
  static sharedKeys: string[] = [];
  static roomSharedKeys: string[] = [];
  static roomsSharedKeys: string[] = [];
  public handleSyncStateObject = (stateToBeSynced: any) => {
    if (stateToBeSynced)
      Object.keys(stateToBeSynced).forEach((key) => {
        // @ts-ignore
        if (key in this) this[key] = stateToBeSynced[key];
      });
  };
  public getSyncStateObject = (Constructor: any) => {
    return [
      ...Constructor.sharedKeys,
      ...Constructor.roomSharedKeys,
      ...Constructor.roomsSharedKeys,
    ].reduce((acc: { [key: string]: any }, el: string) => {
      // @ts-ignore
      acc[el] = this[el];
      return acc;
    }, {});
  };

  private isServer: boolean;
  private oneTimeSyncDisabled = false;
  private syncEnabled = true;
  protected syncOn = () => (this.syncEnabled = true);
  protected syncOff = () => (this.syncEnabled = false);
  protected oneTimeSyncDisabledOn = () => (this.oneTimeSyncDisabled = true);
  protected oneTimeSyncDisabledOff = () => (this.oneTimeSyncDisabled = false);

  public emitter: IEmitter = {
    emit: () => {},
    emitToUser: () => {},
    emitToAllUserRooms: () => {},
    emitToRoom: () => {},
  };

  @observable
  // @ts-ignore
  public id: string;
  public reactions: (() => void)[] = [];

  constructor({
    emitter,
    id,
    ...args
  }: {
    emitter: IEmitter;
    id?: string;
    [NoIntantiateEmit]?: boolean;
  }) {
    this.isServer = (() => {
      try {
        // @ts-ignore
        window;
        return false;
      } catch {
        return true;
      }
    })();
    // @ts-ignore it's weird that it doesn't work, sharedKeys are declared
    this.constructor.sharedKeys.forEach((property: string) => {
      this.reactions.push(
        autorun(() => {
          /* This will run 3 times on instantiation:
             1. First run by default
             2. Second run after this.id change
             3. Third time when actual values are assigned
          */
          // @ts-ignore
          console.log("AUTORUN", property, this[property]);
          if (this.syncEnabled) {
            this.emitter.emit(ISE.Mutation, {
              id: this.id,
              className: this.constructor.name,
              // @ts-ignore
              value: this[property],
              property,
            });
          }
        })
      );
    });
    // @ts-ignore
    this.constructor.roomSharedKeys.forEach(([property, room]: string[]) => {
      this.reactions.push(
        autorun(() => {
          if (this.syncEnabled) {
            this.emitter.emitToRoom(room, ISE.Mutation, {
              id: this.id,
              className: this.constructor.name,
              // @ts-ignore
              value: this[property],
              property,
            });
          }
        })
      );
    });
    // @ts-ignore
    this.constructor.roomsSharedKeys.forEach((property: string) => {
      this.reactions.push(
        autorun(() => {
          if (this.syncEnabled) {
            this.emitter.emitToAllUserRooms(ISE.Mutation, {
              id: this.id,
              className: this.constructor.name,
              // @ts-ignore
              value: this[property],
              property,
            });
          }
        })
      );
    });
    // Post-instantiation
    setTimeout(() => {
      this.emitter = emitter;
      if (!this.id && id) {
        this.id = id;
      } else if (!this.id) {
        throw new Error(
          `Instance of class ${this.constructor.name} needs an ID!`
        );
      }

      if (SharedState.isSyncedInstantiate(args)) {
        console.log("Instantiate with no emit");
      } else {
        const className = this.constructor.name;
        if (this.emitter) {
          if (!this.isServer) {
            this.emitter.emit(ISE.ClientInstantiated, {
              className,
              id: this.id,
              arguments: args,
            });
          } else {
            this.emitter.emit(ISE.ServerInstantiated, {
              className,
              id: this.id,
              arguments: args,
            });
          }
        }
      }
      // @ts-ignore This is kinda hacky but whatever
      this.constructor.instances[this.id] = this;
    });
  }

  public changeEmitter(emitter: IEmitter) {
    this.emitter = emitter;
  }

  public dispose() {
    if (this.reactions) this.reactions.forEach((r) => r());
  }
}
