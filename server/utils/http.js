const axios = require('axios');

async function getJson(url, opts = {}) {
  const res = await axios.get(url, {
    timeout: opts.timeout || 9000,
    headers: {
      'User-Agent': 'SummitMoneyEngine/1.0',
      'Accept': 'application/json,text/plain,*/*',
      ...(opts.headers || {})
    }
  });
  return res.data;
}

module.exports = { getJson };
