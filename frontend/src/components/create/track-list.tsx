"use client"

import { Search } from "lucide-react"
import { Input } from "../ui/input"
import { useState } from "react"

export interface Track {
    id: string,
    title: string | null,
    createdAt: Date,
    instrumental: boolean,
    prompts: string | null,
    lyrics: string | null,
    describedLyrics: string | null,
    fullDescribedSong: string | null,
    thumbnailUrl: string | null,
    playUrl: string | null,
    status: string | null,
    createdByUserName: string | null,
    published: boolean

}

export function TrackList({tracks}: {tracks: Track[]} ){

    const [searchQuery, setSearchQuery] = useState("")

        return (
            <div
            className="flex flex-1 flex-col overflow-y-scroll"
            >
                <div
                className="flex-1 p-6"
                >
                    <div
                    className="mb-4 flex items-center justify-between gap-4"
                    >
                        <div
                        className="relative max-w-md flex-1"
                        >
                            <Search
                            className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 "
                            />
                            <Input 
                            placeholder="Search..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
}