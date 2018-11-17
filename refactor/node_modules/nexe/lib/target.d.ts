export declare type NodePlatform = 'windows' | 'mac' | 'alpine' | 'linux';
export declare type NodeArch = 'x86' | 'x64';
declare const platforms: NodePlatform[], architectures: NodeArch[];
export { platforms, architectures };
export interface NexeTarget {
    version: string;
    platform: NodePlatform | string;
    arch: NodeArch | string;
}
export declare function targetsEqual(a: NexeTarget, b: NexeTarget): boolean;
export declare function getTarget(target?: string | Partial<NexeTarget>): NexeTarget;
