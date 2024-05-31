import { loadConfig, loadUsers, User, Config } from "./helpers"
import axios, { AxiosResponse } from 'axios';
import { screen, list } from 'blessed';

import ora from 'ora'
import { Ora } from 'ora'

async function prlist () {
    // config
    let cfg = loadConfig()

    // handle Ctrl + c
    process.on('SIGINT', function() {
        process.exit();
    });

    // get some users to load (either from args or the cfg.team variable)
    let usersInput = process.argv.slice(2).join(" ")
    let usersToLoad = cfg.team
    if(usersInput.length > 0) {
        if (usersInput == "-c") {
            usersToLoad = [await getUserSelection(cfg.team)]
        } else {
            usersToLoad = usersInput.split(",").map(u => u.trim())
        }
    }

    // resolve users
    const spinAfter = new SpinAfter(2000);
    spinAfter.start("Loading users")
    let users = await loadUsers(usersToLoad);
    let me = (await loadUsers([cfg.me]))[0]
    spinAfter.stop()


    // get all the users' prs
    for(const user of users) {
        spinAfter.start(`Fetching PR list for ${user.name}`);
        let prs = await getUserPrs(cfg, user)
        spinAfter.stop()

        if (prs.length == 0) {
            continue;
        }

        console.log(`${user.name} -------------------------------`)
        
        spinAfter.start(`Filtering PRs...`);
        for(const pr of prs) {
            let activity = await getPrActivityLog(cfg, pr.source.repository.name, pr.id)
            let approvals = activity.filter(a => !!a.approval).length;
            let approvalsText = ` - [ ❗ ${approvals} ]`
            if (isApprover(activity, me)) {
                approvalsText = ` - [ 🎉 ${approvals} ]`
            } else if(approvals >= 2) {
                approvalsText = ` - [ 👍 ${approvals} ]`
            }

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

            spinAfter.reset()
            console.log(`\t${title} - ${url}${statusText}${approvalsText}`)
        }
        spinAfter.stop()
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

function isApprover(activity: PRActivity[], me: User): boolean {
    for(const act of activity) {
        if(!!act.approval) {
            if (act.approval.user.account_id == me.accountUuid) {
                return true
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

async function getUserSelection(items: string[]): Promise<string> {
    const sc = screen({smartCSR: true})
    const ls = list({
        parent: sc, // Can't capture events if we use screen.append(taskList)
        width: 50,
        keys: true, 
        items: items,
        style: {
            selected: { bg: 'blue' },
            item: { fg: 'magenta' }
        },
        keyable: true,
    })
    sc.key(['escape', 'q', 'C-c'], function() { sc.destroy(); process.exit(0); });
   
    let selected = new Promise<string>((resolve, reject) => {
        ls.on('select', (item, index) => {
            sc.destroy()
            resolve(items[index])
        })
    })
    sc.render()

    return await selected
}

class SpinAfter {
    timeoutId: NodeJS.Timeout | null
    spinAfter: number
    spinner: Ora

    constructor(spinAfter: number) {
        this.spinAfter = spinAfter;
        this.timeoutId = null;
        this.spinner = ora();
    }

    start(message: string) {
        this.spinner.text = message;
        this._start();
    }

    private _start() {
        this.timeoutId = setTimeout(() => {
            this.spinner.start()
            this.timeoutId = null;
        }, this.spinAfter)
    }

    reset() {
        this.stop()
        this._start();
    }

    stop() {
        this.spinner.stop()
        if(this.timeoutId !== null) {
            clearTimeout(this.timeoutId)
        }
    }
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
    approval: {user: Account}
    update: {reviewers: Account[]}
}

prlist();