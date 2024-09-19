import { screen, list } from 'blessed';

export async function getUserSelection(items: string[]): Promise<string> {
    const sc = screen({smartCSR: true})
    const ls = list({
        parent: sc, // Can't capture events if we use screen.append(taskList)
        width: 50,
        keys: true, 
        items: items,
        style: {
            selected: { bg: 'blue' },
            item: { fg: 'magenta' }
        },
        keyable: true,
    })
    sc.key(['escape', 'q', 'C-c'], function() { sc.destroy(); process.exit(0); });
   
    let selected = new Promise<string>((resolve, reject) => {
        ls.on('select', (item, index) => {
            sc.destroy()
            resolve(items[index])
        })
    })
    sc.render()

    return await selected
}