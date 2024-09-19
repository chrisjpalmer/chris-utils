import { prchainCommander } from "./prchain-commander";

async function forcepush () {
    return prchainCommander({
        enterBranchesPrompt: "Enter the branches for forcepushing:",
        branchesForUserSelection: (branches:string[]) => branches.slice(1),
        makeCmd: makeCmd
    })
}

function makeCmd(branches: string[], branchIdx: number) {
    return `git push -f -u origin ${branches[branchIdx]}`
}

forcepush()