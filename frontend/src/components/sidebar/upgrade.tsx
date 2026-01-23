/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

"use client"

import { authClient } from "~/lib/auth-client"
import { Button } from "../ui/button"

export default function Upgrade(){

    const upgrade = async() => {
        await authClient.checkout({
            products:[
                "18477266-b079-417a-ac2c-d41555564a37",
                "76a726dc-b47d-4f3b-a1b0-bc76b5240542",
                "8005497e-53ca-49f8-8410-98336ce07a10"
            ]
        })
    }

    return <Button
    variant={`outline`}
    size={`sm`}
    className="ml-2 cursor-pointer text-orange-400"
    onClick={upgrade}
    >       
        Upgrade
    </Button>

}