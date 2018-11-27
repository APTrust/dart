export interface LogStep {
    modify(text: string, color?: string): void;
    log(text: string, color?: string): void;
    pause(): void;
    resume(): void;
}
export declare class Logger {
    verbose: boolean;
    private silent;
    private ora;
    private modify;
    write: (text: string, color?: string) => void;
    constructor(level: 'verbose' | 'silent' | 'info');
    flush(): Promise<{}>;
    _write(update: string, color?: string): void;
    _modify(update: string, color?: any): void;
    step(text: string, method?: string): LogStep;
}
