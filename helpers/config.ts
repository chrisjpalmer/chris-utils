import * as yaml from 'yaml';
import * as fs from 'fs';

export interface Config {
    apiToken: string;
    sourceGraphApiToken: string
    sourceGraphBaseUrl: string
    workspace: string;
    user: string;
    team: string[];
    me: string

    tmpDir: string

    repos: Repo[];
    unknownSystem: Repo[];
    noCatalog: Repo[];
    backstageComponents: BackstageComponent[];
}

export interface Repo {
    name: string;
    system: string;
    tags: string[];
}

export interface BackstageComponent {
    match: string;
    id: string;
    searchPaths: string[];
}
export function loadConfig(): Config {
    let f = fs.readFileSync('./config.yaml').toString()
    let cfg: Config = yaml.parse(f)
    return cfg;
}