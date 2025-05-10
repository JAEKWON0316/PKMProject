-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create chat_sessions table to store ChatGPT conversations
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  messages JSONB NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536),  -- OpenAI ada-002 embedding dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chat_chunks table to store chunked conversation parts with embeddings
CREATE TABLE IF NOT EXISTS chat_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,  -- OpenAI ada-002 embedding dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (chat_session_id, chunk_index)
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS chat_sessions_title_idx ON chat_sessions USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS chat_chunks_content_idx ON chat_chunks USING GIN (to_tsvector('english', content));

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  chat_session_id UUID,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chunks.id,
    chunks.chat_session_id,
    chunks.chunk_index,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) AS similarity
  FROM chat_chunks chunks
  WHERE 1 - (chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 