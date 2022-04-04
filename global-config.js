/* eslint-disable operator-linebreak */
/**
 *  默认只有Windows系统浏览器可视化, 方便调试和排错
 *  @type {boolean} */
export const showBrowser = process.platform === 'darwin';

/**
 * youtube-dl下载位置。修改则需和u2bili.sh内的下载地址保持一致
 * @type {string}
 */
export const downloadPath = '../downloads/';

export const moviePath = '../ffmpegOutput/';

export const userAgent =
  '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 Edg/88.0.705.74"';
