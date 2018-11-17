import { NexeCompiler } from '../compiler';
/**
 * Downloads the node source to the configured temporary directory
 * @param {*} compiler
 * @param {*} next
 */
export default function downloadNode(compiler: NexeCompiler, next: () => Promise<void>): Promise<void>;
