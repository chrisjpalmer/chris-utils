import { getLines } from "./input"
import fs from 'fs';
import path from 'path'
export function getBranches(prompt: string, branchesFlag: string[], workDir: string, chainFile: string): string[] {
   
    let branches = resolveBranches(prompt, branchesFlag, workDir, chainFile);

    // clean numbering if any.
    const numbering = RegExp(/^[0-9]*\./)
    branches = branches.map(v => v.replace(numbering, "").trim())
    branches = branches.filter(v => v.length > 0)
    return branches
}

function resolveBranches(prompt: string, branchesFlag: string[], workDir: string, chainFile: string): string[] {
    // resolve from command line flag
    if (!!branchesFlag) {
        return branchesFlag
    }

    // read chain file
    if(chainFile != "") {
        const chainFilePath = path.join(workDir, chainFile)
        if (fs.existsSync(chainFilePath)) {
            const f = fs.readFileSync(chainFilePath)
            return f.toString('utf-8').split('\n').map(s => s.trim()).filter(s => s.length > 0)
        }
    }


    // prompt
    return getLines(prompt)
}