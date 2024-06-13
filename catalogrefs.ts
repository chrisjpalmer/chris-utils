import { BackstageComponent, Config, SpinAfter, loadConfig, Repo as ConfigRepo } from "./helpers";
import { getFileFromBitbucket } from "./helpers/bitbucket/file";
import { Repo as BitbucketRepo, getRepo } from "./helpers/bitbucket/repo";
import yaml, { Scalar, YAMLMap, YAMLSeq } from 'yaml';
import { getReferences } from "./helpers/sourcegraph";
import { Diff, DiffedField } from "./helpers/diff";
import readline from 'node:readline';
import { gitAddFile, gitCheckoutBranch, gitClone, gitCommit, gitPushForce, gitShowP } from "./helpers/git";
import { alphabeticallyInsert, componentDocument, spec, createDependsOn, createSystem, createTags, dependsOn, hasComponentDocument, hasSpec, hasDependsOn, hasMetadata, hasSystem, hasTags, metadata, readCatalogFile, setSystem, system, tags, catalogFile, catalogInfo, saveCatalogFile } from "./helpers/catalog";
import { loadUsers, makePr } from "./helpers/bitbucket";





async function catalogrefs () {

    // config
    let cfg = loadConfig()

    const me = (await loadUsers(cfg, [cfg.me]))[0]
    const reviewers = (await loadUsers(cfg, cfg.team)).filter(u => u.accountUuid != me.accountUuid)


    process.on('SIGINT', function() {
        process.exit();
    });

    const sourceRepos = cfg.noCatalog;

    // validate config
    for(const repo of sourceRepos) {
        if (!repo.system || !repo.tags) {
            console.log(`missing system or tags for ${repo.name}`)
            return;
        }
    }

    const spinner = new SpinAfter(0);
    spinner.start('loading repos')
    const repos = await initializeRepos(cfg, sourceRepos, spinner)
    spinner.stop()
    
    // set actual
    await setActualCatalog(cfg, repos, spinner)

    // set expected
    await setExpectedCatalog(cfg, sourceRepos, repos, spinner)

    // make prs

    // ask first
    // if yes, shallow clone, manipulate catalog, push, create pr
    for(const repo of repos) {
        const name = repo.name
        const c = repo.catalog

        console.log(`\n------------${repo.name}`)
        if(!repo.hasCatalog) {
            console.log(`\tNO CATALOG`)
            continue
        }

        // console.log("\tactual dependsOn", c.dependsOn.actual)
        // console.log("\texpected dependsOn", c.dependsOn.expected)
        if(c.dependsOn.diff.different) {
            console.log(`\tdependsOn missing: ${c.dependsOn.diff.difference}, actual is: ${c.dependsOn.actual}`)
        }

        // console.log("\tactual tags", c.tags.actual)
        // console.log("\texpected tags", c.tags.expected)
        if(c.tags.diff.different) {
            console.log(`\ttags missing: ${c.tags.diff.difference}, actual is: ${c.tags.actual}`)
        } 
        
        // console.log("\tactual system", c.system.actual)
        // console.log("\texpected system", c.system.expected)
        if(c.system.diff.different) {
            console.log(`\tsystem should be: ${c.system.expected}, actual is: ${c.system.actual}`)
        }

        if(!c.dependsOn.diff.different && !c.system.diff.different && !c.tags.diff.different) {
            console.log(`\tno differences`)
            continue
        }

        // uncomment for pr workflow
        continue

        if(!c.dependsOn.diff.different && !c.system.diff.different && !c.tags.diff.different) {
            console.log(`skipping ${name} as there are no differences`)
            continue
        }

        if(!repo.hasCatalog) {
            console.log(`skipping ${name} as it has no catalog`)
            continue
        }

        if(!(await confirmDraftChanges(name))) {
            console.log(`skipping ${name}`)
            continue
        }


        const fp = gitClone(cfg, name)


        const dateStr = new Date().toISOString().split('T')[0]
        const sourceBranch = `catalog-update-${dateStr}`
        gitCheckoutBranch(cfg, name, sourceBranch)

        const catDoc = readCatalogFile(fp)
        try {
            applyDiffs(catDoc, c)
        } catch(e) {
            console.log(`error applying diffs for ${name}`, e)
        }
        saveCatalogFile(fp, catDoc)

        gitAddFile(cfg, name, catalogInfo)

        let msg: {subject: string, body: string};
        if( c.system.diff.different && !c.dependsOn.diff.different && !c.tags.diff.different) {
            msg = commitMessageOnlySystem()
        } else {
            msg = commitMessage(c)
        }

        gitCommit(cfg, name, msg.subject, msg.body)

        gitShowP(cfg, name)

        // console.log()

        if(!(await confirmPR(name))) {
            console.log(`skipping ${name}`)
            continue
        }

        gitPushForce(cfg, name, sourceBranch)

        await makePr(cfg, {
            repo: name,
            subject: msg.subject,
            description: msg.body,
            sourceBranch: sourceBranch,
            targetBranch: repo.branch,
            reviewers: reviewers
        })
    }

}





async function confirmPR(repo:string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(`Would you like to create a PR for ${repo} Y/n\n`, answer => {
            rl.close();
            resolve(answer.toLowerCase() == 'y')
        });
    })
}

async function confirmDraftChanges(repo:string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(`Would you like to draft changes for ${repo} Y/n\n`, answer => {
            rl.close();
            resolve(answer.toLowerCase() == 'y')
        });
    })
}

function applyDiffs(docs: yaml.Document[], diff: Catalog) {
    if(!hasComponentDocument(docs)) {
        throw new Error(`no component document found`)
    }
    const comp = componentDocument(docs)

    if(!hasSpec(comp)) {
        throw new Error(`spec not found in component file`)
    }
    const sp = spec(comp)

    if (!hasMetadata(comp)) {
        throw new Error(`metadata not found in component file`)
    }
    const meta = metadata(comp)

    
    if(diff.dependsOn.diff.different) {
        if(!hasDependsOn(sp)) {
            createDependsOn(sp as yaml.YAMLMap<string>)
        }
        const deps = dependsOn(sp)
        deps.flow = false
        alphabeticallyInsert(deps, diff.dependsOn.diff.difference)
    }

    
    if (diff.system.diff.different) {
        if(!hasSystem(sp)) {
            createSystem(sp as yaml.YAMLMap<string>)
        }
        setSystem(sp, diff.system.diff.difference)
    }
    
    
    if(diff.tags.diff.different) {
        if(!hasTags(meta)) {
            createTags(meta as yaml.YAMLMap<string>)
            // console.log('1', meta.get('tags'))
        }
        // console.log('2', meta.get('tags'))
        const tg = tags(meta)
        tg.flow = false
        // console.log("inserting tags", diff.tags.diff.difference)
        alphabeticallyInsert(tg, diff.tags.diff.difference)
        // console.log("tags are now", meta.get("tags"))
    }
}





interface Repo {
    name: string
    branch: string
    catalog: Catalog
    hasCatalog: boolean
}

interface Catalog { 
    dependsOn: DiffedField<string[]>;
    system: DiffedField<string>;
    tags: DiffedField<string[]>;
}

async function initializeRepos(cfg:Config, cfgRepos: ConfigRepo[], spinner:SpinAfter) : Promise<Repo[]> {
    let repos: Repo[] = []
    for(const repo of cfgRepos) {
        spinner.setMessage(`loading ${repo.name}`)
        const r = await getRepo(cfg, repo.name);
        
        repos.push({
            name: repo.name,
            branch: r.branch,
            hasCatalog: false,
            catalog: {
                dependsOn: new DiffedField(stringArrayDiffer, [], []), 
                system: new DiffedField(systemDiffer, "", ""), 
                tags: new DiffedField(stringArrayDiffer, [], [])
            }
        })
    }

    return repos;
}



async function setActualCatalog(cfg:Config, repos: Repo[], spinner:SpinAfter) {
    for(const r of repos) {
        let catalog = await getFileFromBitbucket(cfg, r.name, r.branch, 'catalog-info.yaml')
        if(catalog == null) { 
            spinner.reset()
            continue;
        }
        r.hasCatalog = true;

        const docs = yaml.parseAllDocuments(catalog)
        if(!hasComponentDocument(docs)) {
            console.log(`no component document found for ${r.name}`)
            continue;
        }
        const comp = componentDocument(docs)

        if(!hasSpec(comp)) {
            console.log(`spec not found in component file for ${r.name}`)
            continue;
        }
        const sp = spec(comp)

        if (!hasMetadata(comp)) {
            console.log(`metadata not found in component file for ${r.name}`)
            continue;
        }
        const meta = metadata(comp)

        // set actuals
        if(hasDependsOn(sp)) {
            const deps = dependsOn(sp)
            r.catalog.dependsOn.actual = deps.items.map(item => (item as Scalar).value as string) || []
        }

        if (hasSystem(sp)) {
            const sys = system(sp)
            r.catalog.system.actual = sys
        }
        
        if(hasTags(meta)) {
            const tg = tags(meta)
            if(tg != null) {
                r.catalog.tags.actual = tg.items.map(item => (item as Scalar).value as string) || []
            }     
        }
    }
}

async function setExpectedCatalog(cfg:Config, cfgRepos: ConfigRepo[], repos: Repo[], spinner:SpinAfter) {
    spinner.start("resolving expected values")
    for(const r of repos) {
        const expected = cfgRepos.find(repo => repo.name == r.name)

        spinner.setMessage(`resolving dependsOn for ${r.name}`)
        try {
            // expected dependsOn
            let expectedDependsOn: string[] = [];
            for(let component of cfg.backstageComponents) {
                if(await hasComponent(cfg, component, r.name)) {
                    expectedDependsOn.push(component.id)
                }
            }
            r.catalog.dependsOn.expected = expectedDependsOn

            // expected system
            r.catalog.system.expected = expected.system

            // expected tags
            r.catalog.tags.expected = expected.tags
        } catch(e) {
            spinner.reset()
            console.log('exception when setting expected for repo: ', r.name, e)
        }
    }
    spinner.stop()
}


async function hasComponent(cfg:Config, component:BackstageComponent, repoName:string): Promise<boolean> {
    let references = await getReferences(cfg, repoName, component.searchPaths, component.match)
    if (references.length > 0) {
        return true
    }
    return false
}


function systemDiffer(expected:string, actual:string): Diff<string> {
    if(expected == actual) {
        return { different: false, difference: null }
    }
    return { different: true, difference: expected }
}

function stringArrayDiffer(expected:string[], actual:string[]): Diff<string[]> {
    let diff = expected.filter(c => !actual.includes(c))
    if (diff.length == 0) {
        return { different: false, difference: null }
    }
        
    return { different: true, difference: diff }
}

function commitMessage(catalog: Catalog) {
    let changedShort = []
    let changedLong = []
    if(catalog.dependsOn.diff.different) {
        changedShort.push('deps')
        changedLong.push('dependencies')
    }

    if(catalog.tags.diff.different) {
        changedShort.push('tags')
        changedLong.push('tags')
    }

    if(catalog.system.diff.different) {
        changedShort.push('relations')
        changedLong.push('relations')
    }

    const makeSubject = (nouns: string) => {
        return `Update backstage catalog ${nouns}`
    }

    let subject = makeSubject(joinAnd(changedShort))
    if (subject.length > 50) {
        subject = makeSubject(changedShort.join(', '))
    }
    if (subject.length > 50) {
        throw new Error(`subject too long: ${subject}`)
    }
    const body = `This commit updates the backstage catalog so that it reflects the current state of this repo's ${joinAnd(changedLong)}. The purpose is to allow backstage to reflect the most up to information, and thus increase the value of the backstage catalog to developers.

[patch]

Part of PROD-4303`

    return {subject, body}
}


function commitMessageOnlySystem() {
    

    let subject = `Update backstage catalog system`
    const body = `This commit updates the backstage catalog to have the correct system relation. The purpose is to allow backstage to reflect the most up to information, and thus increase the value of the backstage catalog to developers.

[patch]

Part of PROD-4303`

    return {subject, body}
}

function joinAnd(s:string[]) {
    if(s.length == 0) {
        return ""
    }
    if(s.length == 1) {
        return s[0]
    }
    return s.slice(0, -1).join(', ') + ' and ' + s[s.length - 1]
}

catalogrefs();