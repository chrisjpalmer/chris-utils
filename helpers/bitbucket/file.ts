import { AxiosError } from "axios";
import { Config } from "../config";
import { get, getRaw } from "./client";


export async function getFileFromBitbucket(cfg:Config, repo:string, branch:string, file:string): Promise<string | null> {
    const url = `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${repo}/src/${branch}/${file}`
    try {
        return await getRaw<string>(cfg, url)
    } catch(e) {
        const axisError = e as AxiosError
        if (axisError.response?.status == 404) {
            return null;
        }
        throw `get repo failed with status ${axisError.response?.status} and response ${axisError.response?.data}. url: ${url}`
    }
}