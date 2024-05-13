import readlineSync from 'readline-sync';

export function getLines(question: string): string[] {
    let lines:string[] = [];
    console.log(question + '\n')
    for(;;) {
        let data = readlineSync.question()
        
        if(!data) {
            break;
        }
        lines.push(data)
    }
    return lines
}