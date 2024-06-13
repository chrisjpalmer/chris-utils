import shelljs from 'shelljs'
import { Config } from './config'
import { wordWrap } from './wordwrap'

export function gitClone(cfg:Config, repo:string): string {
    const fp = fullPath(cfg, repo)
    shelljs.rm('-rf', fp)
    shelljs.exec(`git clone --depth=1 https://bitbucket.org/${cfg.workspace}/${repo} ${fp}`)
    return fp;
}

function fullPath(cfg:Config, repo:string) {
    return `${cfg.tmpDir}/${repo}`
}

export function gitCheckoutBranch(cfg:Config, repo:string, branch: string) {
    shelljs.exec(`git checkout -b ${branch}`, {cwd:fullPath(cfg, repo)})
}

export function gitDiff(cfg:Config, repo:string): string {
    const rs = shelljs.exec(`git diff`, {cwd:fullPath(cfg, repo), silent: true})
    return rs.stdout
}

export function gitShowP(cfg:Config, repo:string): string {
    const rs = shelljs.exec(`git show -p`, {cwd:fullPath(cfg, repo), silent: false})
    return rs.stdout
}

export function gitAddFile(cfg:Config, repo:string, file:string) {
    shelljs.exec(`git add ${file}`, {cwd:fullPath(cfg, repo)})
}

export function gitCommit(cfg:Config, repo:string, subject:string, body:string): string {
    const message = `${subject}\n\n${wordWrap(body, {width: 80})}`
    shelljs.exec(`git commit -m "${message}"`, {cwd:fullPath(cfg, repo)})
    return message
}

export function gitPushForce(cfg:Config, repo:string, branch: string) {
    shelljs.exec(`git push -f origin ${branch}`, {cwd:fullPath(cfg, repo)})
}

