type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type CreateChatCompletionParams = {
  apiKey: string;
  model: string;
  messages: OpenAIMessage[];
};

function ensureApiKey(apiKey: string) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing.');
  }
}

async function readError(response: Response) {
  const text = await response.text();

  try {
    const data = JSON.parse(text) as { error?: { message?: string } };
    return data.error?.message || text;
  } catch {
    return text;
  }
}

export async function createOpenAIChatCompletion({
  apiKey,
  model,
  messages,
}: CreateChatCompletionParams): Promise<string> {
  ensureApiKey(apiKey);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${await readError(response)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  return data.choices?.[0]?.message?.content || 'No analysis generated.';
}

export async function streamOpenAIChatCompletion(
  { apiKey, model, messages }: CreateChatCompletionParams,
  onText: (text: string) => void,
): Promise<string> {
  ensureApiKey(apiKey);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${await readError(response)}`);
  }

  if (!response.body) {
    throw new Error('OpenAI streaming response body was empty.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const lines = event
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data: '));

      for (const line of lines) {
        const payload = line.slice(6);

        if (payload === '[DONE]') {
          return fullText;
        }

        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const chunkText = json.choices?.[0]?.delta?.content || '';

          if (chunkText) {
            fullText += chunkText;
            onText(chunkText);
          }
        } catch {
          // Ignore keepalive or partial chunks until the next buffer flush.
        }
      }
    }
  }

  return fullText;
}
