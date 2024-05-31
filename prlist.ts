import { loadConfig, loadUsers, User, Config } from "./helpers"
import axios, { AxiosResponse } from 'axios';

async function prlist () {
    // config
    let cfg = loadConfig()

    // get some users to load (either from args or the cfg.team variable)
    let usersInput = process.argv.slice(2).join(" ")
    let usersToLoad = cfg.team
    if(usersInput.length > 0) {
        usersToLoad = usersInput.split(",").map(u => u.trim())
    }

    // resolve users
    let users = await loadUsers(usersToLoad);
    let me = (await loadUsers([cfg.me]))[0]

    // get all the users' prs
    for(const user of users) {
        let prs = await getUserPrs(cfg, user)
        if (prs.length == 0) {
            continue;
        }

        console.log(`${user.name} -------------------------------`)
        for(const pr of prs) {
            let activity = await getPrActivityLog(cfg, pr.source.repository.name, pr.id)
            let approvals = activity.filter(a => !!a.approval).length;
            let approvalsText = approvals > 0 ? ` - [ 👍 ${approvals} ]` : ''

             // only get ones I'm reviewing
            if(user.name != me.name) {
                const imreviewing = isReviewing(activity, me)
                if (!imreviewing) {
                    continue
                }
            }

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

function isReviewing(activity: PRActivity[], me: User): boolean {
    for(const act of activity) {
        if(!!act.update) {
            for (const reviewer of act.update.reviewers) {
                if (reviewer.account_id == me.accountUuid) {
                    return true
                }
            }
        }
    }
    return false
}

async function getPrStatuses(cfg:Config, repo: string, prid: number): Promise<PRStatus[]> {
    let prs:PRStatus[] = []
    let nextUrl = `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${repo}/pullrequests/${prid}/statuses?fields=${encodeURIComponent('-links')}`
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

interface Account {
    account_id: string
    nickname: string
}

interface PRStatus {
    type: string;
    id: number;
    key: string;
    refname: string;
    name: string;
    uuid: string;
    state: 'SUCCESSFUL' | 'FAILED' | 'STOPPED' | 'INPROGRESS'
}

interface PRActivity {
    approval: {nickname: string}
    update: {reviewers: Account[]}
}

prlist();