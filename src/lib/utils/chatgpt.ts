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
          console.log(`Using local Chrome at: ${chromePath}`);
          return chromePath;
        }
      }
      
      console.log('No local Chrome installation found, using @sparticuz/chromium fallback');
    }
    
    // @sparticuz/chromium의 executablePath 함수를 사용하여 바이너리 경로 가져오기
    const execPath = await chromium.executablePath();
    console.log(`Chromium executable path: ${execPath}`);
    
    // Windows에서 로컬 폴더 생성
    if (isWindows) {
      const localChromiumPath = path.join(process.cwd(), '.chromium');
      if (!fs.existsSync(localChromiumPath)) {
        console.log(`Creating local Chromium directory: ${localChromiumPath}`);
        fs.mkdirSync(localChromiumPath, { recursive: true });
      }
    }
    
    // 파일이 실제로 존재하는지 확인
    if (!fs.existsSync(execPath)) {
      throw new Error(`Chromium executable not found at path: ${execPath}`);
    }
    
    return execPath;
  } catch (error) {
    console.error('Error getting Chromium path:', error);
    
    // 오류 발생 시 로컬 Chrome 시도
    if (isWindows) {
      const defaultChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      if (fs.existsSync(defaultChromePath)) {
        console.log(`Fallback to local Chrome: ${defaultChromePath}`);
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
  console.log(`Scraping ChatGPT conversation from URL: ${url}`);
  
  // let browser: Browser | null = null;
  let browser: any = null;
  
  try {
    // 브라우저 경로 디버깅 로그
    console.log('=== Browser Path Debug Info ===');
    console.log('CHROMIUM_PATH:', process.env.CHROMIUM_PATH);
    
    // Playwright 코드 주석 처리
    /*
    // 가능한 실행 파일 경로들
    const possiblePaths = [
      `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium_headless_shell-1169/headless_shell`,
      `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium_headless_shell-1169/chrome-linux/headless_shell`,
      `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium-1169/chrome-linux/chrome`,
      `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium-1169/chrome-win/chrome.exe`,
      `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium/chrome-linux/chrome`,
      // Ubuntu 20.04 fallback 경로 추가
      `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium-1169/chrome-linux/chrome`,
      `/tmp/playwright/chromium-1169/chrome-linux/chrome`,
      // Playwright 경로 자동 감지 시도
      process.env.PLAYWRIGHT_BROWSERS_PATH ? undefined : 'chromium'
    ].filter(Boolean);
    
    console.log('Checking possible executable paths:');
    for (const path of possiblePaths) {
      try {
        const fs = require('fs');
        const exists = fs.existsSync(path);
        console.log(`- ${path}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
      } catch (e) {
        console.log(`- ${path}: ERROR checking path`);
      }
    }
    
    // 첫 번째 경로로 시도
    let browserLaunchError = null;
  
    // Chromium 브라우저 시작 (headless 모드)
    try {
      console.log('Trying to launch browser with primary path...');
      browser = await chromium.launch({
        headless: true,  // 백그라운드에서 실행
        args: [
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ],
        timeout: 60000, // 60초 타임아웃
        // 실행 파일 경로는 우선 지정하지 않고 Playwright가 자동 감지하도록 함
        executablePath: undefined
      });
      console.log('Browser launched successfully with primary path');
    } catch (e) {
      console.error('Failed to launch with default path:', e);
      browserLaunchError = e;
      
      // 자동 감지 실패 시 다른 경로 시도
      for (let i = 0; i < possiblePaths.length; i++) {
        try {
          if (!possiblePaths[i]) continue; // undefined 경로 건너뛰기
          
          console.log(`Trying alternate path: ${possiblePaths[i]}`);
          browser = await chromium.launch({
            headless: true,
            args: [
              '--no-sandbox', 
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage'
            ],
            timeout: 60000,
            executablePath: possiblePaths[i]
          });
          console.log(`Browser launched successfully with alternate path: ${possiblePaths[i]}`);
          browserLaunchError = null;
          break;
        } catch (err) {
          console.error(`Failed with alternate path ${possiblePaths[i]}:`, err);
        }
      }
      
      // 모든 경로 실패 시 브라우저 재설치 시도
      if (browserLaunchError) {
        console.log('모든 경로 시도 실패, 브라우저 재설치 시도 중...');
        try {
          // 브라우저 설치 시도
          const { execSync } = require('child_process');
          execSync('npx playwright install chromium', { stdio: 'inherit' });
          console.log('Chromium 재설치 완료, 다시 시도합니다.');
          
          // 설치 후 브라우저 실행 재시도
          browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            timeout: 60000
          });
          console.log('브라우저 시작 성공 (재설치 후)');
          browserLaunchError = null;
        } catch (installError) {
          console.error('브라우저 재설치 실패:', installError);
          throw new Error(`모든 브라우저 실행 경로 시도 실패 및 재설치 실패: ${browserLaunchError instanceof Error ? browserLaunchError.message : String(browserLaunchError)}`);
        }
      }
    }

    // browser가 null인 경우 처리 (모든 실행 경로 시도 후에도 실패한 경우)
    if (!browser) {
      throw new Error('브라우저를 시작할 수 없습니다. 실행 파일 경로를 확인하세요.');
    }
    */

    // puppeteer-core + @sparticuz/chromium 사용하여 브라우저 시작
    console.log('Launching browser with @sparticuz/chromium...');
    
    // 환경에 맞는 Chromium 경로 가져오기
    const executablePath = await getChromiumPath();
    console.log(`Using Chromium at: ${executablePath}`);
    
    // 브라우저 실행 옵션
    const options = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
    
    browser = await puppeteer.launch(options);
    console.log('Browser launched successfully with @sparticuz/chromium');

    // 페이지 생성
    const page = await browser.newPage();
    
    // 사용자 에이전트 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 페이지 로드 시도 (여러 번 시도)
    let maxRetries = 3;
    let loaded = false;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Loading page attempt ${attempt}/${maxRetries}...`);
        // 모든 리소스를 로드하도록 설정
        await page.goto(url, { 
          timeout: 30000, 
          waitUntil: 'networkidle0' // 모든 리소스가 로드될 때까지 대기
        });
        loaded = true;
        break;
      } catch (navigationError) {
        console.error(`Navigation error on attempt ${attempt}:`, navigationError);
        
        // 마지막 시도가 아니면 잠시 대기 후 재시도
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw new Error(`페이지 로드에 실패했습니다: ${navigationError instanceof Error ? navigationError.message : String(navigationError)}`);
        }
      }
    }

    if (!loaded) {
      throw new Error('페이지 로드에 실패했습니다.');
    }

    console.log('Page loaded successfully.');
    
    // 로그인 필요 여부 검사
    if (url.includes('/share/')) {
      console.log('Shared URL detected, skipping login check');
    } else {
      const isActualLoginPage = await page.evaluate(() => {
        return window.location.href.includes('/login') || 
               window.location.href.includes('auth0.openai.com') ||
               window.location.pathname === '/auth/login';
      });
      
      if (isActualLoginPage) {
        console.log('Login page detected.');
        throw new Error('로그인이 필요한 페이지입니다. ChatGPT에 로그인 후 다시 시도해주세요.');
      }
    }
    
    // 페이지 내용이 충분히 로드될 때까지 추가 대기
    await page.waitForTimeout(3000);
    
    // 스크린샷 캡처 (디버깅용) - Vercel 환경에서는 건너뛰기
    if (!isVercel) {
      try {
        await page.screenshot({ path: 'chatgpt-capture.png' });
        console.log('Screenshot saved to chatgpt-capture.png');
      } catch (screenshotError) {
        console.warn('Unable to save screenshot:', screenshotError);
        // 스크린샷 실패해도 계속 진행
      }
    } else {
      console.log('Skipping screenshot in Vercel environment (read-only filesystem)');
    }
    
    // 전체 페이지 HTML 가져오기 - 모든 구조 그대로 유지
    const rawHtml = await page.content();
    
    // 페이지 텍스트 콘텐츠 가져오기
    const rawText = await page.evaluate(() => document.body.innerText);

    // 대화 내용 추출 (메시지 구조화)
    console.log('Extracting conversation data...');
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

    console.log(`Extracted conversation: "${conversation.title}" with ${conversation.messages.length} messages`);

    return {
      conversation,
      rawHtml,
      rawText
    };
  } catch (error) {
    console.error('Error during conversation extraction:', error);
    throw error instanceof Error 
      ? error 
      : new Error(`대화 추출 중 오류 발생: ${String(error)}`);
  } finally {
    // 브라우저 종료 - 리소스 정리
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
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
    console.log('Starting conversation extraction...');
      
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
      
      console.log(`Title extracted: ${title}`);
      
    // 페이지 전체에서 모든 대화 요소 직접 추출 시도
    // 1. assistant 메시지 찾기
    const assistantElements = document.querySelectorAll('[data-message-author-role="assistant"]');
    console.log(`[DEBUG] Found ${assistantElements.length} assistant elements by attribute`);
    
    // 2. user 메시지 찾기 (여러 방법 시도)
    // 명시적인 user 역할 속성 찾기
    const userByAttrElements = document.querySelectorAll('[data-message-author-role="user"]');
    console.log(`[DEBUG] Found ${userByAttrElements.length} user elements by attribute`);
    
    // 대안: 특정 클래스와 위치로 user 메시지 추론
    let userElements: Element[] = [];
    
    // 대화 메시지를 저장할 배열
    let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    if (userByAttrElements.length === 0) {
      // 여러 가능한 사용자 메시지 컨테이너 선택자 시도
      for (const selector of [
        '.whitespace-pre-wrap:not([data-message-author-role])', 
        '.text-message:not([data-message-author-role])',
        '.chat-message[role="user"]',
        '.chat-message-user',
        '.message-user',
        '.human-message'
      ]) {
        const candidates = document.querySelectorAll(selector);
        console.log(`[DEBUG] Found ${candidates.length} potential user elements with selector: ${selector}`);
        
        if (candidates.length > 0) {
          userElements = Array.from(candidates);
          break;
        }
      }
    } else {
      userElements = Array.from(userByAttrElements);
    }
    
    console.log(`[DEBUG] Total user elements: ${userElements.length}`);
    
    // 대화 수집
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
      
      console.log(`[DEBUG] Sorted conversation elements: ${conversationElements.length}`);
      console.log(`[DEBUG] First few roles: ${conversationElements.slice(0, 3).map(e => e.role).join(', ')}`);
      
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
      
      console.log(`[DEBUG] Extracted ${extractedMessages.length} messages`);
      if (extractedMessages.length > 0) {
        console.log(`[DEBUG] First message role: ${extractedMessages[0].role}`);
        console.log(`[DEBUG] First message preview: ${extractedMessages[0].content.substring(0, 30)}...`);
      }
      
      // 최소한 하나의 사용자와 어시스턴트 메시지가 있는지 확인
      const hasUser = extractedMessages.some(m => m.role === 'user');
      const hasAssistant = extractedMessages.some(m => m.role === 'assistant');
      
      if (hasUser && hasAssistant && extractedMessages.length >= 2) {
        console.log(`[DEBUG] Found valid conversation with ${extractedMessages.length} messages`);
        messages = extractedMessages;
      } else {
        console.log(`[DEBUG] Extracted messages don't form a valid conversation (user: ${hasUser}, assistant: ${hasAssistant})`);
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
      console.log('첫 메시지가 사용자 메시지가 아닙니다. 대화 구조를 수정합니다.');
      
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