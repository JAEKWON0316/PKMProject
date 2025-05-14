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
  isVercelEnv
} from '@/utils/fileSystemAccess';
import { ChatMessage } from '@/types';
import { SummaryResult } from '@/lib/utils/openai';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface SaveToObsidianButtonProps {
  conversation: {
    title: string;
    messages: ChatMessage[];
    metadata?: Record<string, any>;
  };
  summaryResult: SummaryResult;
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
  
  const fsApiSupported = typeof window !== 'undefined' && isFileSystemAccessSupported();
  
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
      
      setStatus({
        success: result.success,
        message: result.success 
          ? `${result.files.length}개의 파일을 저장했습니다.` 
          : '파일 저장에 실패했습니다.',
        files: result.files
      });
    } catch (error) {
      console.error('옵시디언 저장 중 오류:', error);
      setStatus({
        success: false,
        message: error instanceof Error ? error.message : '파일 저장에 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadMarkdown = () => {
    downloadMarkdownFile(conversation, summaryResult, url);
  };
  
  const handleDownloadJson = () => {
    downloadJsonFile(conversation, summaryResult, url);
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <DownloadIcon className="w-4 h-4" />
            <span>내보내기</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>파일 내보내기</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleDownloadMarkdown}>
              <FileTextIcon className="mr-2 h-4 w-4" />
              <span>마크다운 (.md) 다운로드</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadJson}>
              <FileJsonIcon className="mr-2 h-4 w-4" />
              <span>JSON 다운로드</span>
            </DropdownMenuItem>
            {fsApiSupported && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsOpen(true)}>
                  <FolderOpenIcon className="mr-2 h-4 w-4" />
                  <span>옵시디언 Vault에 저장</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>옵시디언 Vault에 저장</DialogTitle>
            <DialogDescription>
              대화 내용을 선택한 옵시디언 Vault에 저장합니다.
            </DialogDescription>
          </DialogHeader>
          
          {status.success === undefined ? (
            <div className="py-4 text-center">
              <p className="mb-4">
                다음 파일들이 선택한 폴더에 저장됩니다:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
                <li><FileTextIcon className="inline w-4 h-4 mr-2" /> {conversation.title}.md <span className="text-xs">(ChatGPT 폴더)</span></li>
                <li><FileTextIcon className="inline w-4 h-4 mr-2" /> {conversation.title}-original.txt <span className="text-xs">(ChatGPT 폴더)</span></li>
                <li><FileJsonIcon className="inline w-4 h-4 mr-2" /> {conversation.title}-{Date.now()}.json <span className="text-xs">(_data/conversations 폴더)</span></li>
              </ul>
            </div>
          ) : status.success ? (
            <div className="py-4 text-center">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-2" />
              <p className="text-lg font-medium">{status.message}</p>
              {status.files && status.files.length > 0 && (
                <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-left">
                  {status.files.map((file, index) => (
                    <li key={index} className="truncate">
                      {file.endsWith('.md') ? (
                        <FileTextIcon className="inline w-4 h-4 mr-1" />
                      ) : file.endsWith('.json') ? (
                        <FileJsonIcon className="inline w-4 h-4 mr-1" />
                      ) : (
                        <FileTextIcon className="inline w-4 h-4 mr-1" />
                      )} 
                      {file}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="py-4 text-center">
              <XCircleIcon className="w-12 h-12 mx-auto text-red-500 mb-2" />
              <p className="text-lg font-medium">저장 실패</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{status.message}</p>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="mb-2 sm:mb-0"
            >
              닫기
            </Button>
            {status.success === undefined && (
              <Button
                type="button"
                onClick={handleSaveToObsidian}
                disabled={isLoading}
                className="flex items-center gap-2"
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