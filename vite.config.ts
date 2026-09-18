import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Локальный серверный AI-прокси middleware (аналог Python бэкенда)
 * Решает проблему CORS и DNS в браузере, отправляя запросы к Hugging Face / DeepSeek
 * напрямую через процесс Node.js.
 */
function aiServerProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'ai-server-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ai-proxy', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');

          try {
            const payload = JSON.parse(body || '{}');
            const authHeader = (req.headers['authorization'] as string) || '';
            const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
            const token = (payload.token || bearerToken || env.VITE_HF_API_KEY || '').trim();
            const model = payload.model || env.VITE_HF_MODEL || 'deepseek-ai/DeepSeek-V4-Flash-0731';
            const messages = payload.messages || [];

            if (!token) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'API token is required' }));
              return;
            }

            const isDeepSeek = token.startsWith('sk-');
            const endpoint = isDeepSeek
              ? 'https://api.deepseek.com/chat/completions'
              : 'https://router.huggingface.co/v1/chat/completions';

            const requestBody = {
              model: isDeepSeek ? 'deepseek-chat' : model,
              messages,
              max_tokens: 1024,
              temperature: 0.2,
            };

            console.log(`[AI Proxy] Sending request to ${endpoint} with model ${requestBody.model}`);

            const upstreamRes = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            const responseText = await upstreamRes.text();
            res.statusCode = upstreamRes.status;

            try {
              const json = JSON.parse(responseText);
              // Если модель вернула ответ в reasoning_content (как у DeepSeek-V4/R1), гарантируем наличие content
              const choice = json.choices?.[0];
              if (choice?.message) {
                if (!choice.message.content && choice.message.reasoning_content) {
                  choice.message.content = choice.message.reasoning_content;
                }
              }
              res.end(JSON.stringify(json));
            } catch {
              res.end(responseText);
            }
          } catch (error: any) {
            console.error('[AI Proxy Error]:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message || 'Internal Proxy Error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), aiServerProxyPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: false,
    },
  };
});
