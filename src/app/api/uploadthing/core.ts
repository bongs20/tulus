// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

function assertUploadThingConfig() {
  const token = process.env.UPLOADTHING_TOKEN;

  if (
    !token ||
    token === "your-uploadthing-token"
  ) {
    throw new Error(
      "UploadThing is not configured. Set a valid UPLOADTHING_TOKEN in .env.",
    );
  }
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async () => {
      assertUploadThingConfig();

      return {
        uploadedBy: "TULUS_System",
      };
    })
    // Set permissions and specify metadata for each file route
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload
      console.log("Upload complete for file:", file.url);
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.uploadedBy, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
