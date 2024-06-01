
import axios, { AxiosResponse } from 'axios';
import { Config } from '../config';

export interface ApiResponse<T> {
    type: string;
    values: T[];
    page: number;
    pagelen: number;
    next: string;
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