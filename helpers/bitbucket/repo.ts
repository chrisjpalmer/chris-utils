import { AxiosError } from "axios";
import { Config } from "../config";
import { get, getSingle } from "./client";


interface BitbucketRepo {
    mainbranch: { name: string, type: string } 
}

export interface Repo {
    name: string
    branch: string
}

export async function getRepo(cfg:Config, repo:string): Promise<Repo> {
    const url = `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${repo}`
    try {
        let rs = await getSingle<BitbucketRepo>(cfg, url)
        return {name:repo, branch:rs.mainbranch.name}
    } catch(e) {
        const axisError = e as AxiosError
        if (axisError.status == 404) {
            throw 'repository doesn\'t exist'
        }
        throw `get repo failed with status ${axisError.status} and response ${axisError.response?.data}. url: ${url}`
    }
}