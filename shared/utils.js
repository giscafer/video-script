export function parseCookieObject(cookieMap, domain = '.bilibili.com') {
  return Object.keys(cookieMap).map((k) => ({
    domain,
    path: '/',
    name: k,
    value: cookieMap[k],
  }));
}

// 去除网址
export const replaceYoutubeUrl = (str) => {
  // eslint-disable-next-line operator-linebreak
  const reg =
    // eslint-disable-next-line no-useless-escape
    /(?:http(?:s)?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:(?:watch)?\?(?:.*&)?v(?:i)?=|(?:embed|v|vi|user)\/))([^\?&\''<> #]+)/;
  return str.replace(reg, '').replace(/(http:\/\/|http:\/\/)/g, '');
};
