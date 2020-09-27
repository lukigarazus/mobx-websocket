import SharedState from "./sharedState";

/**
 * Utility class to abstract away repeating code
 */
export default class AgnosticState {
  public classes: { [key: string]: any };
  public instances: { [key: string]: any } = {};

  constructor(classes: any[]) {
    this.classes = classes
      .map((c) => [c.name, c])
      .reduce((acc, [name, clas]) => ({ ...acc, [name]: clas }), {});
  }
}
