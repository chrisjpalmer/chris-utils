import { post } from "./helpers/bitbucket"


async function gettoken() {

    post(`https://bitbucket.org/site/oauth2/authorize?client_id=${clientid}&response_type=code`)
}

gettoken()