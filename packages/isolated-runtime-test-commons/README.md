# Isolated Runtime Test Commons

Used to create fixture files for testing isolated runtime.

## Api
- `Context({basePath?: string, root?: string})` - Create a new context, which will operate under basePath/root
- `Context.DEFAULT_FILE_NAME: string` - default file name used in case no file name was passed to `withFile`.
- `Context#withFile(file?: string, content: string): this` - Used to add a file to the folder.
- `Context#withFunction(name: string, args: Array<string>, content: string): this` - Shortcut for `withFile`. creates a single exported function with the default file name.
- `Context#get basePath(): string` - Getter for basePath (full path for code folder).
- `Context#build(): Promise<>` - Creates the folders structure.
- `Context#destroy(): Promise<>` - Cleans up the folders structure.

- `randoms$#ecret(): string` - Generates a random secret.
- `randoms#folder(): string` - Generates a random folder name.
