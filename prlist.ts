import { loadConfig, loadUsers, User, Config } from "./helpers"
import axios, { AxiosResponse } from 'axios';

async function prlist () {
    // config
    let cfg = loadConfig()

    // resolve users
    let users = await loadUsers(cfg.team);

    // get all the users' prs
    for(const user of users) {
        let prs = await getUserPrs(cfg, user)
        if (prs.length == 0) {
            continue;
        }

        console.log(`${user.name} -------------------------------`)
        for(const pr of prs) {
            let statuses = await getPrStatuses(cfg, pr.source.repository.name, pr.id)
            let statusText = statuses.map(s => {
                const st = s.state;
                switch(st) {
                    case 'SUCCESSFUL':
                        return '✅'
                    case 'FAILED':
                        return '❌'
                    case 'INPROGRESS':
                        return '🔄'
                    default:
                        return '🤷'
                }
            }).join('')
            statusText = statusText.length > 0 ? ` - ${statusText}` : ''

            let activity = await getPrActivityLog(cfg, pr.source.repository.name, pr.id)
            let approvals = activity.filter(a => !!a.approval).length;
            let approvalsText = approvals > 0 ? ` - [ 👍 ${approvals} ]` : ''
            
            let url = pr.links.html.href;
            let title = pr.title


            console.log(`\t${title} - ${url}${statusText}${approvalsText}`)
        }
        console.log("")
    }
}

async function getUserPrs(cfg:Config, user:User): Promise<PR[]> {
    let prs:PR[] = []
    let nextUrl = `https://api.bitbucket.org/2.0/pullrequests/${user.accountUuid}?state=OPEN`
    for (;;) {

        let rsp:AxiosResponse<ApiResponse<PR>> = await axios.get(
            nextUrl, 
            {
                auth:{
                    username: cfg.user, 
                    password: cfg.apiToken
                }
            }
        )

        let values = rsp.data.values || [];
        
        prs.push(...values)

        if(!rsp.data.next) {
            break;
        }

        nextUrl = rsp.data.next
    }

    return prs
}

async function getPrStatuses(cfg:Config, repo: string, prid: number): Promise<PRStatus[]> {
    let prs:PRStatus[] = []
    let nextUrl = `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${repo}/pullrequests/${prid}/statuses`
    for (;;) {

        let rsp:AxiosResponse<ApiResponse<PRStatus>> = await axios.get(
            nextUrl, 
            {
                auth:{
                    username: cfg.user, 
                    password: cfg.apiToken
                }
            }
        )

        let values = rsp.data.values || [];
        
        prs.push(...values)

        if(!rsp.data.next) {
            break;
        }

        nextUrl = rsp.data.next
    }

    return prs
}

async function getPrActivityLog(cfg:Config, repo: string, prid: number): Promise<PRActivity[]> {
    let prs:PRActivity[] = []
    let nextUrl = `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${repo}/pullrequests/${prid}/activity`
    for (;;) {

        let rsp:AxiosResponse<ApiResponse<PRActivity>> = await axios.get(
            nextUrl, 
            {
                auth:{
                    username: cfg.user, 
                    password: cfg.apiToken
                }
            }
        )

        let values = rsp.data.values || [];
        
        prs.push(...values)

        if(!rsp.data.next) {
            break;
        }

        nextUrl = rsp.data.next
    }

    return prs
}

interface ApiResponse<T> {
    type: string;
    values: T[];
    page: number;
    pagelen: number;
    next: string;
}

interface PR {
    type: string;
    id: number;
    title: string;
    links: {
        self: {
            href: string;
        },
        html: {
            href: string;
        }
    },
    source: {
        repository: {
            name: string
        }
    }
}

interface PRStatus {
    type: string;
    id: number;
    key: string;
    refname: string;
    name: string;
    uuid: string;
    state: 'SUCCESSFUL' | 'FAILED' | 'STOPPED' | 'INPROGRESS'
    // links: {
    //     self: {
    //         href: string;
    //     },
    //     html: {
    //         href: string;
    //     }
    // },
}

interface PRActivity {
    approval: {nickname: string}
}

prlist();