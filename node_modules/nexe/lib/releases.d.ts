import { NexeTarget } from './target';
export { NexeTarget };
export interface GitAsset {
    name: string;
    url: string;
    browser_download_url: string;
}
export interface GitRelease {
    tag_name: string;
    assets_url: string;
    upload_url: string;
    assets: GitAsset[];
}
export declare function getLatestGitRelease(options?: any): Promise<GitRelease>;
export declare function getUnBuiltReleases(options?: any): Promise<NexeTarget[]>;
