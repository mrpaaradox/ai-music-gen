import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { generateSong } from "~/inngest/functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  client: inngest,
  functions: [
    /* your functions will be passed here later! */
    generateSong,
  ],
});
