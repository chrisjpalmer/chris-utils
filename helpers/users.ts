import { loadConfig } from "./config"
import axios, { AxiosResponse } from 'axios';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface User {
    name: string
    accountUuid: string
}

export async function loadUsers(users: string[]): Promise<User[]> {
    let cache = loadCache();
    let notCached = users.filter(u => !cache.users.find(_u => u.toLowerCase() == _u.name.toLowerCase()))
    if(notCached.length > 0) {
        let users = await resolveUsers(notCached);

        // save cache
        cache.users.push(...users)
        saveCache(cache)
    }

    return cache.users;
}

interface Cache {
    users: User[]
}

const cacheFile = './.cache/users.yaml';

function loadCache(): Cache {
    if (!fs.existsSync(cacheFile)) {
        return {users:[]}
    }

    let f = fs.readFileSync(cacheFile).toString()
    let cache: Cache = yaml.parse(f)
    return cache;
}

function saveCache(cache: Cache) {
    fs.mkdirSync(path.dirname(cacheFile), {recursive: true})
    fs.writeFileSync(cacheFile, yaml.stringify(cache))
}

async function resolveUsers(toResolve: string[]) : Promise<User[]> {
    let cfg = loadConfig()
    console.log(`resolving ${toResolve.length} users`)

    let unresolvedMap = new Map<string, boolean>()
    toResolve.forEach(u => unresolvedMap.set(u, true))

    let resolved: User[] = [];

    let nextUrl = `https://api.bitbucket.org/2.0/workspaces/${cfg.workspace}/members`;

    while(unresolvedMap.size > 0) {
        let rsp:AxiosResponse<ApiResponse> = await axios.get(
            nextUrl, 
            {
                auth:{
                    username: cfg.user, 
                    password: cfg.apiToken
                }
            }
        )
        
        let users = rsp.data.values || [];
        // users.forEach(u => console.log('\t', u.user.display_name))
        for(let _u of unresolvedMap.keys()) {
            // console.log(_u)
            let found = users.find(u => u.user.display_name.toLowerCase() == _u.toLowerCase());
            if (!!found) {
                unresolvedMap.delete(_u)
                resolved.push({
                    name: _u,
                    accountUuid: found.user.account_id,
                })
                console.log(`\t resolved ${_u} ${resolved.length}/${toResolve.length}`)
            }
        }

        if (!rsp.data.next) {
            break;
        }

        nextUrl = rsp.data.next;
    }

    if(unresolvedMap.size > 0) {
        for(let _u of unresolvedMap.keys()) {
            console.log(`unable to resolve user ${_u}`)
        }
    }

    return resolved;
}


interface ApiResponse {
    type: string;
    values: Value[];
    page: number;
    pagelen: number;
    next:string;
}

interface Value {
    type: string;
    user: {
        display_name: string;
        account_id: string
    }
}
