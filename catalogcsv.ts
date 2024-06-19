import { loadConfig } from "./helpers";
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

const header = ["name", "system", "tags", "owner"]
async function catalogrefs () {
    let cfg = loadConfig()
    makeCsv('repos', cfg.repos)
    makeCsv('noCatalog', cfg.noCatalog)
    makeCsv('unknownSystem', cfg.unknownSystem)
}

function makeCsv(filetype, rawcatalog) {
    const catalog = rawcatalog.map(r => [r.name, r.system, r.tags.join(','), '']);
    const rows = [header, ...catalog]
    const out = stringify(rows)
    fs.writeFileSync(`./csvs/${filetype}.csv`, out)
}

catalogrefs();