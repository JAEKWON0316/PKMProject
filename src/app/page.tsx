'use client'

import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    setResult(null)

    try {
      console.log(`Submitting URL: ${url}`)
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()
      console.log('API response:', data)

      if (!data.success) {
        throw new Error(data.error || '대화 처리 중 오류가 발생했습니다.')
      }

      setSuccess(true)
      setResult(data.data)
      setUrl('')
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          PKM Project
        </h1>
        <p className="text-center text-lg mb-8">
          ChatGPT 공유 기능 기반 PKM 시스템
        </p>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              ChatGPT 공유 링크
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://chatgpt.com/share/..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? '처리 중...' : '변환하기'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              <p className="font-bold mb-1">오류 발생:</p>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
              <p className="font-bold mb-2">대화가 성공적으로 저장되었습니다!</p>
              {result && (
                <div className="text-sm">
                  <p><strong>제목:</strong> {result.conversation.title}</p>
                  
                  {result.obsidian && (
                    <p><strong>Obsidian 저장:</strong> {result.obsidian.path}/{result.obsidian.fileName}</p>
                  )}
                  
                  {result.jsonBackup && (
                    <p><strong>JSON 백업:</strong> {result.jsonBackup}</p>
                  )}
                  
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </main>
  )
} 