import { ChatMessage } from '@/types';

// 내부 타입 정의 (자체 SummaryResult 정의)
interface SummaryData {
  summary: string;
  keywords: string[];
  modelUsed?: string;
}

/**
 * File System Access API 지원 여부를 확인합니다.
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 
    'showSaveFilePicker' in window && 
    'showDirectoryPicker' in window;
}

/**
 * 브라우저 환경인지 확인합니다.
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Vercel 배포 환경에서 실행 중인지 확인합니다.
 * 클라이언트, 서버 사이드 모두에서 안정적으로 동작하도록 수정
 */
export function isVercelEnv(): boolean {
  // 서버 사이드에서의 확인
  if (typeof window === 'undefined') {
    // process.env 값으로 확인 (서버 사이드)
    return Boolean(process.env.VERCEL === '1' || 
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' || 
      process.env.NEXT_PUBLIC_VERCEL === '1');
  } 
  
  // 클라이언트 사이드에서의 확인
  try {
    // window.location.hostname으로 확인 (클라이언트 사이드)
    const hostname = window.location.hostname;
    return hostname.includes('vercel.app') || 
           hostname.endsWith('.vercel.app') || 
           // 다른 프로덕션 도메인들
           hostname === 'pmkproject.site' || 
           hostname === 'www.pmkproject.site';
  } catch (error) {
    console.error('Error checking Vercel environment on client side:', error);
    // 에러 발생 시 안전하게 true 반환 (배포 환경으로 취급)
    return true;
  }
}

/**
 * 파일 시스템 쓰기 권한을 확인합니다.
 */
export async function verifyPermission(
  fileHandle: FileSystemHandle, 
  readWrite: boolean = false
): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  
  // 이미 권한이 있는지 확인
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  
  // 권한 요청
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  
  return false;
}

/**
 * 파일 저장 다이얼로그를 표시하고 파일을 저장합니다.
 */
export async function saveFileWithPicker(
  content: string, 
  options: {
    fileName?: string;
    fileExtension?: string;
    description?: string;
    startIn?: 'documents' | 'desktop' | 'downloads' | 'pictures' | 'music' | FileSystemDirectoryHandle;
    mimeType?: string;
  } = {}
): Promise<boolean> {
  if (!isFileSystemAccessSupported()) {
    console.error('File System Access API가 지원되지 않는 브라우저입니다.');
    return false;
  }
  
  const { 
    fileName = 'untitled', 
    fileExtension = '.txt',
    description = 'Text documents',
    startIn = 'documents',
    mimeType = 'text/plain'
  } = options;
  
  const suggestedName = fileName.endsWith(fileExtension) 
    ? fileName 
    : `${fileName}${fileExtension}`;
  
  try {
    // 파일 저장 다이얼로그 표시
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [{
        description,
        accept: {
          [mimeType]: [fileExtension],
        },
      }],
      startIn
    });
    
    // 파일 쓰기 권한 확인
    const hasPermission = await verifyPermission(handle, true);
    if (!hasPermission) {
      throw new Error('파일 쓰기 권한이 거부되었습니다.');
    }
    
    // 파일 쓰기 스트림 생성
    const writable = await handle.createWritable();
    
    // 데이터 쓰기
    await writable.write(content);
    
    // 스트림 닫기
    await writable.close();
    
    return true;
  } catch (error) {
    console.error('파일 저장 중 오류:', error);
    return false;
  }
}

/**
 * 디렉토리 선택 다이얼로그를 표시하고 선택된 디렉토리에 파일을 저장합니다.
 */
export async function saveFilesToDirectory(
  files: Array<{ 
    name: string; 
    content: string; 
    subFolder?: string;
  }>,
  options: {
    startIn?: 'documents' | 'desktop' | 'downloads' | FileSystemDirectoryHandle;
  } = {}
): Promise<{ success: boolean; savedFiles: string[] }> {
  if (!isFileSystemAccessSupported()) {
    console.error('File System Access API가 지원되지 않는 브라우저입니다.');
    return { success: false, savedFiles: [] };
  }
  
  const { startIn = 'documents' } = options;
  
  try {
    // 디렉토리 선택 다이얼로그 표시
    const dirHandle = await window.showDirectoryPicker({
      startIn,
      id: 'obsidian-vault-selector',
      mode: 'readwrite'
    });
    
    // 디렉토리 쓰기 권한 확인
    const hasPermission = await verifyPermission(dirHandle, true);
    if (!hasPermission) {
      throw new Error('디렉토리 쓰기 권한이 거부되었습니다.');
    }
    
    const savedFiles: string[] = [];
    
    // 각 파일 저장
    for (const file of files) {
      try {
        let targetDir = dirHandle;
        
        // 하위 폴더가 지정된 경우 해당 폴더 생성 또는 접근
        if (file.subFolder) {
          const subFolders = file.subFolder.split('/');
          for (const folder of subFolders) {
            if (!folder) continue;
            targetDir = await targetDir.getDirectoryHandle(folder, { create: true });
          }
        }
        
        // 파일 핸들 생성
        const fileHandle = await targetDir.getFileHandle(file.name, { create: true });
        
        // 파일 쓰기 스트림 생성
        const writable = await fileHandle.createWritable();
        
        // 데이터 쓰기
        await writable.write(file.content);
        
        // 스트림 닫기
        await writable.close();
        
        // 저장된 파일 경로 추가
        savedFiles.push(file.subFolder ? `${file.subFolder}/${file.name}` : file.name);
      } catch (fileError) {
        console.error(`파일 저장 중 오류 (${file.name}):`, fileError);
      }
    }
    
    return { 
      success: savedFiles.length > 0, 
      savedFiles 
    };
  } catch (error) {
    console.error('디렉토리 저장 중 오류:', error);
    return { success: false, savedFiles: [] };
  }
}

/**
 * 옵시디언 볼트에 대화 내용을 저장합니다.
 */
export async function saveConversationToObsidianVault(
  conversation: {
    title: string;
    messages: ChatMessage[];
    metadata?: Record<string, any>;
  },
  summaryResult: SummaryData,
  rawText: string,
  url: string
): Promise<{ success: boolean; files: string[] }> {
  if (!isFileSystemAccessSupported()) {
    console.error('File System Access API가 지원되지 않는 브라우저입니다.');
    return { success: false, files: [] };
  }
  
  try {
    // 파일명 생성 (제목을 파일명으로 변환)
    const baseFileName = conversation.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
    
    const markdownFileName = `${baseFileName}.md`;
    const textFileName = `${baseFileName}-original.txt`;
    const jsonFileName = `${baseFileName}-${Date.now()}.json`;
    
    // 태그 목록 준비 (요약에서 추출한 키워드 + ChatGPT 모델)
    const tags = [
      ...(summaryResult.keywords || []),
      conversation.metadata?.model || summaryResult.modelUsed || 'gpt-4.1-nano'
    ].filter(Boolean); // 빈 값 제거
    
    // YAML 프론트매터 생성
    const frontmatter = `---
title: ${conversation.title}
date: ${new Date().toISOString()}
source: ${url}
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
model: ${conversation.metadata?.model || summaryResult.modelUsed || 'gpt-4.1-nano'}
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
    
    // JSON 파일 내용 생성
    const jsonContent = JSON.stringify(
      {
        title: conversation.title,
        url,
        summary: summaryResult.summary,
        keywords: summaryResult.keywords,
        messages: conversation.messages,
        metadata: {
          ...(conversation.metadata || {}),
          model: conversation.metadata?.model || summaryResult.modelUsed || 'gpt-4.1-nano',
          savedAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      },
      null,
      2
    );
    
    // 파일 저장할 준비
    const files = [
      { 
        name: markdownFileName, 
        content: markdownContent, 
        subFolder: 'ChatGPT'
      },
      { 
        name: textFileName, 
        content: rawText, 
        subFolder: 'ChatGPT'
      },
      { 
        name: jsonFileName, 
        content: jsonContent, 
        subFolder: '_data/conversations'
      }
    ];
    
    // 디렉토리 선택 다이얼로그 표시 및 파일 저장
    const result = await saveFilesToDirectory(files, { startIn: 'documents' });
    
    return {
      success: result.success,
      files: result.savedFiles
    };
  } catch (error) {
    console.error('옵시디언 저장 중 오류:', error);
    return { success: false, files: [] };
  }
}

/**
 * 대화 내용을 마크다운 파일로 다운로드합니다.
 */
export function downloadMarkdownFile(
  conversation: {
    title: string;
    messages: ChatMessage[];
    metadata?: Record<string, any>;
  },
  summaryResult: SummaryData,
  url: string
): void {
  if (!isBrowser()) return;

  // 태그 목록 준비 (요약에서 추출한 키워드 + ChatGPT 모델)
  const tags = [
    ...(summaryResult.keywords || []),
    conversation.metadata?.model || summaryResult.modelUsed || 'gpt-4.1-nano'
  ].filter(Boolean); // 빈 값 제거
  
  // YAML 프론트매터 생성
  const frontmatter = `---
title: ${conversation.title}
date: ${new Date().toISOString()}
source: ${url}
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
model: ${conversation.metadata?.model || summaryResult.modelUsed || 'gpt-4.1-nano'}
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

  // 파일명 생성 (제목을 파일명으로 변환)
  const fileName = conversation.title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100) + '.md';

  // Blob 생성
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
  
  // 다운로드 링크 생성 및 클릭
  const url_obj = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url_obj;
  a.download = fileName;
  a.click();
  
  // URL 객체 해제
  setTimeout(() => URL.revokeObjectURL(url_obj), 100);
}

/**
 * 대화 내용을 JSON 파일로 다운로드합니다.
 */
export function downloadJsonFile(
  conversation: {
    title: string;
    messages: ChatMessage[];
    metadata?: Record<string, any>;
  },
  summaryResult: SummaryData,
  url: string
): void {
  if (!isBrowser()) return;

  // JSON 파일 내용 생성
  const jsonContent = JSON.stringify(
    {
      title: conversation.title,
      url,
      summary: summaryResult.summary,
      keywords: summaryResult.keywords,
      messages: conversation.messages,
      metadata: {
        ...(conversation.metadata || {}),
        model: conversation.metadata?.model || summaryResult.modelUsed || 'gpt-4.1-nano',
        savedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString()
    },
    null,
    2
  );

  // 파일명 생성
  const fileName = `${conversation.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-')}-${Date.now()}.json`;

  // Blob 생성
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  
  // 다운로드 링크 생성 및 클릭
  const url_obj = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url_obj;
  a.download = fileName;
  a.click();
  
  // URL 객체 해제
  setTimeout(() => URL.revokeObjectURL(url_obj), 100);
} 