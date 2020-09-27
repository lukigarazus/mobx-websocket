import { decorate, observable, autorun } from "mobx";

import SharedState from "./sharedState";
import { NoIntantiateEmit, ISE, ExecutionSide } from "./constants";

export const syncable = (mutableOn?: ExecutionSide) => <T extends SharedState>(
  target: T,
  property: keyof T
) => {
  // @ts-ignore
  target.constructor.sharedKeys.push(property);
};

export const syncableInRoom = (room: string, mutableOn?: ExecutionSide) => <
  T extends SharedState
>(
  target: T,
  property: keyof T
) => {
  // @ts-ignore
  target.constructor.roomSharedKeys.push([property, room]);
};

export const syncableInRooms = (mutableOn?: ExecutionSide) => <
  T extends SharedState
>(
  target: T,
  property: keyof T
) => {
  // @ts-ignore
  target.constructor.roomsSharedKeys.push(property);
};

const baseSyncMethod = (f: Function) => <T extends SharedState>(
  target: T,
  property: keyof T,
  propertyDescriptor: PropertyDescriptor
) => {
  if (typeof target[property] !== "function") {
    throw new Error(
      "Cannot use this decorator on a property that is not a function: " +
        property
    );
  }
  const old = target[property];
  propertyDescriptor.value = function(...args: any) {
    // @ts-ignore
    const res = old.bind(this)(...args);
    // @ts-ignore
    if (this.syncEnabled && !this.oneTimeSyncDisabled) {
      f.bind(this)(target, property, ...args);
    }
    // @ts-ignore
    if (this.oneTimeSyncDisabled) this.oneTimeSyncDisabledOff();
    return res;
  };
};

/**
 * Emit to everyone
 */
export const sync = (executableOn?: ExecutionSide) =>
  baseSyncMethod(function<T extends SharedState>(
    _target: T,
    property: keyof T,
    ...args: any
  ) {
    // @ts-ignore
    if (this.emitter) {
      // @ts-ignore
      this.emitter.emit(ISE.Change, {
        property,
        arguments: args,
        // @ts-ignore
        id: this.id,
        // @ts-ignore
        className: this.constructor.name,
      });
    }
  });

/**
 * Emit to members of one, specified room
 */
export const syncInRoom = (room: string) =>
  baseSyncMethod(function<T extends SharedState>(
    _target: T,
    property: string,
    ...args: any
  ) {
    // @ts-ignore
    if (this.emitter) {
      //@ts-ignore
      this.emitter.emitToRoom(room, ISE.Change, { property, arguments: args });
    }
  });

/**
 * Emit to members of all rooms the user is in
 */
export const syncInRooms = baseSyncMethod(function<T extends SharedState>(
  _target: T,
  property: string,
  ...args: any
) {
  // @ts-ignore
  if (this.emitter) {
    //@ts-ignore
    this.emitter.emitToAllUserRooms(ISE.Change, {
      property,
      arguments: args,
    });
  }
});

export const shareableState = (clazz: any) => {
  decorate(
    clazz,
    (() => {
      const decoration = clazz.sharedKeys.reduce(
        (acc: { [key: string]: typeof observable }, key: string) => {
          acc[key] = observable;
          return acc;
        },
        {}
      );
      return decoration;
    })()
  );
};
