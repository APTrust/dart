import { NexeCompiler } from '../compiler';
export default function nodeGyp({files, replaceInFileAsync}: NexeCompiler, next: () => Promise<void>): Promise<void>;
