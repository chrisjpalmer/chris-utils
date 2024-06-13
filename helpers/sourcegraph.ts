import qs from 'qs';
import { Config } from './config';

export interface References {
    file: string
    match: string;
}

interface Match {
    type: string
    path: string
    repositoryID:number,
    repository: string
    repoLastFetched: string
    branches:[""],
    commit: string,
    
    lineMatches: LineMatch[]
}

interface LineMatch {
    line: string,
    lineNumber: number,
    offsetAndLengths: number[][]
}

export async function getReferences(cfg:Config, repo:string, searchPaths:string[], searchTerm:string) : Promise<References[]>{
    const files = searchPaths.map(p => `^${p}`).join('|')
    const queryStr = `context:global repo:^bitbucket\.org/${cfg.workspace}/${repo}$ file:${files} ${searchTerm}`;
    const params = qs.stringify({q: queryStr})
    const url = `${cfg.sourceGraphBaseUrl}/.api/search/stream?${params}`
    const headers = {'Authorization': `token ${cfg.sourceGraphApiToken}`};

    let rs = await fetch(url, {headers})
    
    
    const output = await rs.text()
    const events = output.split('\n\n').filter(e => e.length > 0).map(e => parseEvent(e))

    let matches:Match[] = [];
    for(const event of events) {
        if(event.type == 'done') {
            break;
        }
        if(event.type != 'matches') {
            continue;
        }
            
        const match = JSON.parse(event.data) as Match[]
        matches.push(...match)   
    }

    const references = matches.map(m => {
        return {
            file: m.path,
            match: m.lineMatches[0].line
        }
    })
    
    return references
}

function parseEvent(e:string): {type:string, data:string} {
    const parts = e.split('\n')
    const type = parts[0].split('event: ')[1]
    const data = parts[1].split('data: ')[1]
    return {type, data}
}