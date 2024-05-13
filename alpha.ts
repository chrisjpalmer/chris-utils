import { getLines } from './helpers';

function alpha () {
    let tokens = getLines('Enter the tokens for alphabetical ordering:')

    tokens.sort().forEach(t => console.log(t))
}

alpha()