import { prchainCommander } from "./prchain-commander";

async function forcepush () {
    return prchainCommander({
        enterBranchesPrompt: "Enter the branches for forcepushing:",
        branchesFilter: (branch:string) => branch != 'master' && branch != 'main',
        branchesForUserSelection: (branches:string[]) => branches,
        makeCmd: makeCmd
    })
}

function makeCmd(branches: string[], branchIdx: number) {
    return `git push -f -u origin ${branches[branchIdx]}`
}

forcepush()