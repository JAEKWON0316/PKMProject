// 전역 MCP 타입 선언 추가
declare global {
  interface Window {
    mcp: Record<string, any> | undefined;
  }
  var mcp: Record<string, any> | undefined;
}

import { ChatMessage } from '@/types';
import { SummaryResult } from '@/lib/utils/openai';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { checkUrlExists } from './supabaseHandler';

// fs 함수를 Promise 기반으로 변환
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);
const existsAsync = promisify(fs.exists);

// 기본 저장 경로 설정 (Obsidian Vault 경로)
const DEFAULT_VAULT_PATH = "C:/Users/user/Documents/Obsidian Vault";
const CHATGPT_FOLDER = 'ChatGPT';

/**
 * MCP가 사용 가능한지 확인합니다.
 */
function isMcpAvailable(mcpFunction: string): boolean {
  return typeof global.mcp !== 'undefined' && typeof global.mcp[mcpFunction] === 'function';
}

/**
 * 디렉토리가 존재하는지 확인하고 없으면 생성합니다.
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    if (!fs.existsSync(dirPath)) {
      await mkdirAsync(dirPath, { recursive: true });
    }
  } catch (error) {
    console.error(`디렉토리 생성 오류 (${dirPath}):`, error);
    throw error;
  }
}

/**
 * 로컬 파일 시스템에 대화를 저장합니다.
 */
async function saveToFileSystem(
  fileName: string,
  markdownContent: string,
  rawText: string,
  conversation: {
    title: string;
    messages: ChatMessage[];
    metadata?: Record<string, any>;
  },
  summaryResult: SummaryResult,
  url: string,
  skipJsonSave: boolean = false
) {
  try {
    // Obsidian Vault 경로
    const obsidianFolderPath = path.join(DEFAULT_VAULT_PATH, CHATGPT_FOLDER);
    
    // 필요한 폴더 생성
    await ensureDirectoryExists(obsidianFolderPath);
    
    // 마크다운 파일 저장 (Obsidian Vault에)
    const markdownFilePath = path.join(obsidianFolderPath, fileName);
    await writeFileAsync(markdownFilePath, markdownContent, 'utf8');
    console.log(`마크다운 파일 저장 완료: ${markdownFilePath}`);
    
    // 원본 텍스트 저장 (Obsidian Vault에)
    const textFileName = fileName.replace('.md', '-original.txt');
    const textFilePath = path.join(obsidianFolderPath, textFileName);
    await writeFileAsync(textFilePath, rawText, 'utf8');
    console.log(`원본 텍스트 파일 저장 완료: ${textFilePath}`);
    
    return { 
      success: true, 
      files: {
        markdown: markdownFilePath, 
        text: textFilePath
      }
    };
  } catch (error) {
    console.error('파일 시스템 저장 중 오류:', error);
    throw error;
  }
}

/**
 * Obsidian Vault에 마크다운 노트를 생성합니다.
 */
export async function saveToObsidian(
  conversation: {
    title: string;
    messages: ChatMessage[];
    id?: string;
    metadata?: Record<string, any>;
  },
  summaryResult: SummaryResult,
  rawText: string,
  url: string,
  skipDuplicateCheck: boolean = false
) {
  try {
    // URL 중복 체크 (skipDuplicateCheck가 false일 때만)
    if (!skipDuplicateCheck && url) {
      // Supabase에서 중복 체크
      const { exists, session } = await checkUrlExists(url);
      
      if (exists) {
        console.log(`URL이 이미 존재합니다: ${url}`);
        return { 
          success: true, 
          fileName: `${conversation.title.substring(0, 30)}.md (중복)`,
          duplicate: true,
          message: '이미 저장된 대화입니다.'
        };
      }
    }
    
    // 파일명 생성 (제목을 파일명으로 변환)
    const fileName = conversation.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100) + '.md';
    
    // 태그 목록 준비 (요약에서 추출한 키워드 + ChatGPT 모델)
    const tags = [
      ...(summaryResult.keywords || []),
      'gpt-4.1-nano'
    ].filter(Boolean); // 빈 값 제거
    
    // YAML 프론트매터 생성
    const frontmatter = `---
title: ${conversation.title}
date: ${new Date().toISOString()}
source: ${url}
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
model: gpt-4.1-nano
---

`;
    
    // 대화 내용을 마크다운으로 변환
    let markdownContent = frontmatter;
    
    // 대화 내용 추가
    markdownContent += `# ${conversation.title}\n\n`;
    
    // URL과 날짜 정보 추가
    markdownContent += `> [원본 URL](${url})\n\n`;
    markdownContent += `> 저장 시간: ${new Date().toLocaleString('ko-KR')}\n\n`;
    
    if (tags.length > 0) {
      markdownContent += `> 태그: ${tags.join(', ')}\n\n`;
    }
    
    markdownContent += `---\n\n`;
    
    // 사용자-어시스턴트 대화 내용을 마크다운으로 포맷팅
    conversation.messages.forEach((message, index) => {
      const isUser = message.role === 'user';
      const messageHeader = isUser ? '## 👤 사용자' : '## 🤖 assistant';
      
      // 역할과 내용을 구분하여 표시
      markdownContent += `${messageHeader}\n\n${message.content}\n\n`;
      
      // 마지막 메시지가 아니면 구분선 추가
      if (index < conversation.messages.length - 1) {
        markdownContent += `---\n\n`;
      }
    });
    
    // 요약 섹션 추가
    markdownContent += `\n\n---\n\n## 💡 요약\n\n${summaryResult.summary}\n`;
    
    // 키워드 섹션 추가
    if (summaryResult.keywords && summaryResult.keywords.length > 0) {
      markdownContent += `\n## 🔑 키워드\n\n${summaryResult.keywords.map(k => `\`${k}\``).join(' ')}\n`;
    }
    
    // MCP 사용이 가능한지 확인
    if (isMcpAvailable('obsidian-mcp_create-note')) {
      try {
        // Obsidian MCP로 파일 저장
        await new Promise((resolve, reject) => {
          try {
            // @ts-ignore - MCP 타입 정의 없음
            global.mcp['obsidian-mcp_create-note']({
              vault: 'obsidian-vault', // 옵시디언 Vault 이름
              folder: 'ChatGPT',        // 저장 폴더 경로
              filename: fileName,
              content: markdownContent
            }, (result: any) => {
              if (result.error) {
                reject(new Error(`Obsidian 저장 실패: ${result.error}`));
              } else {
                resolve(result);
              }
            });
          } catch (error) {
            reject(error);
          }
        });
        
        // 원본 텍스트 내용 저장
        const textFileName = fileName.replace('.md', '-original.txt');
        await new Promise((resolve, reject) => {
          try {
            // @ts-ignore - MCP 타입 정의 없음
            global.mcp['obsidian-mcp_create-note']({
              vault: 'obsidian-vault', // 옵시디언 Vault 이름
              folder: 'ChatGPT',        // 저장 폴더 경로
              filename: textFileName,
              content: rawText
            }, (result: any) => {
              if (result.error) {
                reject(new Error(`Obsidian 원본 텍스트 저장 실패: ${result.error}`));
              } else {
                resolve(result);
              }
            });
          } catch (error) {
            reject(error);
          }
        });
        
        return { success: true, fileName, method: 'mcp' };
      } catch (mcpError) {
        console.error('MCP 저장 실패, 파일 시스템으로 대체합니다:', mcpError);
        // MCP 실패 시 아래의 파일 시스템 방식으로 진행
      }
    }
    
    // MCP가 없거나 실패한 경우, 파일 시스템 사용하여 저장
    console.log('MCP를 사용할 수 없습니다. 파일 시스템을 사용하여 저장합니다.');
    
    // 파일 시스템에 저장 (URL 중복 여부 전달)
    const fileSystemResult = await saveToFileSystem(
      fileName,
      markdownContent,
      rawText,
      conversation,
      summaryResult,
      url,
      skipDuplicateCheck // 중복 URL이면 JSON 저장 건너뛰기
    );
    
    return { 
      success: true, 
      fileName, 
      method: 'filesystem',
      files: fileSystemResult.files,
      duplicate: false
    };
  } catch (error) {
    console.error('Obsidian 저장 중 오류:', error);
    // 오류가 발생해도 RAG 시스템 진행에는 영향을 주지 않도록 성공 상태 반환
    return { 
      success: true, 
      fileName: `${conversation.title.substring(0, 30)}.md (저장 실패)`,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * GitHub 저장소에 변경사항을 커밋하고 푸시합니다.
 */
export async function commitToGitHub(message: string = 'Update ChatGPT conversations') {
  try {
    // MCP 사용이 가능한지 확인
    if (isMcpAvailable('mcp_github_push_files')) {
      // GitHub 저장소의 변경사항 확인
      const result = await new Promise((resolve, reject) => {
        try {
          // @ts-ignore - MCP 타입 정의 없음
          global.mcp['mcp_github_push_files']({
            repo: 'PKMProjet',        // GitHub 저장소 이름
            branch: 'main',           // 브랜치 이름
            message,                  // 커밋 메시지
            files: [                  // 푸시할 파일 목록 (Obsidian Vault의 ChatGPT 폴더 내 변경사항)
              {
                path: 'ChatGPT',      // 경로
                recursive: true       // 하위 파일 포함
              }
            ]
          }, (result: any) => {
            if (result.error) {
              reject(new Error(`GitHub 커밋 실패: ${result.error}`));
            } else {
              resolve(result);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
      
      return { success: true, result, method: 'mcp' };
    } else {
      // MCP를 사용할 수 없는 경우 로그만 남기고 성공으로 처리
      console.log('GitHub MCP를 사용할 수 없습니다. 커밋 작업은 건너뜁니다.');
      return { 
        success: true, 
        method: 'skipped', 
        message: 'GitHub 커밋 기능은 MCP 환경에서만 사용 가능합니다.' 
      };
    }
  } catch (error) {
    console.error('GitHub 커밋 중 오류:', error);
    // 오류가 발생해도 RAG 시스템 진행에는 영향을 주지 않도록 성공 상태 반환
    return { 
      success: true, 
      method: 'failed',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
} 