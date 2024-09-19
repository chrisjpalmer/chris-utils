
async function main () {
    const url = `https://api.au1.sysdig.com/secure/vulnerability/v1beta1/accepted-risks`
    const vulns = [
        "CVE-2018-3767",
        // "CVE-2023-37920",
        // "CVE-2024-32002",
        // "CVE-2023-6879",
        // "CVE-2024-5171",
        // "CVE-2023-26136",
        // "CVE-2024-28835",
        // "CVE-2024-21512",
        // "CVE-2023-45853"
    ]
    const token = "<my-token>"

    for (let v of vulns) {
        const payload = {
            "context": [{
                "contextType": "imagePrefix",
                "contextValue": "175914186171.dkr.ecr.ap-southeast-2.amazonaws.com/service-developer-portal"
            }],
            "entityType": "vulnerability",
            "entityValue": v,
            "reason": "RiskOwned",
            "description": "Owned by DevEx (formerly productivity) until post olympics period.",
            "expirationDate": "2024-08-16"
        }
        const rs = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        })
        const rsbody = await rs.json()
        console.log(`Accepted risk for ${v} with status ${rs.status}}`)
        console.log(rsbody)
    }
}

main();