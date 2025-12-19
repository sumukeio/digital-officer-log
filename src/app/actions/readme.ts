"use server";

import { readFile } from "fs/promises";
import { join } from "path";

/**
 * 读取 README.md 文件内容
 * @returns README.md 的文本内容，如果读取失败则返回空字符串
 */
export async function getReadmeContent(): Promise<string> {
  try {
    // 获取项目根目录的 README.md 文件
    // process.cwd() 返回 Next.js 项目的根目录
    const filePath = join(process.cwd(), "README.md");
    const content = await readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Failed to read README.md:", error);
    // 返回空字符串，前端会显示默认提示
    return "";
  }
}



