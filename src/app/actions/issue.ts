"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { uploadToMinIO } from "@/lib/minio";
import { revalidatePath } from "next/cache";

export async function getIssues() {
  return await prisma.issue.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createIssue(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const problemDesc = formData.get("problemDesc") as string;
  const solutionDesc = formData.get("solutionDesc") as string;

  // 处理图片上传辅助函数
  const processImages = async (keyPrefix: string) => {
    const urls: string[] = [];
    // 假设前端传的是 problemImages_0, problemImages_1... 或者是多文件
    // 这里简化：假设前端用 getAll 获取同名文件 input
    const files = formData.getAll(keyPrefix); 
    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        const url = await uploadToMinIO(file, "issues");
        urls.push(url);
      }
    }
    return JSON.stringify(urls);
  };

  const problemImages = await processImages("problem_images");
  const solutionImages = await processImages("solution_images");

  await prisma.issue.create({
    data: {
      title,
      problemDesc,
      problemImages,
      solutionDesc,
      solutionImages,
      userId: user.id
    }
  });

  revalidatePath("/knowledge");
}