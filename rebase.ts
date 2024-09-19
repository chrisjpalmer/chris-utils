import { prchainCommander } from "./prchain-commander";

async function rebase () {
    return prchainCommander({
        enterBranchesPrompt: "Enter the branches for rebasing:",
        branchesFilter: () => true,
        branchesForUserSelection: (branches:string[]) => branches.slice(1),
        makeCmd: makeCmd
    })
}

function makeCmd(branches: string[], branchIdx: number) {
    return `git checkout ${branches[branchIdx]} && git rebase -i ${branches[branchIdx-1]}`
}

rebase()