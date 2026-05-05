// src/lib/uploadthing.ts
import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
  Uploader,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
export { Uploader };
