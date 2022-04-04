/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { firefox as browserCore } from 'playwright';
import { fileURLToPath } from 'url';
import { moviePath, showBrowser, userAgent } from '../global-config.js';
import { parseCookieObject, replaceYoutubeUrl } from '../shared/utils.js';
import uploadPageUrl, { cookieMap } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('moviePath=', join(__dirname, moviePath));

function getMetaPathFromArgs() {
  return process.argv.slice(2, 4);
}

let browser = null;
let context = null;
let page = null;

async function upload(meta, pageInstance, closeFlag = false) {
  page = pageInstance;
  // 便于循环重复利用页面
  if (!page) {
    browser = await browserCore.launch({
      headless: !showBrowser,
    });
    context = await browser.newContext({
      userAgent,
      storageState: {
        origins: [
          {
            origin: 'https://studio.ixigua.com',
            localStorage: [
              {
                name: 'SHOW_GUIDE',
                value: 'ixigua',
              },
            ],
          },
        ],
      },
    });
    context.addCookies(parseCookieObject(cookieMap, '.ixigua.com'));
    page = await context.newPage();
  }

  try {
    await page.goto(uploadPageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20 * 1000,
    });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log('网络问题导致页面加载超时...');
    }
  }

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('div.byte-upload-trigger'),
  ]);
  const tempMeta = meta;
  let [videoPath] = getMetaPathFromArgs();
  if (!videoPath) {
    const ext = ['mp4', 'mkv'].find((realExt) =>
      existsSync(join(__dirname, `${moviePath}${tempMeta.id}.${realExt}`))
    );
    if (!ext) {
      console.error(
        `无法在${moviePath}找到${tempMeta.id}命名的视频文件，上传未成功。`
      );
      process.exit(-1);
    }
    console.log('选择的视频文件：', `${moviePath}${tempMeta.id}.${ext}`);

    // videoPath = `./ffmpegOutput/${meta.id}.${ext}`;
    videoPath = join(__dirname, `${moviePath}${tempMeta.id}.${ext}`).toString();
  }
  await fileChooser.setFiles(videoPath);
  console.log('选择文件成功！');

  // 等待视频上传完成
  await page.waitForSelector('svg.success', { timeout: 1080 * 1000 });

  // 输入视频标题
  await page.click('div[data-editor="title"]', { timeout: 60 * 1000 });
  await page.keyboard.type(meta.title);

  // 封面获取
  await page.click('text="上传封面"');
  try {
    // mp4
    await page.waitForSelector('div.byte-slider.show-img-preview', {
      timeout: 10 * 1000,
    });
  } catch (err) {
    // mkv
    console.log('err', err);
    console.log('执行mkv图片选择逻辑');
    await page.waitForSelector('div.m-server-bg-list', { timeout: 10 * 1000 });
    // 选第一张图片
    await page.click('div.m-server-bg-list>div.m-system-i>img');
  }

  await page.click('text="下一步"');
  await page.waitForSelector('.upper-canvas', { timeout: 10 * 1000 });
  await page.click('text="确定"');
  await page.waitForSelector('text="完成后无法继续编辑，是否确定完成？"');
  await page.click('div.footer>button.red', { timeout: 60 * 1000 });
  // 等待封面渲染完成
  await page.waitForSelector('div.m-xigua-upload>div.bg', {
    timeout: 20 * 1000,
  });

  // 转载链接
  await page.click('text="转载"');
  await page.fill('input[placeholder^=转载内容应]', meta.webpage_url);

  // 创建话题
  await page.focus('input.arco-input-tag-input');
  await page.keyboard.type(meta.category);
  await page.keyboard.down('Enter'); // 不起作用
  await page.focus('input.arco-input-tag-input');
  await page.keyboard.type(meta.tag);
  await page.keyboard.down('Enter'); // 不起作用

  // -----更多选项(这里会抖动，暂时不知道原因)--------
  // 视频描述(头条描述不能输入网址，需要过滤掉)
  await page.click('div.video-form-fold>div.fold-title');
  await page.click('div[data-editor="abstract"]');
  await page.keyboard.type(
    `${replaceYoutubeUrl(meta.title)}\n${replaceYoutubeUrl(
      meta.description
    )}`.slice(0, 250)
  );

  await page.click('text="发布"');
  const result = await page.textContent('div.content-card__status-item ', {
    timeout: 60_000,
  });
  console.log(result);
  // await page.waitForLoadState('networkidle');

  if (closeFlag) {
    await page.close();
    await context.close();
    await browser.close();
    page = null;
  }
  return page;
}

const title = '蜘蛛侠：英雄无归';
const videoInfo = {
  id: 1,
  title,
  category: '欧美电影',
  tag: '动作',
  webpage_url: 'https://movie.douban.com/subject/26933210/',
  description:
    '《蜘蛛侠：英雄无归》是英雄系列三部曲的完结篇，也标志着漫威多元宇宙的正式开启。此次，蜘蛛侠（汤姆·赫兰德 饰）与奇异博士（本尼迪克特·康伯巴奇 饰）继《复联4》后再度联手打响时空混战。蜘蛛侠借助奇异博士操控时空的能力打开了时空通道，引发了前所未见的危机。',
  language: '英文',
};

async function main() {
  for (let index = 1; index < 4; index += 1) {
    videoInfo.id = index;
    videoInfo.title = `${title}(${index})`;
    console.log(videoInfo.title);
    // eslint-disable-next-line no-await-in-loop
    await upload(videoInfo, page, index === 3);
    console.log('上传完成', index);
  }
}

main();

/*
const index = 2;
// for (let index = 3; index < 14; index += 1) {
videoInfo.id = index;
videoInfo.title = `${videoInfo.title}(${index})`;
// eslint-disable-next-line no-await-in-loop
upload(videoInfo).then(() => console.log('上传完成', index)); */
