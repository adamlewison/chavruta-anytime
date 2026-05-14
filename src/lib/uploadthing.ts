import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// uploadthing makes a cross-origin HEAD to the ingest URL to check for a
// resumable byte offset (x-ut-range-start). The ingest server doesn't return
// CORS headers on HEAD responses, so the browser blocks it → FetchError.
// Intercept HEAD requests and return a synthetic 200 with range-start=0,
// which tells uploadthing to start the upload from the beginning (no resume).
const utFetch: typeof fetch = (input, init) => {
  if (init?.method === "HEAD") {
    return Promise.resolve(
      new Response(null, {
        status: 200,
        headers: { "x-ut-range-start": "0" },
      }),
    );
  }
  return fetch(input, init);
};

export const { uploadFiles } = genUploader<OurFileRouter>({ fetch: utFetch });
