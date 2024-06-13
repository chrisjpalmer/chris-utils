
import axios, { AxiosResponse } from 'axios';
import { Config } from '../config';

export interface ApiResponse<T> {
    type: string;
    values: T[];
    page: number;
    pagelen: number;
    next: string;
}

export type ApiResponseSingle<T> = T & {
    type: string;
}


export async function get<T>(cfg: Config, url: string) : Promise<ApiResponse<T>> {

    let rsp:AxiosResponse<ApiResponse<T>> = await axios.get(
        url, 
        {
            auth:{
                username: cfg.user, 
                password: cfg.apiToken
            }
        }
    )

    return rsp.data
}

export async function post<T, Q>(cfg: Config, url: string, data:Q) : Promise<ApiResponseSingle<T>> {
    let rsp:AxiosResponse<ApiResponseSingle<T>> = await axios.post(
        url, 
        data,
        {
            auth:{
                username: cfg.user, 
                password: cfg.apiToken
            },
            headers: { "Content-Type": "application/json" },
        },
    )

    return rsp.data
}


export async function getSingle<T>(cfg: Config, url: string) : Promise<ApiResponseSingle<T>> {

    let rsp:AxiosResponse<ApiResponseSingle<T>> = await axios.get(
        url, 
        {
            auth:{
                username: cfg.user, 
                password: cfg.apiToken
            }
        }
    )

    return rsp.data
}

export async function getRaw<T>(cfg: Config, url: string) : Promise<T> {
    

    
        let rsp:AxiosResponse<T> = await axios.get(
            url, 
            {
                auth:{
                    username: cfg.user, 
                    password: cfg.apiToken
                }
            }
        )
        return rsp.data

}


export async function getAll<T>(cfg: Config, url: string) : Promise<T[]> {
    let values:T[] = []
    let nextUrl = url
    for (;;) {

        let rs = await get<T>(cfg, nextUrl)
        
        values.push(...(rs.values || []))

        if(!rs.next) {
            break;
        }

        nextUrl = rs.next
    }


    return values
}