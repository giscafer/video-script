import { BaiduFanyiAPI } from 'baidu-fanyi-api';

const api = new BaiduFanyiAPI();

async function translate(query) {
  await api.init();
  const transResult = await api.translate(query, 'en', 'zh');
  const data = transResult.trans_result.data || {};

  return data[0]?.dst;
}

export default translate;
