import yaml from 'yaml'
import fs from 'fs'

export const catalogInfo = "catalog-info.yaml"

export function catalogFile(repoPath: string) {
    return `${repoPath}/${catalogInfo}`
}

export function readCatalogFile(repoPath:string) {
    const f = fs.readFileSync(catalogFile(repoPath)).toString()
    return yaml.parseAllDocuments(f)
}

export function saveCatalogFile(repoPath: string, files: yaml.Document[]) {
    let s = ""
    for(const f of files) {
        s += f.toString()
    }
    fs.writeFileSync(catalogFile(repoPath), s)
}

export function componentDocument(docs: yaml.Document[]) {
    return docs.find(doc => doc.get("kind") == 'Component')
}

export function hasComponentDocument(docs: yaml.Document[]): boolean {
    return docs.find(doc => doc.get("kind") == 'Component') !== null
}

/// depends on
export function spec(comp: yaml.Document) {
    return comp.get("spec") as yaml.YAMLMap | null
}

export function hasSpec(comp: yaml.Document): boolean {
    return comp.has("spec")
}

export function dependsOn(spec: yaml.YAMLMap) {
    return spec.get("dependsOn") as yaml.YAMLSeq<yaml.Scalar<string>> | null
}

export function hasDependsOn(spec: yaml.YAMLMap): boolean {
    return spec.has("dependsOn")
}

export function createDependsOn<T>(spec: yaml.YAMLMap<string>) {
    alphabeticallyInsertMapItem(spec, new yaml.Pair("dependsOn", new yaml.YAMLSeq()))
}

/// System
export function system(spec: yaml.YAMLMap) {
    return spec.get("system") as string | null
}

export function hasSystem(spec: yaml.YAMLMap): boolean {
    return spec.has("system")
}

export function createSystem(spec: yaml.YAMLMap<string>) {
    alphabeticallyInsertMapItem(spec, new yaml.Pair("system", ""))
}

export function setSystem(spec: yaml.YAMLMap, value: string) {
    spec.set("system", value)
}

// owner
export function owner(spec: yaml.YAMLMap) {
    return spec.get("owner") as string | null
}

export function hasOwner(spec: yaml.YAMLMap): boolean {
    return spec.has("owner")
}

export function createOwner(spec: yaml.YAMLMap<string>) {
    alphabeticallyInsertMapItem(spec, new yaml.Pair("owner", ""))
}

export function setOwner(spec: yaml.YAMLMap, value: string) {
    spec.set("owner", value)
}


/// Tags
export function metadata(comp: yaml.Document) {
    return comp.get("metadata") as yaml.YAMLMap | null
}

export function hasMetadata(comp: yaml.Document): boolean {
    return comp.has("metadata")
}

export function tags(metadata: yaml.YAMLMap) {
    return metadata.get("tags") as yaml.YAMLSeq<yaml.Scalar<string>> | null
}

export function hasTags(metadata: yaml.YAMLMap): boolean {
    return metadata.has("tags")
}

export function createTags<T>(metadata: yaml.YAMLMap<string>) {
    alphabeticallyInsertMapItem(metadata, new yaml.Pair("tags", new yaml.YAMLSeq()))
}

export function alphabeticallyInsert(target: yaml.YAMLSeq<yaml.Scalar<string>>, toInsert:string[]) {
    for(const ins of toInsert) {
        alphabeticallyInsertOne(target, ins)
    }
}

export function alphabeticallyInsertOne(target: yaml.YAMLSeq<yaml.Scalar<string>>, toInsert:string) {
    alphaInsert(target.items, new yaml.Scalar(toInsert), t => t.value)
}

export function alphabeticallyInsertMapItem<T>(target: yaml.YAMLMap<string, T>, toInsert:yaml.Pair<string, T>) {
    alphaInsert(target.items, toInsert, t => t.key)
}

function alphaInsert<T>(target: T[], toInsert:T, getKey:(t:T) => string) {
    for(let i = 0; i < target.length; i++) {
        const item = target[i]
        if(getKey(toInsert) < getKey(item)) {
            target.splice(i, 0, toInsert)
            return
        }
    }
    target.push(toInsert)
}