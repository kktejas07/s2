from typing import Optional
from redis.asyncio import Redis
from core.config import settings

_client: Optional[Redis] = None

async def get_redis() -> Redis:
    global _client
    if _client is None:
        _client = Redis.from_url(settings.redis_url, decode_responses=True)
    return _client

async def close_redis():
    global _client
    if _client: await _client.close(); _client = None

async def cache_get(key: str) -> Optional[str]:
    r = await get_redis(); return await r.get(key)

async def cache_set(key: str, value: str, expire: int = 300):
    r = await get_redis(); await r.setex(key, expire, value)

async def cache_delete(key: str):
    r = await get_redis(); await r.delete(key)

async def cache_delete_pattern(pattern: str):
    r = await get_redis(); cursor = 0
    while True:
        cursor, keys = await r.scan(cursor=cursor, match=pattern, count=100)
        if keys: await r.delete(*keys)
        if cursor == 0: break
