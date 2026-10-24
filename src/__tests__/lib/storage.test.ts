import { uploadToMinIO } from "@/lib/minio";
import fs from "fs/promises";
import path from "path";

describe("Storage Upload (uploadToMinIO)", () => {
  it("should return empty string if file is empty", async () => {
    const result = await uploadToMinIO(null as any, "test");
    expect(result).toBe("");
  });

  it("should save file to local public/uploads directory when S3 is not configured", async () => {
    const fileContent = "fake-image-content";
    const file = {
      name: "test-logo.png",
      type: "image/png",
      size: fileContent.length,
      arrayBuffer: async () => Buffer.from(fileContent),
    } as unknown as File;

    const result = await uploadToMinIO(file, "system");
    expect(result).toMatch(/^\/uploads\/system\/.*\.png$/);

    // Verify file actually exists on disk
    const relativePath = result.replace(/^\//, "");
    const fullPath = path.join(process.cwd(), "public", relativePath);
    const exists = await fs.stat(fullPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Clean up test file
    await fs.unlink(fullPath).catch(() => {});
  });
});
