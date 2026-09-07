/**
 * AI Service for Career Assistant
 * Restores the proven V3 streaming and non-streaming execution flow:
 * Client -> POST /api/ai/assistant -> SSE streaming / JSON fallback.
 */

export interface CareerAssistantChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AskCareerAssistantStreamParams {
  message: string;
  history?: CareerAssistantChatMessage[];
  studentContext: any;
  onChunk: (chunk: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

export interface AskCareerAssistantParams {
  message: string;
  history?: CareerAssistantChatMessage[];
  studentContext: any;
  signal?: AbortSignal;
}

/**
 * Streams response from POST /api/ai/assistant using Server-Sent Events (SSE).
 * Updates the assistant message incrementally in real time.
 */
export async function askCareerAssistantStream(params: {
  message: string;
  history?: CareerAssistantChatMessage[];
  studentContext: any;
  onChunk: (chunk: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { message, history = [], studentContext, onChunk, onDone, onError, signal } = params;

  try {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        message,
        history,
        studentContext,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      let errorMsg = `Request failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.error) {
          errorMsg = errorJson.error;
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    // If server returned non-streaming JSON (fallback)
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream') || !res.body) {
      const json = await res.json();
      const text = json.text || '';
      onChunk(text);
      onDone?.(text);
      return;
    }

    // Stream SSE chunks
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.slice(5).trim();
        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            accumulatedText += parsed.text;
            onChunk(parsed.text);
          }
          if (parsed.done) {
            onDone?.(accumulatedText);
            return;
          }
        } catch (parseErr: any) {
          if (parseErr.message && !parseErr.message.includes('JSON')) {
            throw parseErr;
          }
        }
      }
    }

    // Flush any remaining buffer
    if (buffer.trim().startsWith('data:')) {
      const dataStr = buffer.trim().slice(5).trim();
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.text) {
          accumulatedText += parsed.text;
          onChunk(parsed.text);
        }
      } catch {
        // ignore trailing parse error
      }
    }

    onDone?.(accumulatedText);
  } catch (err: any) {
    if (signal?.aborted) return;
    if (onError) {
      onError(err instanceof Error ? err : new Error(String(err)));
    } else {
      throw err;
    }
  }
}

/**
 * Standard non-streaming fallback request to POST /api/ai/assistant.
 */
export async function askCareerAssistant(
  params: AskCareerAssistantParams
): Promise<{ text: string }> {
  const { message, history = [], studentContext, signal } = params;

  const res = await fetch('/api/ai/assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      studentContext,
      stream: false,
    }),
    signal,
  });

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch {
      // use default error message
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return {
    text: json.text || '',
  };
}
