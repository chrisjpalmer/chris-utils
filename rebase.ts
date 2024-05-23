import { getBranches } from "./helpers"

function rebase () {
    const branches = getBranches("Enter the branches for rebasing:")

    console.log(" ")
    console.log(" ")

    // print rebase commands
    for(let i = 1; i < branches.length; i++) {
        console.log(`git checkout ${branches[i]} && git rebase -i ${branches[i-1]}`)
    }

    console.log(" ")
    console.log(" ")

    // print forcepush
    for (let i = 0; i < branches.length; i++) {
        let branch = branches[i]
        if(branch == "master" || branch == "main") {
            continue;
        }
        console.log(`forcepush origin ${branch}`)
    }
}

rebase()