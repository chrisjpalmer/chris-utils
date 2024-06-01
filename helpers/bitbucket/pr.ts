import { Config } from "../config";
import { UserSummary } from "./cache";
import { Account } from "./account";
import { getAll } from "./client";

export async function getPrsMadeByUser(cfg:Config, user:UserSummary, hasReviewer:UserSummary | null): Promise<PR[]> {
    let query = `state = "OPEN"`
    if (!!hasReviewer) {
        query = `state = "OPEN" AND reviewers.account_id = "${hasReviewer.accountUuid}"`
    }
    query = encodeURIComponent(query)
    
    return getAll(cfg, `https://api.bitbucket.org/2.0/pullrequests/${user.accountUuid}?q=${query}`)
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
