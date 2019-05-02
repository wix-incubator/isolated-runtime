import { Options } from "generic-pool";

type IsolatedRuntimeOptions = {
  poolOptions?: Options;
  sourceExtensions?: string[];
  resolverModulePath?: string;
  compilerModulePath?: string;
  timeout?: number;
}
type RunOptions = {
  root: string;
  file: string;
  funcName: string;
  args: any[];
  context?: object;
  external?: string[];
  whitelistedPaths?: string[];
  resolverOptions?: object;
}

export class IsolatedRuntime {
  constructor(opts: IsolatedRuntimeOptions);
  run(opts: RunOptions): Promise<any>;
}

export namespace errors {
  export class RuntimeTimeoutError {}
}
