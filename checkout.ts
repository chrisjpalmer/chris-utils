import { prchainCommander } from "./prchain-commander";

async function rebase () {
    return prchainCommander({
        enterBranchesPrompt: "Enter the branches to checkout to:",
        branchesFilter: () => true,
        branchesForUserSelection: (branches:string[]) => branches,
        makeCmd: makeCmd
    })
}

function makeCmd(branches: string[], branchIdx: number) {
    return `git checkout ${branches[branchIdx]}`
}

rebase()