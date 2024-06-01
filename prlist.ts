import { SpinAfter, loadConfig } from "./helpers"
import { screen, list } from 'blessed';


import { PRActivity, UserSummary, getPrActivity, getPrStatuses, getPrsMadeByUser, loadUsers } from "./helpers/bitbucket";

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
    let users = await loadUsers(cfg, usersToLoad);
    let me = (await loadUsers(cfg, [cfg.me]))[0]
    spinAfter.stop()


    // get all the users' prs
    for(const user of users) {
        spinAfter.start(`Fetching PR list for ${user.name}`);
        let reviewer = user.accountUuid == me.accountUuid ? null : me
        let prs = await getPrsMadeByUser(cfg, user, reviewer)
        spinAfter.stop()

        if (prs.length == 0) {
            continue;
        }

        console.log(`${user.name} -------------------------------`)
        
        spinAfter.start(`Fetching PR metadata...`);
        for(const pr of prs) {
            let activity = await getPrActivity(cfg, pr.source.repository.name, pr.id)
            let approvals = activity.filter(a => !!a.approval).length;
            let approvalsText = ` - [ ❗ ${approvals} ]`
            if (isApprover(activity, me)) {
                approvalsText = ` - [ 🎉 ${approvals} ]`
            } else if(approvals >= 2) {
                approvalsText = ` - [ 👍 ${approvals} ]`
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