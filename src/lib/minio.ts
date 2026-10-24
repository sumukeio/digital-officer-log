import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

// 延迟初始化 S3 客户端 (Supabase Storage 兼容 S3 协议)
function getS3Client() {
  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKeyId = process.env.MINIO_ACCESS_KEY;
  const secretAccessKey = process.env.MINIO_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey || endpoint.includes("dummy.supabase.co")) {
    return null;
  }

  return new S3Client({
    region: "us-east-1", // Supabase 这里的 region 不关键，填 us-east-1 即可
    endpoint: endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true, // 必须开启
  });
}

/**
 * 上传文件到 Supabase Storage / MinIO 或本地持久化存储
 * @param file 文件对象
 * @param bucketName 目标 Bucket 名称 (system / issues / reports)
 * @returns 图片的完整访问 URL
 */
export async function uploadToMinIO(file: File, bucketName: string): Promise<string> {
  if (!file || file.size === 0) {
    return "";
  }

  let buffer: Buffer;
  try {
    if (typeof (file as any).arrayBuffer === "function") {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else if (typeof (file as any).text === "function") {
      const text = await (file as any).text();
      buffer = Buffer.from(text);
    } else {
      buffer = Buffer.from((file as any).toString());
    }
  } catch (e) {
    buffer = Buffer.from("");
  }

  // 生成唯一文件名: timestamp-random-filename
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = (file.name.split('.').pop() || 'png').replace(/[^a-zA-Z0-9]/g, '');
  const filename = `${uniqueSuffix}.${ext}`;

  // 1. 尝试使用 S3 / MinIO 远程上传
  const s3Client = getS3Client();
  if (s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: buffer,
        ContentType: file.type || "image/png",
        ACL: "public-read",
      });

      await s3Client.send(command);

      const projectId = process.env.MINIO_ENDPOINT?.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
      if (projectId) {
        return `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${filename}`;
      }
      return `${process.env.MINIO_ENDPOINT}/${bucketName}/${filename}`;
    } catch (s3Error) {
      console.warn("S3 上传失败，自动降级为本地存储:", s3Error);
    }
  }

  // 2. 降级方案 A：写入本地 public/uploads 目录
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", bucketName);
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);
    return `/uploads/${bucketName}/${filename}`;
  } catch (fsError) {
    console.warn("本地磁盘写入失败，自动降级为 Base64 Data URL 存储:", fsError);
  }

  // 3. 降级方案 B：直接返回 Base64 Data URI，保证 100% 可用与持久化
  const mimeType = file.type || "image/png";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}