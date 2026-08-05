export class HazardApiClient {
  constructor(options= {
  }) {
    this.base=options.base||'/api/hazards';
    this.timeoutMs=options.timeoutMs||9000;
  }
  async request(path, options= {
  }) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(), this.timeoutMs);
    try {
      const response=await fetch(`${this.base}${path}`, {
        ...options, signal:controller.signal, headers: {
          'content-type':'application/json', ...(options.headers|| {
          })
        }
      });
      if(!response.ok) {
        const body=await response.json().catch(()=>( {
        }));
        throw new Error(body.error?.message||`Hazard request failed (${response.status})`);
      }
      return response.json();
    }finally {
      clearTimeout(timer);
    }
  }
  catalog() {
    return this.request('/catalog');
  }
  snapshot(params= {
  }) {
    const query=new URLSearchParams();
    for(const [key, value] of Object.entries(params)) {
      if(value==null||value==='')continue;
      query.set(key, Array.isArray(value)?value.join(','):String(value));
    }
    return this.request(`/snapshot?${query}`);
  }
  scenario(payload) {
    return this.request('/scenario', {
      method:'POST', body:JSON.stringify(payload)
    });
  }
  exposure(payload) {
    return this.request('/exposure', {
      method:'POST', body:JSON.stringify(payload)
    });
  }
  watchlist() {
    return this.request('/watchlist');
  }
  addWatch(payload) {
    return this.request('/watchlist', {
      method:'POST', body:JSON.stringify(payload)
    });
  }
  evaluateWatches(payload= {
  }) {
    return this.request('/watchlist/evaluate', {
      method:'POST', body:JSON.stringify(payload)
    });
  }
}
