import { getLines } from './helpers';
import commandLineArgs, { OptionDefinition } from "command-line-args";

function alpha () {
    
    const optionDefinitions: OptionDefinition[] = [
        { name: 'pipeline', alias: 'p', type: Boolean },
    ]
    
    const options = commandLineArgs(optionDefinitions);
    
    
    if (options["pipeline"]) {
        let tokens = getLines('Enter the tokens for alphabetical ordering (pipeline mode):')
        tokens.sort((a, b) => {
            let ar = getRank(a)
            let br = getRank(b)
            
            if (ar < br) {
                return -1
            }
            if (ar > br) {
                return 1
            }
            
            return a.localeCompare(b)
        }).forEach(t => console.log(t))
    } else {
        let tokens = getLines('Enter the tokens for alphabetical ordering:')
        tokens.sort().forEach(t => console.log(t))
    }
}

const ruleRanks = [
    isPrimaryKey,
    (t) => !isPipelineToken(t),
    isHookStep,
]

function getRank(token: string) {
    for (const rule of ruleRanks) {
        if (rule(token)) {
            return ruleRanks.indexOf(rule)
        }
    }
    return null;
}

function isPipelineToken(token: string) {
   return isPrimaryKey(token) || isHookStep(token);
}

function isPrimaryKey(token: string) {
    const pipelineTokens = [
        "across",
        "do",
        "get",
        "in_parallel",
        "load_var",
        "put",
        "set_pipeline",
        "task",
        "try",
    ];
    return pipelineTokens.includes(token)
}

function isHookStep(token: string) {
    const pipelineTokens = [
        "ensure",
        "on_abort",
        "on_error",
        "on_failure",
        "on_success",
    ];
    return pipelineTokens.includes(token)
}

alpha()