import { ExecutionSide } from "./constants";
import SharedState from "./sharedState";

export const guardExecutionSide = (
  property: string,
  instance: SharedState,
  side: ExecutionSide,
  f: any
) => {
  if (
    // @ts-ignore
    (instance.isServer && side !== ExecutionSide.Server) ||
    // @ts-ignore
    (!instance.isServer && side !== ExecutionSide.Client)
  ) {
    throw new Error(
      `Wrong execution side, property "${property}" is only ${
        // @ts-ignore
        typeof instance[property] === "function" ? "executable" : "mutable"
        // @ts-ignore
      } on ${instance.isServer ? ExecutionSide.Server : ExecutionSide.Client}`
    );
  }
};

export const checkIfServer = () => {
  try {
    // @ts-ignore
    window;
    return false;
  } catch {
    return true;
  }
};
