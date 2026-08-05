export async function mapConcurrent(items, worker, options = {}) {
  const list = [...items];
  const concurrency = Math.max(1, Math.min(list.length || 1, Number(options.concurrency || 4)));
  const results = new Array(list.length);
  let cursor = 0;
  let aborted = false;

  async function run() {
    while (!aborted) {
      const index = cursor++;
      if (index >= list.length) return;
      if (options.signal?.aborted) {
        aborted = true;
        return;
      }
      try {
        results[index] = { status: 'fulfilled', value: await worker(list[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
        if (options.stopOnError) aborted = true;
      }
      options.onProgress?.({ completed: results.filter(Boolean).length, total: list.length, index });
    }
  }

  await Promise.all(Array.from({ length: concurrency }, run));
  if (aborted && options.signal?.aborted) throw options.signal.reason || new Error('Operation aborted');
  return results;
}

export async function withTimeout(promiseFactory, timeoutMs, createError) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(promiseFactory),
      new Promise((_, reject) => { timer = setTimeout(() => reject(createError()), timeoutMs); })
    ]);
  } finally {
    clearTimeout(timer);
  }
}
