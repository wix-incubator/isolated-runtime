# Isolated Runtime Test Commons

## Api
- `Context({basePath?: string, root?: string})` => Runtime context object, used to create and delete fixture files.
- `Context.DEFAULT_FILE_NAME: string`
- `Context#withFile(file?: string, content: string): this` => Used to add a file to the folder. In case only content is passed, DEFAULT_FILE_NAME will be used.
- `Context#withFunction(name: string, args: Array<string>, content: string): this` => Shortcut for withFile. creates a single exported function with default code/index.js file name.
- `Context#get basePath(): string` => Getter for basePath (full path for code folder).
- `Context#build(): Promise<>` => Creates the folders structure.
- `Context#destroy(): Promise<>` => Cleans up the folders structure.

- `randoms$#ecret(): string` => Generates a random secret.
- `randoms#folder(): string` => Generates a random folder name.
