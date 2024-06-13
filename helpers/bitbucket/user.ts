

import { Config } from "../config"
import { get } from './client';
import { UserSummary, loadCache, saveCache } from "./cache";
import { Account } from "./account";

export async function loadUsers(cfg:Config, users: string[]): Promise<UserSummary[]> {
    let cache = loadCache();
    let notCached = users.filter(u => !cache.users.find(_u => u.toLowerCase() == _u.name.toLowerCase()))
    if(notCached.length > 0) {
        let users = await resolveUsers(cfg, notCached);

        // save cache
        cache.users.push(...users)
        saveCache(cache)
    }

    return <UserSummary[]> users.map(u => cache.users.find(_u => _u.name == u)).filter(_u => !!_u)
}


async function resolveUsers(cfg: Config, toResolve: string[]) : Promise<UserSummary[]> {
    console.log(`resolving ${toResolve.length} users`)

    let unresolvedMap = new Map<string, boolean>()
    toResolve.forEach(u => unresolvedMap.set(u, true))

    let resolved: UserSummary[] = [];

    let nextUrl = `https://api.bitbucket.org/2.0/workspaces/${cfg.workspace}/members`;

    while(unresolvedMap.size > 0) {
        let rs = await get<User>(cfg, nextUrl)
        
        let users = rs.values || [];
        // users.forEach(u => console.log('\t', u.user.display_name))
        for(let _u of unresolvedMap.keys()) {
            // console.log(_u)
            let found = users.find(u => u.user.display_name.toLowerCase() == _u.toLowerCase());
            if (!!found) {
                unresolvedMap.delete(_u)
                resolved.push({
                    name: _u,
                    accountUuid: found.user.account_id,
                    uuid: found.user.uuid,
                })
                console.log(`\t resolved ${_u} ${resolved.length}/${toResolve.length}`)
            }
        }

        if (!rs.next) {
            break;
        }

        nextUrl = rs.next;
    }

    if(unresolvedMap.size > 0) {
        for(let _u of unresolvedMap.keys()) {
            console.log(`unable to resolve user ${_u}`)
        }
    }

    return resolved;
}

interface User {
    type: string;
    user: Account
}
