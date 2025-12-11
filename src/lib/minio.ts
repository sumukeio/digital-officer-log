import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// 初始化 S3 客户端 (MinIO 兼容 S3 协议)
export const s3Client = new S3Client({
  region: "us-east-1", // MinIO 必须要填一个，虽不起作用
  endpoint: process.env.MINIO_ENDPOINT,
  forcePathStyle: true, // 必须开启，否则会变成 bucket.ip 形式
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "daily-reports";

// 上传函数
export async function uploadToMinIO(file: File, folder: string = "uploads") {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // 生成唯一文件名: 20251210-uuid.jpg
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const ext = file.name.split('.').pop();
  const filename = `${folder}/${uniqueSuffix}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: file.type,
  });

  try {
    await s3Client.send(command);
    // 返回可访问的 URL
    return `${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${filename}`;
  } catch (error) {
    console.error("MinIO Upload Error:", error);
    throw new Error("图片上传失败");
  }
}