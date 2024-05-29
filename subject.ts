import * as shelljs from 'shelljs';
import { getWorkdir } from './helpers';

function subject () {
    const workdir = getWorkdir();

    let subject = shelljs.exec('git log -1 --pretty=format:"%s"', {cwd:workdir, silent: true}).toString();
    subject = subject.replace(/(?<=\S)\n(?=\S)/g, ' ')
    subject = subject.replace(/"/g, `\\"`)
    subject = subject.replace(/`/g, "\\`")
    console.log(subject)
    shelljs.exec(`echo "${subject}" | pbcopy`)
    console.log("copied!")
}

subject()