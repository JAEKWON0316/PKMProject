import { redirect } from 'next/navigation';
import { saveConversation } from '@/utils/conversationHandler';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    url?: string;
  };
}

export default async function CrawlPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const { url } = searchParams;
  
  if (!url) {
    return notFound();
  }
  
  // 대화 크롤링 및 저장
  await crawlAndSave(id, url);
  
  // 저장 완료 페이지로 리다이렉트 (crawlAndSave 함수 내에서 처리됨)
  return null;
}

async function crawlAndSave(id: string, url: string) {
  try {
    console.log(`대화 크롤링 시작: ${url}`);
    
    // 통합 저장 핸들러 호출 (모든 옵션 활성화)
    const result = await saveConversation(url, {
      saveToSupabase: true,
      saveToObsidian: true,
      saveAsJson: true
    });
    
    if (!result.success) {
      throw new Error(result.error || '대화 크롤링 중 오류가 발생했습니다.');
    }
    
    // 중복 감지 시
    if (result.duplicate) {
      console.log(`URL 중복 감지: ${url}`);
      
      const params = new URLSearchParams({
        title: result.title || '대화',
        url,
        duplicate: 'true',
        id: result.id || '',
      });
      
      redirect(`/success?${params.toString()}`);
    }
    
    // 성공 응답 및 리다이렉트 - 큰 데이터를 URL에 담지 않고 필수 정보만 전달
    const params = new URLSearchParams({
      title: result.title || '',
      url,
      duplicate: 'false',
      id: result.id || '',
      summary: result.summary || '',
      keywords: result.keywords?.join(',') || ''
    });
    
    // 리다이렉트
    redirect(`/success?${params.toString()}`);
  } catch (error) {
    console.error('크롤링 오류:', error);
    
    // 오류 발생 시 오류 페이지로 리다이렉트
    const params = new URLSearchParams({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      url: url || ''
    });
    
    redirect(`/error?${params.toString()}`);
  }
} 