import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// 延迟初始化 S3 客户端 (Supabase Storage 兼容 S3 协议)
function getS3Client() {
  return new S3Client({
    region: "us-east-1", // Supabase 这里的 region 不关键，填 us-east-1 即可
    endpoint: process.env.MINIO_ENDPOINT || "https://dummy.supabase.co/storage/v1/s3",
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || "dummy",
      secretAccessKey: process.env.MINIO_SECRET_KEY || "dummy",
    },
    forcePathStyle: true, // 必须开启
  });
}

/**
 * 上传文件到 Supabase Storage
 * @param file 文件对象
 * @param bucketName 目标 Bucket 名称 (system / issues / daily-reports)
 * @returns 图片的完整访问 URL
 */
export async function uploadToMinIO(file: File, bucketName: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 生成唯一文件名: timestamp-random-filename
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  // 处理中文文件名，防止乱码，只保留扩展名或转为安全字符
  const ext = file.name.split('.').pop();
  const filename = `${uniqueSuffix}.${ext}`;

  // 执行上传
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: buffer,
    ContentType: file.type,
    // Supabase 需要这个来由 public 访问
    ACL: "public-read", 
  });

  const s3Client = getS3Client();
  await s3Client.send(command);

  // 拼接公开访问链接
  // 格式: Endpoint / Bucket / Filename
  // 注意：process.env.MINIO_ENDPOINT 通常是 .../s3，但公开链接不需要 /s3 后缀
  // Supabase 的公开链接格式通常是: https://[ProjectID].supabase.co/storage/v1/object/public/[Bucket]/[Filename]
  
  // 这里的逻辑稍微需要适配一下 Supabase 的 URL 规则
  // 我们手动构造最稳妥的 Supabase 公开链接
  const projectId = process.env.MINIO_ENDPOINT?.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
  
  if (!projectId) {
     // 如果解析不到 ProjectID，尝试回退到普通的 S3 链接逻辑 (适用于自建 MinIO)
     return `${process.env.MINIO_ENDPOINT}/${bucketName}/${filename}`;
  }

  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${filename}`;
}