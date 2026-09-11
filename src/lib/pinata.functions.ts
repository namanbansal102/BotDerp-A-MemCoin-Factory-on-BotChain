import { createServerFn } from "@tanstack/react-start";
import { PinataSDK } from "pinata";
import { z } from "zod";

const uploadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  dataBase64: z.string().min(1),
});

export const uploadImageToIpfs = createServerFn({ method: "POST" })
  .validator((data: unknown) => uploadSchema.parse(data))
  .handler(async ({ data }) => {
    const jwt = process.env["PINATA_JWT"];
    if (!jwt) {
      throw new Error("Image storage is not configured yet (missing Pinata key).");
    }

    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const pinata = new PinataSDK({
      pinataJwt: jwt,
      pinataGateway: process.env["PINATA_GATEWAY"],
    });
    const file = new File([bytes], data.fileName, { type: data.contentType });
    const upload = await pinata.upload.public.file(file);
    const gateway = process.env["PINATA_GATEWAY"]?.replace(/^https?:\/\//, "").replace(/\/$/, "");

    return {
      uri: `ipfs://${upload.cid}`,
      url: gateway ? `https://${gateway}/ipfs/${upload.cid}` : undefined,
    };
  });
