import * as shelljs from 'shelljs';
import { getWorkdir } from './helpers';

function body () {
    const workdir = getWorkdir();

    let body = shelljs.exec('git log -1 --pretty=format:"%b"', {cwd:workdir, silent: true}).toString();
    body = body.replace(/(?<=\S)\n(?=\S)/g, ' ')
    body = body.replace(/"/g, `\\"`)
    body = body.replace(/`/g, "\\`")
    console.log(body)
    shelljs.exec(`echo "${body}" | pbcopy`)
    console.log("copied!")
}

body()