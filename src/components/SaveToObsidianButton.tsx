'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DownloadIcon, 
  FileJsonIcon, 
  FileTextIcon, 
  FolderOpenIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { 
  isFileSystemAccessSupported, 
  saveConversationToObsidianVault,
  downloadMarkdownFile,
  downloadJsonFile,
  isBrowser
} from '@/utils/fileSystemAccess';
import { ChatMessage } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

// 로컬 타입 정의
interface SummaryData {
  summary: string;
  keywords: string[];
  modelUsed?: string;
}

interface SaveToObsidianButtonProps {
  conversation: {
    title: string;
    messages: ChatMessage[];
    metadata?: Record<string, any>;
  };
  summaryResult: SummaryData;
  rawText: string;
  url: string;
}

export default function SaveToObsidianButton({
  conversation,
  summaryResult,
  rawText,
  url
}: SaveToObsidianButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
    files?: string[];
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // File System API 지원 확인 - 모든 브라우저에서 클라이언트 사이드로 동작하도록 변경
  const fsApiSupported = isBrowser() && isFileSystemAccessSupported();
  
  const handleSaveToObsidian = async () => {
    setIsLoading(true);
    setStatus({});
    
    try {
      const result = await saveConversationToObsidianVault(
        conversation,
        summaryResult,
        rawText,
        url
      );
      
      if (result.success) {
        toast({
          title: "파일 저장 성공!",
          description: `${result.files.length}개의 파일이 저장되었습니다.`,
          variant: "success"
        });
        
        // 성공 시 대화상자 닫기
        setIsOpen(false);
      } else {
        setStatus({
          success: false,
          message: '파일 저장에 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('옵시디언 저장 중 오류:', error);
      setStatus({
        success: false,
        message: error instanceof Error ? error.message : '파일 저장에 실패했습니다.'
      });
      
      toast({
        title: "저장 실패",
        description: error instanceof Error ? error.message : '파일 저장에 실패했습니다.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadMarkdown = () => {
    try {
      downloadMarkdownFile(conversation, summaryResult, url);
      toast({
        title: "마크다운 다운로드 완료",
        description: "파일이 성공적으로 다운로드되었습니다.",
        variant: "success"
      });
    } catch (error) {
      console.error('마크다운 다운로드 오류:', error);
      toast({
        title: "다운로드 실패",
        description: "마크다운 파일을 다운로드하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  const handleDownloadJson = () => {
    try {
      downloadJsonFile(conversation, summaryResult, url);
      toast({
        title: "JSON 다운로드 완료",
        description: "파일이 성공적으로 다운로드되었습니다.",
        variant: "success"
      });
    } catch (error) {
      console.error('JSON 다운로드 오류:', error);
      toast({
        title: "다운로드 실패",
        description: "JSON 파일을 다운로드하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2 border-gray-200 dark:border-slate-700 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200">
            <DownloadIcon className="w-4 h-4" />
            <span>내보내기</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
          <DropdownMenuLabel className="text-gray-700 dark:text-slate-200">파일 내보내기</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-700" />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleDownloadMarkdown} className="text-gray-700 dark:text-slate-200 focus:bg-gray-100 dark:focus:bg-slate-800">
              <FileTextIcon className="mr-2 h-4 w-4" />
              <span>마크다운 (.md) 다운로드</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadJson} className="text-gray-700 dark:text-slate-200 focus:bg-gray-100 dark:focus:bg-slate-800">
              <FileJsonIcon className="mr-2 h-4 w-4" />
              <span>JSON 다운로드</span>
            </DropdownMenuItem>
            {fsApiSupported && (
              <>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-700" />
                <DropdownMenuItem onClick={() => setIsOpen(true)} className="text-gray-700 dark:text-slate-200 focus:bg-gray-100 dark:focus:bg-slate-800">
                  <FolderOpenIcon className="mr-2 h-4 w-4" />
                  <span>옵시디언 Vault에 저장</span>
                  <span className="ml-1 text-xs text-gray-400 dark:text-slate-500">(고급)</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">옵시디언 Vault에 저장</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-400">
              대화 내용을 선택한 옵시디언 Vault에 저장합니다.
            </DialogDescription>
          </DialogHeader>
          
          {status.success === undefined ? (
            <div className="py-4 text-center">
              <p className="mb-4 text-gray-800 dark:text-slate-200">
                다음 파일들이 선택한 폴더에 저장됩니다:
              </p>
              <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-2 text-left">
                <li><FileTextIcon className="inline w-4 h-4 mr-2" /> {conversation.title}.md <span className="text-xs">(ChatGPT 폴더)</span></li>
                <li><FileTextIcon className="inline w-4 h-4 mr-2" /> {conversation.title}-original.txt <span className="text-xs">(ChatGPT 폴더)</span></li>
                <li><FileJsonIcon className="inline w-4 h-4 mr-2" /> {conversation.title}-{Date.now()}.json <span className="text-xs">(_data/conversations 폴더)</span></li>
              </ul>
            </div>
          ) : (
            <div className="py-4 text-center">
              <XCircleIcon className="w-12 h-12 mx-auto text-red-500 mb-2" />
              <p className="text-lg font-medium text-gray-800 dark:text-slate-200">저장 실패</p>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{status.message}</p>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="mb-0 sm:mb-0 w-full sm:w-auto border-gray-200 dark:border-slate-700 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200"
            >
              닫기
            </Button>
            {status.success === undefined && (
              <Button
                type="button"
                onClick={handleSaveToObsidian}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>저장 중...</span>
                  </>
                ) : (
                  <>
                    <FolderOpenIcon className="w-4 h-4" />
                    <span>폴더 선택 후 저장</span>
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 