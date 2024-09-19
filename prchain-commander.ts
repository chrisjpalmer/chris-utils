import { getBranches, getWorkdir } from "./helpers"
import commandLineArgs, { OptionDefinition } from "command-line-args";
import fs from 'fs';
import { getUserSelection } from "./helpers/select";

export interface PRChainCommanderConfig {
    enterBranchesPrompt:string
    branchesFilter: (branch:string) => boolean,
    branchesForUserSelection: (branches:string[]) => string[],
    makeCmd: (branches:string[], selectedBranchIdx:number) => string
}

export async function prchainCommander (cfg: PRChainCommanderConfig) {
    const workDir = getWorkdir()
    const optionDefinitions: OptionDefinition[] = [
        { name: 'chain', alias: 'c', type: String, defaultValue: "main.prchain" },
        { name: 'branches', alias: 'b', type: String, multiple: true },
        { name: 'output', alias: 'o', type: String },
    ]

    // handle Ctrl + c
    process.on('SIGINT', function() {
        process.exit();
    });

    const options = commandLineArgs(optionDefinitions);
    const output = options["output"]
   
    const branches = getBranches(cfg.enterBranchesPrompt, options["branches"], workDir, options["chain"]).filter(cfg.branchesFilter)

    if (!!output) {
        const branch = await getUserSelection(cfg.branchesForUserSelection(branches))
        // write to output (if specified)
        if(output) {
            const i = branches.findIndex(b => b == branch)
            fs.writeFileSync(output, cfg.makeCmd(branches, i))
        }
    } else {
         // make commands
        let cmds = []
        for(let i = 1; i < branches.length; i++) {
            cmds.push(cfg.makeCmd(branches, i))
        }

        // print commands
        console.log(" ")
        console.log(" ")
        cmds.forEach(c => console.log(c))
    }
}
