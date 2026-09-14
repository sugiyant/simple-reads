import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const isArticle = path.startsWith('/articles/');
  const isCacheable = ['/', '/explore/', '/archive/'].includes(path) || isArticle;

  if (!isCacheable || context.request.method !== 'GET') {
    return next();
  }

  const runtime = (context.locals as any).runtime;
  if (!runtime) {
    const res = await next();
    res.headers.set('X-Debug-Cache', 'No runtime');
    return res;
  }

  const cache = (globalThis as any).caches?.default;
  if (!cache) {
    const res = await next();
    res.headers.set('X-Debug-Cache', 'No cache object');
    return res;
  }

  const cacheKey = context.url.toString();

  try {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const hit = new Response(cached.body, cached);
      hit.headers.set('X-Cache', 'HIT');
      return hit;
    }

    const response = await next();
    const ct = response.headers.get('Content-Type') || '';
    
    if (response.status === 200 && ct.includes('text/html')) {
      const clone = response.clone();
      // Set cache headers to make sure Cloudflare allows saving it
      clone.headers.set('Cache-Control', 'public, s-maxage=600');
      
      const ctx = runtime.ctx;
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(cache.put(cacheKey, clone));
      } else {
        await cache.put(cacheKey, clone);
      }
      
      const out = new Response(response.body, response);
      out.headers.set('X-Cache', 'MISS');
      return out;
    }

    return response;
  } catch (err: any) {
    const res = await next();
    res.headers.set('X-Debug-Cache-Error', err.message || String(err));
    return res;
  }
});
