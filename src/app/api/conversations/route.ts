import { NextResponse } from 'next/server'
import { parseChatGPTLink } from '@/lib/utils/chatgpt'
import * as fs from 'fs/promises'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request): Promise<Response> {
  try {
    console.log('=== Processing conversation request ===');
    
    const body = await request.json().catch(e => {
      console.error('Failed to parse request body:', e);
      return null;
    });
    
    if (!body || !body.url) {
      console.error('Missing URL in request body');
      return NextResponse.json(
        { success: false, error: 'ChatGPT 공유 URL이 필요합니다.' },
        { status: 400 }
      );
    }
    
    const { url } = body;
    console.log(`Processing URL: "${url}"`);

    // URL 유효성 검사
    if (!isValidChatGPTUrl(url)) {
      console.error('Invalid URL format or domain');
      return NextResponse.json(
        { success: false, error: '유효한 ChatGPT 공유 URL이 아닙니다.' },
        { status: 400 }
      );
    }

    // ChatGPT 링크 파싱 (Playwright 기반)
    console.log('=== Starting Playwright parsing ===');
    let result;
    try {
      result = await parseChatGPTLink(url);
      console.log(`Parsed conversation: "${result.conversation.title}" with ${result.conversation.messages.length} messages`);
      console.log(`Raw HTML length: ${result.rawHtml.length} characters`);
    } catch (error) {
      console.error('Error parsing conversation:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : '대화 내용을 추출할 수 없습니다.' 
        },
        { status: 422 }
      );
    }

    const { conversation, rawText } = result;

    // 메시지 유효성 검사
    if (!conversation.messages || conversation.messages.length === 0) {
      console.error('No messages found in conversation');
      return NextResponse.json(
        { success: false, error: '대화 내용을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 각 메시지 내용 간략히 로깅
    conversation.messages.forEach((msg, idx) => {
      console.log(`Message #${idx+1} (${msg.role}): ${msg.content.substring(0, 30)}... (${msg.content.length} chars)`);
    });

    // Obsidian Vault 경로 확인
    const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
    console.log(`Using Obsidian vault path: ${vaultPath}`);
    
    if (!vaultPath) {
      console.error('Obsidian Vault path is not configured');
      return NextResponse.json(
        { success: false, error: 'Obsidian Vault 경로가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    try {
      // 고유 ID 생성
      const id = conversation.id || `${Date.now()}-${uuidv4().substring(0, 8)}`;
      
      // 파일명 생성 (제목을 파일명으로 변환)
      const fileName = conversation.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100) // 길이 제한
        + '.md';
      
      // 옵시디언 ChatGPT 폴더 경로
      const obsidianFolder = path.join(vaultPath, 'ChatGPT');
      
      // 폴더 생성 (없는 경우)
      await fs.mkdir(obsidianFolder, { recursive: true });
      
      // YAML 프론트매터 생성
      const frontmatter = `---
title: ${conversation.title}
date: ${new Date().toLocaleString('ko-KR')}
source: ${url}
tags: ${conversation.metadata?.model || 'ChatGPT'}
---

`;
      
      // 대화 내용을 마크다운으로 변환
      let markdownContent = frontmatter;
      
      // 대화 내용 추가
      markdownContent += `# ${conversation.title}\n\n`;
      
      // URL과 날짜 정보 추가
      markdownContent += `> [원본 URL](${url})\n\n`;
      markdownContent += `> 저장 시간: ${new Date().toLocaleString('ko-KR')}\n\n`;
      
      if (conversation.metadata?.model) {
        markdownContent += `> 태그: ${conversation.metadata.model}\n\n`;
      }
      
      markdownContent += `---\n\n`;
      
      // 사용자-어시스턴트 대화 내용을 마크다운으로 포맷팅 (JSON 스타일로 변경)
      conversation.messages.forEach((message, index) => {
        const isUser = message.role === 'user';
        const messageHeader = isUser ? '## 👤 사용자' : '## 🤖 assistant';
        
        // JSON 형식처럼 역할과 내용을 구분하여 표시
        markdownContent += `${messageHeader}\n\n${message.content}\n\n`;
        
        // 마지막 메시지가 아니면 구분선 추가
        if (index < conversation.messages.length - 1) {
          markdownContent += `---\n\n`;
        }
      });
      
      // 옵시디언에 마크다운 파일 저장
      const obsidianFilePath = path.join(obsidianFolder, fileName);
      await fs.writeFile(obsidianFilePath, markdownContent, 'utf-8');
      console.log(`Saved markdown content to: ${obsidianFilePath}`);
      
      // 원본 텍스트 내용 저장 (HTML 대신)
      const textFileName = fileName.replace('.md', '-original.txt');
      const textFilePath = path.join(obsidianFolder, textFileName);
      await fs.writeFile(textFilePath, rawText, 'utf-8');
      console.log(`Saved original text content to: ${textFilePath}`);
      
      // 로컬 JSON 파일로 저장 (대화 데이터만)
      const conversationsDir = path.join(process.cwd(), 'conversations');
      
      // 폴더 생성 (없는 경우)
      await fs.mkdir(conversationsDir, { recursive: true });
      
      // 대화 데이터 생성 (conversations 폴더에 저장되는 형식)
      const conversationData = {
        id,
        title: conversation.title,
        content: conversation.messages,
        metadata: {
          date: new Date().toISOString(),
          model: conversation.metadata?.model || 'gpt-4',
          tags: []
        },
        createdAt: new Date().toISOString(),
        url
      };
      
      // JSON 파일로 저장
      const jsonFilePath = path.join(conversationsDir, `${id}.json`);
      await fs.writeFile(jsonFilePath, JSON.stringify(conversationData, null, 2), 'utf-8');
      
      console.log(`Saved conversation data to: ${jsonFilePath}`);
      
      // 성공 응답
      return NextResponse.json({
        success: true,
        data: {
          conversation: conversationData,
          obsidian: {
            path: vaultPath,
            fileName,
            filePath: obsidianFilePath,
            textPath: textFilePath,
            contentType: "markdown-formatted"
          },
          jsonBackup: jsonFilePath
        },
      });
    } catch (saveError) {
      console.error('Error saving data:', saveError);
      return NextResponse.json(
        { 
          success: false, 
          error: saveError instanceof Error 
            ? saveError.message 
            : '데이터 저장 중 오류가 발생했습니다.' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '대화 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

/**
 * ChatGPT URL 유효성 검사
 */
function isValidChatGPTUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // 도메인 체크
    const validDomains = ['chat.openai.com', 'chatgpt.com'];
    if (!validDomains.some(domain => parsed.hostname.includes(domain))) {
      return false;
    }
    
    // 경로 체크
    return parsed.pathname.includes('/share/') || parsed.pathname.includes('/c/');
  } catch (error) {
    return false;
  }
}