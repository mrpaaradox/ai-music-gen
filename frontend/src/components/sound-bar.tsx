"use client"


import { Music } from "lucide-react"
import { usePlayerStore } from "~/stores/use-player-store"
import { Card } from "./ui/card"

export default function SoundBar(){
    
    const {track} = usePlayerStore()
    
    return (
       <div
       className="px-4 pb-2"
       >
         <Card
        className="bg-background/60 relative w-full shrink-0 border-t py-0 backdrop-blur"
        >
            <div
            className="space-y-2 p-3"
            >
                <div
                className="flex items-center justify-between"
                >
                    <div
                    className="flex min-w-0 flex-1 items-center gap-2"
                    >
                        <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-orange-300 to-orange-500"
                        >
                            {
                                track?.artwork ? <img className="h-full w-full rounded-md object-cover" src={track.artwork} alt="song image" /> : <Music className="text-white"/>
                            }
                        </div>
                            <div
                            className="max-w-24 min-w-0 flex-1 md:max-w-full"
                            >
                                <p
                                className="truncate text-xs font-medium"
                                >
                                    {
                                        track?.title 
                                    }
                                </p>
                            <p
                            className="text-muted-foreground truncate text-xs"
                            >
                                {track?.createdByUsername}
                            </p>
                            </div>
                    </div>
                </div>
            </div>
        </Card>
       </div>
    )
}