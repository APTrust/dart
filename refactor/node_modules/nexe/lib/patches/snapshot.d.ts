import { NexeCompiler } from '../compiler';
export default function snapshot(compiler: NexeCompiler, next: () => Promise<void>): Promise<void>;
