type CodeRunnerOptions = {
  root: string;
  file: string;
  onConsole?: (method: string, ...args: any[]) => void;
  sourceExtensions?: string[];
  compiler?: (code: string) => string;
  external?: string[];
  whitelistedPaths?: string[];
  resolve?: (moduleName: string) => string;
};

type RunOptions = {
  funcName: string;
  args: any[];
  context?: object;
  running?: () => void;
  resolveArguments?: (args: any[]) => any[];
}

export class CodeRunner {
  constructor(opts: CodeRunnerOptions);
  run(opts: RunOptions): Promise<any>;
}
export namespace errors {
  export class ModuleNotFound {}
}
