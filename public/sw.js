const CACHE_NAME = 'hrx-v1';
const RUNTIME_CACHE = 'hrx-runtime-v1';

// Arquivos essenciais para cache durante install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install - cacheia arquivos essenciais
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching essentials');
      // Cachear arquivos um por um para evitar falha total
      const cachePromises = PRECACHE_URLS.map(async (url) => {
        try {
          await cache.add(url);
          console.log('[SW] Cached:', url);
        } catch (error) {
          console.warn('[SW] Failed to cache:', url, error);
          // Continua mesmo se um arquivo falhar
        }
      });
      return Promise.all(cachePromises);
    })
  );
  self.skipWaiting();
});

// Activate - limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - estratégia Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  // Ignora requisições do Clerk (autenticação)
  if (url.hostname.includes('clerk')) {
    return;
  }

  // Ignora requisições de API (sempre busca do servidor)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Ignora redirects (307/308) - não cacheia
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Não cacheia redirects
        if (response.status === 307 || response.status === 308) {
          return response;
        }

        // Não cacheia erros
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clona a resposta para cachear
        const responseToCache = response.clone();

        // Cacheia arquivos estáticos
        if (
          request.method === 'GET' &&
          (url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.jpg') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.woff2'))
        ) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // Em caso de falha de rede, tenta buscar do cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', request.url);
            return cachedResponse;
          }

          // Se for navegação e não está em cache, retorna página offline
          if (request.mode === 'navigate') {
            return caches.match('/');
          }

          // Retorna resposta vazia para outros recursos
          return new Response('', {
            status: 404,
            statusText: 'Not Found',
          });
        });
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
