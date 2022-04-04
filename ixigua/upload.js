/* eslint-disable no-console */
import { existsSync, readFileSync } from 'fs';
import { firefox as browserCore } from 'playwright';
import { downloadPath, showBrowser, userAgent } from '../global-config.js';
import translate from '../shared/translate.js';
import { parseCookieObject } from '../utils.js';
import { cookieMap } from './config.js';

const videoInfo = {
  category: '生活',
  language: '英文',
  category_level: 5,
  tag: '生活记录',
  description: 'How to make GYO | Quick Feeds',
};

console.log('process.argv.length=', process.argv);

function getMetaPathFromArgs() {
  if (process.argv.length < 3) {
    console.error('ixigua 缺少参数，请传入视频源信息文件');
    process.exit(-1);
  }
  return process.argv.slice(2, 4);
}

// eslint-disable-next-line prefer-const
let [metaPath, videoPath] = getMetaPathFromArgs();
const meta = JSON.parse(readFileSync(metaPath));

const homePage = 'https://studio.ixigua.com/upload?from=post_article';

async function main() {
  videoInfo.title = meta.title;

  if (videoInfo.language === '英文') {
    const zhTitle = await translate(meta.title);
    console.log('videoInfo.title=', videoInfo.title);
    videoInfo.title = zhTitle;
  }

  const browser = await browserCore.launch({
    headless: !showBrowser,
  });
  const context = await browser.newContext({
    userAgent,
    storageState: {
      origins: [
        {
          origin: 'https://studio.ixigua.com',
          localStorage: [
            {
              name: 'SHOW_GUIDE',
              value: '1',
            },
          ],
        },
      ],
    },
  });
  context.addCookies(parseCookieObject(cookieMap, '.ixigua.com'));
  const page = await context.newPage();
  try {
    await Promise.all([
      page.goto(homePage, {
        waitUntil: 'domcontentloaded',
        timeout: 60 * 1000,
      }),
      page.waitForResponse(/\/OK/), // fix：库未加载完的无效点击
    ]);
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log('网络问题导致页面加载超时...');
    }
  }

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('.byte-upload-trigger-area'),
  ]);

  if (!videoPath) {
    const ext = ['webm', 'mp4', 'mkv'].find((ext1) =>
      existsSync(`${downloadPath}${meta.id}.${ext1}`)
    );
    if (!ext) {
      console.error(
        `无法在${downloadPath}找到${meta.id}命名的视频文件，上传未成功。`
      );
      process.exit(-1);
    }
    videoPath = `${downloadPath}${meta.id}.${ext}`;
  }
  await fileChooser.setFiles(videoPath);
  // 等待视频上传完成
  await page.waitForSelector('svg.success', { timeout: 120 * 1000 });

  // 输入视频标题
  await page.click('div[data-editor="title"]');
  await page.keyboard.type(videoInfo.title);

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
  await page.click('div.footer>button.red');

  // 转载链接
  await page.click('text="转载"');
  await page.fill('input[placeholder^=转载内容应]', meta.webpage_url);

  // 创建标签
  await page.click('input[placeholder="输入合适的话题"]');
  await page.keyboard.type(meta.uploader);
  await page.keyboard.down('Enter');
  // await page.keyboard.type(videoInfo.tag)
  // await page.keyboard.down("Enter")

  // -----更多选项(这里会抖动，暂时不知道原因)--------
  // 视频描述
  await page.click('div.video-form-fold>div.fold-title');
  await page.click('div[data-editor="abstract"]');
  await page.keyboard.type(
    `${videoInfo.description}\n${meta.description}`.slice(0, 250)
  );
  // 添加字幕
  await page.click('text="添加字幕"');
  await page.waitForSelector('div.add-caption-modal-button');
  await page.click('text="立即生成"');
  await page.waitForSelector('div.choose-language-modal-select');
  await page.click('div.byte-select-view-placeholder');
  await page.click(`text="${videoInfo.language}"`);
  await page.click(
    'div.choose-language-modal-footer>div.choose-language-modal-okButton'
  );
  // 等待字幕文件生成
  await page.waitForSelector('div.add-caption-modal-textContainer', {
    timeout: 120 * 1000,
  });

  await page.click(
    'div.add-caption-modal-buttonContainer>div.add-caption-modal-okButton'
  );

  // 等待视频发布成功
  await page.waitForSelector('div.m-xigua-upload>div.bg', {
    timeout: 20 * 1000,
  });
  await page.click('text="发布"');
  const result = await page.textContent('div.content-card__status-item ', {
    timeout: 60_000,
  });
  console.log(result);
  await page.waitForLoadState('networkidle');

  await page.close();
  await context.close();
  await browser.close();
}

main();
