import { Config } from "../config";
import { UserSummary } from "./cache";
import { Account } from "./account";
import { getAll, post } from "./client";
import { AxiosError } from "axios";

export async function getPrsMadeByUser(cfg:Config, user:UserSummary, reviewedBy:UserSummary | null, onlyMaster: boolean): Promise<PR[]> {
    let conditions = [`state = "OPEN"`]
    if (!!reviewedBy) {
        conditions.push(`reviewers.account_id = "${reviewedBy.accountUuid}"`)
    }
    if(onlyMaster) {
        conditions.push(`(destination.branch.name = "master" OR destination.branch.name = "main")`)
    }
    const query = encodeURIComponent(conditions.join(" AND "))
    
    const prs = await getAll<PR>(cfg, `https://api.bitbucket.org/2.0/pullrequests/${user.accountUuid}?q=${query}`)
    
    console.log(prs[0])

    return prs
}

export interface PR {
    type: string;
    id: number;
    title: string;
    links: {
        self: {
            href: string;
        },
        html: {
            href: string;
        }
    },
    source: {
        repository: {
            name: string
        }
    }
    reviewers: any,
}

export async function getPrStatuses(cfg:Config, repo: string, prid: number): Promise<PRStatus[]> {
    return getAll(cfg, `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${repo}/pullrequests/${prid}/statuses?fields=${encodeURIComponent('-links')}`)
}

export interface PRStatus {
    type: string;
    id: number;
    key: string;
    refname: string;
    name: string;
    uuid: string;
    state: 'SUCCESSFUL' | 'FAILED' | 'STOPPED' | 'INPROGRESS'
}

export async function getPrActivity(cfg:Config, repo: string, prid: number): Promise<PRActivity[]> {
    return getAll(cfg, `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${repo}/pullrequests/${prid}/activity`)
}

export interface PRActivity {
    approval: {user: Account}
    update: {reviewers: Account[]}
}


export interface PostPR {
    title: string
    description: string
    source: {branch: {name: string}}
    destination: {branch: {name: string}}
    reviewers: {
        // type: string,
        uuid: string
    }[],
    close_source_branch: boolean,

}

export interface PostPRForm {
    repo: string
    subject: string
    description: string
    sourceBranch: string
    targetBranch: string
    reviewers: UserSummary[]
}

export async function makePr(cfg:Config, pr: PostPRForm) : Promise<PR> {
    const url = `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${pr.repo}/pullrequests`
    
    const body:PostPR = {
        title: pr.subject,
        description: pr.description,
        source: {branch: {name: pr.sourceBranch}},
        destination: {branch: {name: pr.targetBranch}},
        reviewers: pr.reviewers.map(r => ({uuid: r.uuid})),
        close_source_branch: true,
    }
    try {
        let rs = await post<PR, PostPR>(cfg, url, body)
        return rs;
    } catch(e) {
        const err = (e as AxiosError)
        console.log(url)
        console.log(JSON.stringify(body))
        throw `error while making PR ${err.status}: ${err.cause}), ${e}`
    }
}