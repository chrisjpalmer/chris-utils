import * as yaml from 'yaml';
import * as fs from 'fs';

export interface Config {
    apiToken: string;
    workspace: string;
    user: string;
    team: string[];
}
export function loadConfig(): Config {
    let f = fs.readFileSync('./config.yaml').toString()
    let cfg: Config = yaml.parse(f)
    return cfg;
}