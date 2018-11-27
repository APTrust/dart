import { NexeCompiler } from './compiler';
import { NexeOptions } from './options';
declare function compile(compilerOptions?: Partial<NexeOptions>, callback?: (err: Error | null) => void): Promise<void | {}>;
export { compile, NexeCompiler };
export { argv, version, NexeOptions, help } from './options';
