import { autorun, observable } from "mobx";

import AgnosticEmitter from "./agnosticEmitter";
import { ISE, NoIntantiateEmit } from "./constants";
import { checkIfServer } from "./util";

// const instanceMap: { [key: string]: any } = {};

/**
 * Base class to extend
 */
export default class SharedState {
  static isSyncedInstantiate = (args: any) => args[NoIntantiateEmit];
  static instances: { [key: string]: any } = {};
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

  private oneTimeSyncDisabled = false;
  private syncEnabled = true;
  protected syncOn = () => (this.syncEnabled = true);
  protected syncOff = () => (this.syncEnabled = false);
  protected oneTimeSyncDisabledOn = () => (this.oneTimeSyncDisabled = true);
  protected oneTimeSyncDisabledOff = () => (this.oneTimeSyncDisabled = false);
  public isServer: boolean;

  public emitter: AgnosticEmitter = new AgnosticEmitter({
    emit: () => {},
    emitToUser: () => {},
    emitToAllUserRooms: () => {},
    emitToRoom: () => {},
  });

  @observable
  // @ts-ignore
  public id: string;
  public reactions: (() => void)[] = [];

  constructor({
    emitter,
    id,
    ...args
  }: {
    emitter: AgnosticEmitter;
    id: string;
    [NoIntantiateEmit]?: boolean;
  }) {
    this.isServer = checkIfServer();
    const offedHere = false;
    this.syncOff();
    // @ts-ignore it's weird that it doesn't work, sharedKeys are declared
    (this.constructor.sharedKeys || []).forEach((property: string) => {
      this.reactions.push(
        autorun(() => {
          const args = {
            id: this.id,
            className: this.constructor.name,
            // @ts-ignore
            value: this[property],
            property,
          };
          /* This will run 3 times on instantiation:
             1. First run by default
             2. Second run after this.id change
             3. Third time when actual values are assigned
          */
          if (this.syncEnabled && this.id) {
            // @ts-ignore
            console.log("AUTORUN", property, this[property]);
            this.emitter.emit(ISE.Mutation, args);
          }
        })
      );
    });
    // @ts-ignore
    (this.constructor.roomSharedKeys || []).forEach(
      ([property, room]: string[]) => {
        this.reactions.push(
          autorun(() => {
            const args = {
              id: this.id,
              className: this.constructor.name,
              // @ts-ignore
              value: this[property],
              property,
            };
            if (this.syncEnabled && this.id) {
              this.emitter.emitToRoom(room, ISE.Mutation, args);
            }
          })
        );
      }
    );
    // @ts-ignore
    (this.constructor.roomsSharedKeys || []).forEach((property: string) => {
      this.reactions.push(
        autorun(() => {
          const args = {
            id: this.id,
            className: this.constructor.name,
            // @ts-ignore
            value: this[property],
            property,
          };
          if (this.syncEnabled && this.id) {
            this.emitter.emitToAllUserRooms("", ISE.Mutation, args);
          }
        })
      );
    });
    this.emitter = emitter;
    if (id) {
      this.id = id;
    } else {
      throw new Error(
        `Instance of class ${this.constructor.name} needs an ID!`
      );
    }
    // After id change
    this.syncOn();
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
  }

  public changeEmitter(emitter: AgnosticEmitter) {
    this.emitter = emitter;
  }

  public dispose() {
    if (this.reactions) this.reactions.forEach((r) => r());
  }
}
