import { OrderedTaskQueue, Outcome, SpinAfter, Task, loadConfig } from "./helpers"
import { screen, list } from 'blessed';
import { PR, PRActivity, PRStatus, UserSummary, getPrActivity, getPrStatuses, getPrsMadeByUser, loadUsers } from "./helpers/bitbucket";
import commandLineArgs, { OptionDefinition } from "command-line-args";

async function prlist () {
    // command line flags
    const optionDefinitions: OptionDefinition[] = [
        { name: 'choose', alias: 'c', type: Boolean },
        { name: 'user', alias: 'u', type: String, multiple: true },
        { name: 'only-master', alias: 'm', type: Boolean },
        { name: 'only-main', type: Boolean },
    ]

    const options = commandLineArgs(optionDefinitions);

    // config
    let cfg = loadConfig()

    // handle Ctrl + c
    process.on('SIGINT', function() {
        process.exit();
    });

    // get some users to load (either from args or the cfg.team variable)
    let usersToLoad = cfg.team
    if(options["choose"]) {
        usersToLoad = [await getUserSelection(cfg.team)]
    } else if(options["user"] != null) {
        let words = options["user"]
        usersToLoad = words.join(" ").split(",").map(u => u.trim())
    }

    let onlyMaster = options["only-master"] || options["only-main"]

    // resolve users
    const spinAfter = new SpinAfter(2000);
    spinAfter.start("Loading users")
    let users = await loadUsers(cfg, usersToLoad);
    let me = (await loadUsers(cfg, [cfg.me]))[0]
    spinAfter.stop()

    // resolve prs
    spinAfter.start(`Fetching PR lists`);
    let getPrTasks = users.map(user => {
        return {
            id: user.accountUuid,
            do: async () => {
                let reviewer = user.accountUuid == me.accountUuid ? null : me
                return await getPrsMadeByUser(cfg, user, reviewer, onlyMaster)
            }
        }
    })
    let prTaskQueue = new OrderedTaskQueue<PR[]>(16, () => {})
    let usersPrs = await prTaskQueue.do(getPrTasks)
    spinAfter.stop()

    // get all the users' prs
    for(const userPrs of usersPrs) {
        const user = <UserSummary> users.find(user => user.accountUuid == userPrs.taskId)
        if(!!userPrs.outcome.err) {
            console.log(`${user.name} -------------------------------`)
            console.log(`\tPR list could not be fetched: `, userPrs.outcome.err)
        }

        const prs = <PR[]> userPrs.outcome.result;
        if (prs.length == 0) {
            continue;
        }

        console.log(`${user.name} -------------------------------`)
        
        spinAfter.start(`Fetching PR metadata...`);
        let start = performance.now()

        // fetch metadata
        let tasks:Task<PRMetadata>[] = prs.map((pr, idx) => {
            return {
                id: `${idx}`,
                do: async () => {
                    // console.log("fetching metadata for pr", pr.id)
                    let activityP = getPrActivity(cfg, pr.source.repository.name, pr.id)
                    let statusesP = getPrStatuses(cfg, pr.source.repository.name, pr.id)
                    let activity = await activityP
                    let statuses = await statusesP
                    return {pr, activity, statuses}
                }
            }
        })
        let taskQueue = new OrderedTaskQueue<PRMetadata>(16, (_, outcome) => printer(outcome, spinAfter, me))
        await taskQueue.do(tasks)

        spinAfter.stop()
        console.log(`[fetched in ${Math.round(performance.now() - start)}ms]`)
        console.log("")
    }
}

function printer(outcome:Outcome<PRMetadata>, spinAfter:SpinAfter, me:UserSummary) {
    spinAfter.reset()

    if(!!outcome.err) {
        console.log('\tfailed to fetch metadata')
        return;
    }

    const {pr, activity, statuses} = <PRMetadata> outcome.result;

    let approvals = activity.filter(a => !!a.approval).length;
    let approvalsText = ` - [ ❗ ${approvals} ]`
    if (isApprover(activity, me)) {
        approvalsText = ` - [ 🎉 ${approvals} ]`
    } else if(approvals >= 2) {
        approvalsText = ` - [ 👍 ${approvals} ]`
    }

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

interface PRMetadata {
    pr: PR, 
    activity: PRActivity[], 
    statuses: PRStatus[]
}

function isApprover(activity: PRActivity[], me: UserSummary): boolean {
    for(const act of activity) {
        if(!!act.approval) {
            if (act.approval.user.account_id == me.accountUuid) {
                return true
            }
        }
    }
    return false
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

prlist();