import { NexeCompiler, NexeOptions } from '../compiler';
declare const patches: (({files, replaceInFileAsync}: NexeCompiler<NexeOptions>, next: () => Promise<void>) => Promise<void>)[];
export default patches;
