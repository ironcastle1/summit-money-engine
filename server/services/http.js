const axios = require('axios');
async function getJson(url, opts={}){
  const res = await axios.get(url, { timeout: opts.timeout || 9000, headers: { 'User-Agent':'SummitMoneyEngine/0.5', ...(opts.headers||{}) } });
  return res.data;
}
async function postJson(url, body, opts={}){
  const res = await axios.post(url, body, { timeout: opts.timeout || 10000, headers: { 'User-Agent':'SummitMoneyEngine/0.5', ...(opts.headers||{}) } });
  return res.data;
}
module.exports = { getJson, postJson };
