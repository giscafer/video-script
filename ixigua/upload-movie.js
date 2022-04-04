/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { firefox as browserCore } from 'playwright';
import { fileURLToPath } from 'url';
import { moviePath, showBrowser, userAgent } from '../global-config.js';
import { parseCookieObject, replaceYoutubeUrl } from '../shared/utils.js';
import { cookieMap } from './config.js';

const title = '尼罗河上的惨案';
const meta = {
  id: 2,
  title,
  category: '欧美电影',
  tag: '剧情',
  webpage_url: 'https://movie.douban.com/subject/27203644/',
  description:
    '故事继续聚焦在上流社会的秘事，大侦探波洛（肯尼思·布拉纳 Kenneth Branagh 饰）在埃及度假期间， 卷入到了一场危险的三角关系之中，他在察觉到这趟旅程中不寻常的味道之后，登上了那条驶往阴谋和死亡的船。',
  language: '英文',
};

console.log('process.argv=', process.argv);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log('moviePath=', join(__dirname, moviePath));

function getMetaPathFromArgs() {
  return process.argv.slice(2, 4);
}

// eslint-disable-next-line prefer-const
let [videoPath] = getMetaPathFromArgs();

const homePage = 'https://studio.ixigua.com/upload?from=post_article';

let browser = null;
let context = null;
let page = null;

async function upload(pageInstance, closeFlag = false) {
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
    await Promise.all([
      page.goto(homePage, {
        waitUntil: 'domcontentloaded',
        timeout: 20 * 1000,
      }),
      page.waitForResponse(/\/OK/), // fix：库未加载完的无效点击
    ]);
  } catch (error) {
    // 不知道为啥会超时，但不影响上传
    if (error.name === 'TimeoutError') {
      console.log('网络问题导致页面加载超时...');
    }
  }

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('div.byte-upload-trigger'),
  ]);

  if (!videoPath) {
    const ext = ['mp4', 'mkv'].find((realExt) =>
      existsSync(join(__dirname, `${moviePath}${meta.id}.${realExt}`))
    );
    if (!ext) {
      console.error(
        `无法在${moviePath}找到${meta.id}命名的视频文件，上传未成功。`
      );
      process.exit(-1);
    }
    // videoPath = `./ffmpegOutput/${meta.id}.${ext}`;
    videoPath = join(__dirname, `${moviePath}${meta.id}.${ext}`).toString();
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

async function main() {
  for (let index = 6; index < 13; index += 1) {
    console.log('index=', index);
    meta.id = index;
    meta.title = `${title}(${index})`;
    // eslint-disable-next-line no-await-in-loop
    await upload(page, index === 12);
    console.log('上传完成', index);
  }
}

main();
/*
const index = 2;
// for (let index = 3; index < 14; index += 1) {
meta.id = index;
meta.title = `${meta.title}(${index})`;
// eslint-disable-next-line no-await-in-loop
upload().then(() => console.log('上传完成', index)); */
