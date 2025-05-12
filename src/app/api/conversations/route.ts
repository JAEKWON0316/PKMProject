import { NextResponse } from 'next/server'
import { parseChatGPTLink } from '@/lib/utils/chatgpt'
import { summarizeConversation, summarizeLongConversation } from '@/lib/utils/openai'
import * as fs from 'fs/promises'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { checkUrlExists } from '@/utils/supabaseHandler'

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
    
    // URL 중복 체크 (Supabase)
    console.log('Checking for URL duplicates...');
    const { exists: urlExists, session: existingSession } = await checkUrlExists(url);
    
    if (urlExists) {
      console.log(`Duplicate URL detected: ${url}`);
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: '이미 저장된 대화입니다.',
        data: {
          id: existingSession?.id,
          title: existingSession?.title,
          url,
          createdAt: existingSession?.created_at
        }
      });
    }
    
    // 로컬 conversations 폴더에서도 URL 중복 체크
    const conversationsDir = path.join(process.cwd(), 'conversations');
    try {
      // 폴더가 존재하는지 확인
      await fs.access(conversationsDir);
      
      // 모든 JSON 파일 읽기
      const files = await fs.readdir(conversationsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      // 각 파일에서 URL 확인
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(conversationsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          if (data.url === url) {
            console.log(`Duplicate URL found in local file: ${file}`);
            return NextResponse.json({
              success: true,
              duplicate: true,
              message: '이미 저장된 대화입니다.',
              data: {
                id: data.id,
                title: data.title,
                url,
                createdAt: data.createdAt
              }
            });
          }
        } catch (e) {
          // 파일 읽기 오류는 무시하고 계속 진행
          console.error(`Error checking file ${file}:`, e);
        }
      }
    } catch (e) {
      // 폴더가 없거나 접근할 수 없으면 중복 체크를 건너뛰고 계속 진행
      console.log('No conversations directory yet, skipping local duplicate check');
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
      
      // OpenAI API를 사용하여 대화 내용 요약 생성
      console.log('Generating conversation summary...');
      console.log(`처리할 대화 메시지 수: ${conversation.messages.length}`);
      
      // 대화 요약 생성 (메시지가 20개 초과하면 긴 대화 요약 함수 사용)
      const summaryResult = conversation.messages.length > 20
        ? await summarizeLongConversation(
            conversation.title,
            conversation.messages
          )
        : await summarizeConversation(
            conversation.title,
            conversation.messages
          );
      
      console.log(`생성된 요약 (${summaryResult.summary.length} 자) - 키워드: ${summaryResult.keywords.length}개`);
      console.log('키워드:', summaryResult.keywords.join(', '));
      
      // 태그 목록 준비 (요약에서 추출한 키워드 + ChatGPT 모델)
      const tags = [
        ...(summaryResult.keywords || []),
        conversation.metadata?.model || 'ChatGPT'
      ].filter(Boolean); // 빈 값 제거
      
      // YAML 프론트매터 생성
      const frontmatter = `---
title: ${conversation.title}
date: ${new Date().toISOString()}
source: ${url}
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
model: ${summaryResult.modelUsed || conversation.metadata?.model || 'ChatGPT'}
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
      
      // 요약 섹션 추가
      markdownContent += `\n\n---\n\n## 💡 요약\n\n${summaryResult.summary}\n`;
      
      // 키워드 섹션 추가
      if (summaryResult.keywords && summaryResult.keywords.length > 0) {
        markdownContent += `\n## 🔑 키워드\n\n${summaryResult.keywords.map(k => `\`${k}\``).join(' ')}\n`;
      }
      
      // 옵시디언에 마크다운 파일 저장
      const obsidianFilePath = path.join(obsidianFolder, fileName);
      await fs.writeFile(obsidianFilePath, markdownContent, 'utf-8');
      console.log(`Saved markdown content to: ${obsidianFilePath}`);
      
      // 원본 텍스트 내용 저장 (HTML 대신)
      const textFileName = fileName.replace('.md', '-original.txt');
      const textFilePath = path.join(obsidianFolder, textFileName);
      await fs.writeFile(textFilePath, rawText, 'utf-8');
      console.log(`Saved original text content to: ${textFilePath}`);
      
      // 대화 데이터 생성
      const conversationData = {
        id,
        title: conversation.title,
        content: conversation.messages,
        metadata: {
          date: new Date().toISOString(),
          model: summaryResult.modelUsed || conversation.metadata?.model || 'gpt-4',
          tags: summaryResult.keywords || []
        },
        createdAt: new Date().toISOString(),
        url,
        summary: summaryResult.summary
      };
      
      // 마지막으로 한번 더 중복 URL 체크 (위에서 진행했지만 다른 프로세스에서 같은 URL이 저장될 수도 있음)
      let isDuplicate = false;
      try {
        const files = await fs.readdir(conversationsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(conversationsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            if (data.url === url) {
              console.log(`Skipping JSON save - duplicate URL found in local file: ${file}`);
              isDuplicate = true;
              break;
            }
          } catch (e) {
            // 파일 읽기 오류는 무시
          }
        }
      } catch (e) {
        // 폴더 접근 오류는 무시
      }
      
      // 중복이 아닌 경우에만 JSON 파일 저장
      let jsonFilePath = '';
      if (!isDuplicate) {
        // 파일명 생성 - 대화 제목과 ID를 포함하여 식별 가능하게 함
        const sanitizedTitle = conversation.title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 100);
        
        jsonFilePath = path.join(conversationsDir, `${sanitizedTitle}-${id}.json`);
        await fs.writeFile(jsonFilePath, JSON.stringify(conversationData, null, 2), 'utf-8');
        console.log(`Saved conversation data to: ${jsonFilePath}`);
      } else {
        console.log('Skipped saving JSON file due to duplicate URL');
      }
      
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
          jsonBackup: jsonFilePath || 'skipped (duplicate URL)',
          summary: summaryResult.summary,
          keywords: summaryResult.keywords
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