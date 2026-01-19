import { Inngest } from "inngest";

// Create a client to send and receive events
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
export const inngest = new Inngest({ id: "music-generator" });
