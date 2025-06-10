// 서버 전용 컴포넌트/유틸 표시
'use server';

// Playwright 관련 import 주석 처리
// import { chromium, Browser, Page } from 'playwright';
import { Conversation, ChatMessage, ChatSource } from '@/types';
import path from 'path';
import fs from 'fs';

// Puppeteer와 Chromium 추가 - 서버 사이드에서만 실행
// @ts-ignore - @sparticuz/chromium 모듈 타입 선언 문제 해결
const puppeteer = require('puppeteer-core');
// @ts-ignore - 타입 오류 무시
const chromium = require('@sparticuz/chromium');

// 클라이언트 측에서는 실행되지 않도록 함
if (typeof window !== 'undefined') {
  throw new Error('This module is server-side only');
}

// 운영체제 감지
const isWindows = process.platform === 'win32';
const isVercel = process.env.VERCEL === '1';

// 타임아웃 상수 - 더 길게 설정
const BROWSER_LAUNCH_TIMEOUT = 120000; // 2분
const PAGE_NAVIGATION_TIMEOUT = 90000; // 1분 30초
const PAGE_DEFAULT_TIMEOUT = 60000;    // 1분
const CONTENT_RENDER_WAIT_TIME = 8000; // 8초

/**
 * 환경에 맞는 Chromium 실행 경로 가져오기
 */
async function getChromiumPath() {
  try {
    // Windows 환경인 경우 로컬에서 Chrome 실행 시도
    if (isWindows) {
      // Windows 환경에서는 설치된 Chrome 사용 시도
      const localChromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      ];
      
      // 존재하는 Chrome 경로 찾기
      for (const chromePath of localChromePaths) {
        if (fs.existsSync(chromePath)) {
          return chromePath;
        }
      }
      
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }
    
    // @sparticuz/chromium의 executablePath 함수를 사용하여 바이너리 경로 가져오기
    const execPath = await chromium.executablePath();
    
    // Windows에서 로컬 폴더 생성
    if (isWindows) {
      const localChromiumPath = path.join(process.cwd(), '.chromium');
      if (!fs.existsSync(localChromiumPath)) {
        fs.mkdirSync(localChromiumPath, { recursive: true });
      }
    }
    
    // 파일이 실제로 존재하는지 확인
    if (!fs.existsSync(execPath)) {
      throw new Error(`Chromium executable not found at path: ${execPath}`);
    }
    
    return execPath;
  } catch (error) {
    // 오류 발생 시 로컬 Chrome 시도
    if (isWindows) {
      const defaultChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      if (fs.existsSync(defaultChromePath)) {
        return defaultChromePath;
      }
    }
    
    throw error;
  }
}

/**
 * 주어진 ChatGPT 대화 URL에서 대화 내용과 전체 페이지 내용을 스크래핑하는 함수
 */
export async function parseChatGPTLink(url: string): Promise<{ 
  conversation: Conversation; 
  rawHtml: string; 
  rawText: string;
}> {
  let browser: any = null;
  let retryCount = 0;
  const maxRetries = 3;
  
  try {
    // puppeteer-core + @sparticuz/chromium 사용하여 브라우저 시작
    // 환경에 맞는 Chromium 경로 가져오기
    const executablePath = await getChromiumPath();

    // 브라우저 실행 옵션 강화
    const options = {
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--mute-audio',
        '--no-zygote',
        '--no-first-run',
        '--window-size=1280,800',
        '--hide-scrollbars'
      ],
      defaultViewport: {
        width: 1280,
        height: 800
      },
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
      timeout: BROWSER_LAUNCH_TIMEOUT // 브라우저 시작 타임아웃 증가
    };

    // 브라우저 시작 재시도 로직
    while (retryCount < maxRetries) {
      try {
        // 브라우저 실행
        browser = await puppeteer.launch(options);
        break; // 성공하면 루프 종료
      } catch (launchError) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to launch browser after ${maxRetries} attempts: ${launchError}`);
        }
        
        // 재시도 전 잠시 대기
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
      }
    }

    // 페이지 생성 전에 브라우저가 완전히 초기화되도록 함
    await new Promise(resolve => setTimeout(resolve, 1500));
      
    // 페이지 생성
    const page = await browser.newPage();
    
    // 페이지 설정
    await page.setDefaultNavigationTimeout(PAGE_NAVIGATION_TIMEOUT); // 90초
    await page.setDefaultTimeout(PAGE_DEFAULT_TIMEOUT); // 60초
    
    // 사용자 에이전트 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
    // 페이지 로드 전에 약간 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 페이지 로드 재시도 로직
    let pageLoadSuccess = false;
    retryCount = 0;
    
    while (!pageLoadSuccess && retryCount < maxRetries) {
      try {
        // 페이지 로드
        const response = await page.goto(url, { 
          waitUntil: ['load', 'domcontentloaded', 'networkidle0'], 
          timeout: PAGE_NAVIGATION_TIMEOUT
        });
        
        if (!response || !response.ok()) {
          throw new Error(`Failed to load page: ${response ? response.status() : 'No response'}`);
        }
        
        pageLoadSuccess = true;
      } catch (navigationError) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to load page after ${maxRetries} attempts: ${navigationError}`);
        }
        
        // 재시도 전 잠시 대기 
        await new Promise(resolve => setTimeout(resolve, retryCount * 3000));
      }
    }
    
    // 페이지가 완전히 렌더링될 때까지 대기
    await page.waitForTimeout(CONTENT_RENDER_WAIT_TIME);
    
    // 페이지 안정화를 위한 추가 대기
    try {
      await page.waitForFunction(
        'document.querySelector("body") && !document.querySelector("body").classList.contains("loading")', 
        { timeout: 10000 }
      );
    } catch (waitError) {
      // 타임아웃 발생해도 계속 진행
    }
    
    // 전체 페이지 HTML 가져오기
    const rawHtml = await page.content();
    
    // 페이지 텍스트 콘텐츠 가져오기
    const rawText = await page.evaluate(() => document.body.innerText);
    
    // 대화 내용 추출 (메시지 구조화)
    const conversationData = await extractConversationData(page);

    // 대화 객체 생성
    const conversation: Conversation = {
      id: extractConversationId(url),
      title: conversationData.title,
      messages: conversationData.messages as ChatMessage[],
      createdAt: new Date().toISOString(),
      source: ChatSource.CHATGPT,
      metadata: conversationData.metadata
    };

    // 빈 대화인지 확인
    if (conversation.messages.length === 0) {
      throw new Error('대화 내용을 추출할 수 없습니다.');
    }
    
    // 모든 작업이 완료된 후 브라우저 종료
    await browser.close();
    
    return {
      conversation,
      rawHtml,
      rawText
    };
  } catch (error) {
    throw error instanceof Error 
      ? error 
      : new Error(`대화 추출 중 오류 발생: ${String(error)}`);
  }
}

/**
 * URL에서 대화 ID를 추출하는 헬퍼 함수
 */
function extractConversationId(url: string): string {
  const urlSegments = url.split('/');
  const potentialId = urlSegments.pop() || '';
  
  // ID가 유효한지 확인 (공유 URL의 ID 형식은 다를 수 있음)
  if (potentialId && potentialId.length > 5) {
    return potentialId;
  }
  
  // 대체 ID 생성
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Playwright Page 타입을 any로 변경
// async function extractConversationData(page: Page): Promise<{
async function extractConversationData(page: any): Promise<{
  title: string; 
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>; 
  metadata: { 
    date: string; 
    model: string; 
    tags: string[]; 
  }; 
}> {
  return await page.evaluate(() => {
    // 제목 추출 (여러 방법 시도)
    let title = '';
    
    // 1. h1 태그에서 제목 찾기
    const h1Element = document.querySelector('h1');
    if (h1Element && h1Element.textContent) {
      title = h1Element.textContent.trim();
    }
    
    // 2. 페이지 타이틀에서 제목 찾기
    if (!title) {
      const titleElement = document.querySelector('title');
      if (titleElement && titleElement.textContent) {
        title = titleElement.textContent
          .replace(' - ChatGPT', '')
          .replace(' - OpenAI', '')
          .trim();
      }
    }
    
    // 3. 메타 데이터에서 제목 찾기
    if (!title) {
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTitle) {
        const content = metaTitle.getAttribute('content');
        if (content) {
          title = content.trim();
        }
      }
    }
    
    // 제목을 찾지 못한 경우 기본값 사용
    if (!title) {
      title = 'ChatGPT Conversation ' + new Date().toLocaleString();
    }
    
    // 페이지 전체에서 모든 대화 요소 직접 추출 시도
    // 1. assistant 메시지 찾기 (여러 선택자 시도)
    let assistantElements = document.querySelectorAll('[data-message-author-role="assistant"]');
    
    // 보조 선택자 시도
    if (assistantElements.length === 0) {
      const potentialSelectors = [
        '.markdown.prose', // 일반적인 ChatGPT 응답 스타일
        '.chat-message[data-role="assistant"]',
        '.chat-message-assistant',
        '.assistant-message',
        '[data-role="assistant"]',
        'div[role="region"] > div > div:nth-child(even)', // 짝수 번째 메시지가 assistant인 경우
      ];
      
      for (const selector of potentialSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          assistantElements = elements;
          break;
        }
      }
    }
    
    // 2. user 메시지 찾기 (여러 방법 시도)
    // 명시적인 user 역할 속성 찾기
    let userElements = Array.from(document.querySelectorAll('[data-message-author-role="user"]'));
    
    // 대안 선택자 시도
    if (userElements.length === 0) {
      const potentialUserSelectors = [
        '.chat-message[data-role="user"]',
        '.chat-message-user',
        '.user-message',
        '[data-role="user"]',
        'div[role="region"] > div > div:nth-child(odd)', // 홀수 번째 메시지가 user인 경우
      ];
      
      for (const selector of potentialUserSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          userElements = Array.from(elements);
          break;
        }
      }
    }
    
    // 대화 수집
    let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    if (assistantElements.length > 0 && userElements.length > 0) {
      // HTML 구조에서 모든 대화 요소 수집 및 순서 결정
      const conversationElements: Array<{
        element: Element;
        role: 'user' | 'assistant';
        position: number;
      }> = [];
      
      // 어시스턴트 메시지 추가
      Array.from(assistantElements).forEach(el => {
        conversationElements.push({
          element: el,
          role: 'assistant',
          position: getPositionInDocument(el)
        });
      });
      
      // 사용자 메시지 추가
      userElements.forEach(el => {
        conversationElements.push({
          element: el,
          role: 'user',
          position: getPositionInDocument(el)
        });
      });
      
      // DOM 순서대로 정렬
      conversationElements.sort((a, b) => a.position - b.position);
      
      // 정렬된 요소에서 대화 내용 추출
      const extractedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      
      for (const item of conversationElements) {
        const content = item.element.textContent?.trim() || '';
        if (content && content.length > 0) {
          // 일부 UI 요소 제외
          if (!content.includes('Skip to content') && 
              !content.includes('Log in') && 
              !content.includes('Sign up')) {
            
            extractedMessages.push({
              role: item.role,
              content
            });
          }
        }
      }
      
      // 최소한 하나의 사용자와 어시스턴트 메시지가 있는지 확인
      const hasUser = extractedMessages.some(m => m.role === 'user');
      const hasAssistant = extractedMessages.some(m => m.role === 'assistant');
      
      if (hasUser && hasAssistant && extractedMessages.length >= 2) {
        messages = extractedMessages;
      }
    }
    
    // 페이지에서 요소의 위치를 결정하는 함수
    function getPositionInDocument(element: Element): number {
      // 요소의 부모들을 모두 찾아서 깊이 계산
      let depth = 0;
      let parent = element.parentElement;
      while (parent) {
        depth++;
        parent = parent.parentElement;
      }
      
      // DOM에서의 순서를 계산 (형제 요소 중 위치)
      let siblingPosition = 0;
      let sibling = element.previousElementSibling;
      while (sibling) {
        siblingPosition++;
        sibling = sibling.previousElementSibling;
      }
      
      // 요소의 대략적인 Y 위치를 반환 (if available)
      const rect = element.getBoundingClientRect();
      const yPosition = rect ? rect.top : 0;
      
      // 깊이, 형제 위치, Y위치를 조합하여 최종 위치 반환
      return yPosition + (siblingPosition * 10000) + (depth * 1000000);
    }
    
    // 메시지가 없으면 기본 오류 메시지 추가
    if (messages.length === 0) {
      // 최후의 방법: 페이지에서 이전/다음 메시지 패턴 찾기
      try {
        // 일반적인 사용자 입력 패턴 (최소 3개 이상의 단어를 가진 문단)
        const potentialUserMessages = Array.from(document.querySelectorAll('p, div, span'))
          .map(el => el.textContent?.trim() || '')
          .filter(text => text && text.split(' ').length >= 3 && text.length > 20)
          .filter(text => !text.includes('ChatGPT') && !text.includes('Log in') && !text.includes('Sign up'));
          
        if (potentialUserMessages.length > 0) {
          // 첫 번째 메시지를 사용자 메시지로 추가
          const userMessage = potentialUserMessages[0];
          messages.push({
            role: 'user',
            content: userMessage
          });
          
          // 나머지 텍스트를 어시스턴트 응답으로 추가
          const remainingText = document.body.innerText
            .replace(title, '')
            .replace(userMessage, '')
            .replace(/Log in|Sign up|Attach|Search|Reason|Voice|By messaging ChatGPT|Skip to content|ChatGPT/g, '')
            .replace(/window\.__oai_.*?;/g, '')
          .trim();
        
          if (remainingText.length > 0) {
            messages.push({
              role: 'assistant',
              content: remainingText
            });
          }
        } else {
          messages.push({ 
            role: 'assistant',
            content: '대화 내용을 추출할 수 없습니다. ChatGPT 공유 링크가 유효한지 확인해주세요.' 
          });
        }
      } catch (error) {
        messages.push({ 
          role: 'assistant', 
          content: '대화 내용을 추출할 수 없습니다. ChatGPT 공유 링크가 유효한지 확인해주세요.' 
        });
      }
    }
    
    // 대화형 구조 확인 - 먼저 유저 메시지로 시작하는지 확인
    if (messages.length > 0 && messages[0].role !== 'user') {
      // ChatGPT 대화는 항상 사용자 질문으로 시작해야 함
      // 대화가 어시스턴트로 시작하면 첫 메시지를 사용자 메시지로 변경
      // 새 대화 구조 생성
      const alternatingMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
      
      // 첫 번째 메시지가 assistant인 경우, 가짜 user 메시지를 추가하고 시작
      alternatingMessages.push({
        role: 'user',
        content: '대화를 시작합니다.'
      });
      
      // 기존 메시지 복사
      messages.forEach(msg => {
        alternatingMessages.push(msg);
      });
      
      // 수정된 메시지로 교체
      messages = alternatingMessages;
    }
    
    // 올바른 대화 구조 확인 (user와 assistant가 번갈아 나타나야 함)
    const correctedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    let expectedRole: 'user' | 'assistant' = 'user'; // 대화는 user로 시작해야 함
    
    messages.forEach((msg, index) => {
      if (index === 0 && msg.role !== 'user') {
        // 첫 메시지는 항상 사용자여야 함
        correctedMessages.push({
          role: 'user',
          content: '대화를 시작합니다.'
        });
        expectedRole = 'assistant';
      }
      
      if (msg.role === expectedRole) {
        // 역할이 예상대로인 경우 그대로 추가
        correctedMessages.push(msg);
        // 다음 예상 역할 전환
        expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
      } else {
        // 같은 역할이 연속으로 나타나는 경우, 빈 메시지를 중간에 삽입
        if (expectedRole === 'user') {
          correctedMessages.push({
            role: 'user',
            content: '(계속)'
          });
        } else {
          correctedMessages.push({
            role: 'assistant',
            content: '(계속)'
          });
        }
        // 현재 메시지 추가
        correctedMessages.push(msg);
        // 다음 예상 역할 설정
        expectedRole = msg.role === 'user' ? 'assistant' : 'user';
      }
    });
    
    // 수정된 메시지로 교체
    messages = correctedMessages;
      
      // GPT-4 모델인지 확인
      const isGPT4 = document.body.innerText.includes('GPT-4') || 
                    document.body.innerText.includes('gpt-4') ||
                    document.querySelector('img[alt*="GPT-4"]') !== null;
      
      return {
        title,
        messages,
        metadata: {
          date: new Date().toISOString(),
          model: isGPT4 ? 'gpt-4' : 'gpt-3.5-turbo',
          tags: []
        }
      };
  }) as { 
    title: string; 
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>; 
    metadata: { 
      date: string; 
      model: string; 
      tags: string[]; 
    }; 
  };
}