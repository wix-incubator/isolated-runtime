type CodeRunnerOptions = {
  root: string;
  file: string;
  onConsole: (method: string, ...args: any[]) => void;
  sourceExtensions: string[];
  compiler: (code: string) => string;
  external: string[];
  whitelistedPaths: string[];
  resolve: (moduleName: string) => string;
  resolveArguments: (args: any[]) => any[];
};

export class CodeRunner {
  constructor(opts: CodeRunnerOptions);
  run(): Promise<any>;
}
export namespace errors {
  export class ModuleNotFound {}
}
