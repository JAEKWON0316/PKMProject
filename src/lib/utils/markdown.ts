import { ChatMessage } from '@/types'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface MarkdownContent {
  frontmatter: {
    title: string
    date: string
    tags: string[]
    source: string
    model?: string
    url?: string
  }
  content: string
}

/**
 * 채팅 메시지를 Obsidian용 마크다운으로 변환
 */
export function convertToMarkdown(
  title: string,
  messages: ChatMessage[],
  metadata: {
    date: string
    model: string
    tags: string[]
  },
  source: string
): MarkdownContent {
  // 프론트매터 생성 (옵시디언 호환)
  const frontmatter = {
    title,
    date: metadata.date,
    tags: [...metadata.tags, 'chatgpt', 'conversation'],
    source,
    model: metadata.model
  }

  // 마크다운 컨텐츠 생성 (대화 형식 개선)
  const content = messages.map((message) => {
    const role = message.role === 'user' ? '👤 User' : '🤖 Assistant'
    return `### ${role}\n\n${message.content}\n\n---\n\n`
  }).join('')

  // YAML 프론트매터 형식으로 변환
  const yamlFrontmatter = `---\n${Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return `${key}: []`;
        return `${key}:\n${value.map(tag => `  - ${tag}`).join('\n')}`;
      }
      return `${key}: ${value}`;
    })
    .join('\n')}\n---\n\n`;

  return {
    frontmatter,
    content: `${yamlFrontmatter}${content}`
  }
}

/**
 * 마크다운 컨텐츠를 Obsidian Vault에 저장
 */
export async function saveToObsidianVault(
  markdownContent: MarkdownContent,
  vaultPath: string,
  subPath: string = ''
): Promise<string> {
  // 경로가 유효한지 확인
  try {
    const stats = await fs.stat(vaultPath);
    if (!stats.isDirectory()) {
      throw new Error(`${vaultPath} is not a directory`);
    }
  } catch (error) {
    console.error(`Error accessing vault directory: ${error}`);
    throw new Error(`Could not access Obsidian vault at ${vaultPath}`);
  }

  // 하위 경로가 있는 경우 생성
  let finalPath = vaultPath;
  if (subPath) {
    finalPath = path.join(vaultPath, subPath);
    try {
      await fs.mkdir(finalPath, { recursive: true });
    } catch (error) {
      console.error(`Error creating subdirectory: ${error}`);
      throw new Error(`Could not create directory at ${finalPath}`);
    }
  }

  // 파일명 생성 (제목을 파일명으로 변환)
  let fileName = markdownContent.frontmatter.title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    + '.md';

  // 파일명이 너무 길면 자르기
  if (fileName.length > 100) {
    fileName = fileName.substring(0, 100) + '.md';
  }

  // 파일명 충돌 방지 - 같은 이름의 파일이 있으면 번호 추가
  let filePath = path.resolve(finalPath, fileName);
  let counter = 1;
  
  try {
    while (await fileExists(filePath)) {
      const fileNameWithoutExt = fileName.replace(/\.md$/, '');
      const newFileName = `${fileNameWithoutExt}-${counter}.md`;
      filePath = path.resolve(finalPath, newFileName);
      counter++;
    }
  } catch (error) {
    console.warn(`Error checking file existence: ${error}`);
    // 파일 존재 여부 체크에 실패해도 계속 진행 (오버라이드 가능성 있음)
  }

  console.log(`Saving to: ${filePath}`);

  // 파일 저장
  try {
    await fs.writeFile(filePath, markdownContent.content, 'utf-8');
    console.log(`File saved successfully at: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Error saving file: ${error}`);
    throw new Error(`Failed to save markdown file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 파일이 존재하는지 확인하는 유틸리티 함수
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
} 