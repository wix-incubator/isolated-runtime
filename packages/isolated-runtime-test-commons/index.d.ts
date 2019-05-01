export class Context {
  constructor(options: { basePath: string, root: string });
  static DEFAULT_FILE_NAME: string;
  basePath: string;
  folderName: string;
  build(): Promise<void>;
  destroy(): Promise<void>;
  withFile(file: string, content: string): this;
  withFile(content: string): this;
  withFunction(name: string, args: Array<string>, content: string): this;
}

export namespace randoms {
  export function secret(): string;
  export function folder(): string;
}
