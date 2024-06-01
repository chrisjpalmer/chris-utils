import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface Cache {
    users: UserSummary[]
}

const cacheFile = './.cache/users.yaml';

export function loadCache(): Cache {
    if (!fs.existsSync(cacheFile)) {
        return {users:[]}
    }

    let f = fs.readFileSync(cacheFile).toString()
    let cache: Cache = yaml.parse(f)
    return cache;
}

export function saveCache(cache: Cache) {
    fs.mkdirSync(path.dirname(cacheFile), {recursive: true})
    fs.writeFileSync(cacheFile, yaml.stringify(cache))
}

export interface UserSummary {
    name: string
    accountUuid: string
}