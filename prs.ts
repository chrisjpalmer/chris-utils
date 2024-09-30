import { getBranches, loadConfig, getWorkdir } from "./helpers"
import * as shelljs from 'shelljs';
import commandLineArgs, { OptionDefinition } from "command-line-args";
import * as path from 'path';
import { PR, getAll } from "./helpers/bitbucket";

async function prs () {
    // config
    let cfg = loadConfig()
    const workdir = getWorkdir()
    const repoSlug:string = path.basename(workdir)

    const optionDefinitions: OptionDefinition[] = [
        { name: 'chain', alias: 'c', type: String, defaultValue: "main.prchain" },
        { name: 'branches', alias: 'b', type: String, multiple: true },
    ]
    
    const options = commandLineArgs(optionDefinitions);
    const chainFile = options["chain"]

    const branches = getBranches('Enter the branches to fetch PR urls for:', options["branches"], workdir, options["chain"]).filter(b => b != 'master')
    
    // resolve the links for all PRs
    let links:string[] = []
    for(let i = 0; i < branches.length; i++) {
        let branch = branches[i]
        let commit = shelljs.exec(`git rev-parse --short ${branch}`, {cwd:workdir, silent: true}).toString()
        let msg = shelljs.exec(`git log --format=%B -n 1 ${commit}`, {cwd:workdir, silent: true}).toString()
        msg = msg.split("\n")[0]
        
        let prs:PR[] = []
        try {
            prs = await getAll<PR>(cfg, `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${repoSlug}/commit/${commit}/pullrequests`)

            if(prs.length == 0) {
                throw 'api response values was empty'
            }
        } catch(e) {
            console.log(`Error fetching PR for branch ${branch} - ${e}`)
            continue;
        }
        let url = prs[0].links.html.href;

        let link = `${i+1}. ${msg}\n${url}`
        console.log(`${msg} - ${url}`)
        links.push(link)
    }

    // copy to the clipboard
    let content = links.join("\n")
    urlpaste(content)

    console.log("copied to clipboard!")
}

function urlpaste(data:string) {
    // use special custom hyperlink utility
    shelljs.exec(`echo \"${data}\" |  urlpaste`, {silent: true})
}

prs()