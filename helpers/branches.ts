import { getLines } from "./input"

export function getBranches(prompt: string): string[] {
    const numbering = RegExp(/^[0-9]*\./)
    let branches = process.argv.slice(2)
    if (branches.length == 0) {
        branches = getLines(prompt)
    }
    
    // clean numbering if any.
    branches = branches.map(v => v.replace(numbering, "").trim())
    branches = branches.filter(v => v.length > 0)
    return branches
}