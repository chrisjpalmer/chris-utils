
export function getWorkdir(): string {
    if(!process.env.WORKDIR) {
        throw 'expected WORKDIR env var to be set';
    }
    return process.env.WORKDIR;
}