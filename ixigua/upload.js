import { showBrowser, downloadPath, userAgent } from "../global-config.js"
import { cookieMap } from "./config.js"
import { firefox as browserCore } from "playwright"
import { existsSync, readFileSync } from "fs"
import { parseCookieObject } from "../utils.js"

console.log("process.argv.length=", process.argv)
var [metaPath, videoPath] = getMetaPathFromArgs()
const meta = JSON.parse(readFileSync(metaPath))

function getMetaPathFromArgs() {
  if (process.argv.length < 3) {
    console.error("ixigua 缺少参数，请传入视频源信息文件")
    process.exit(-1)
  }
  return process.argv.slice(2, 4)
}

const homePage = "https://studio.ixigua.com/upload?from=post_article"

const videoInfo = {
  category: "生活",
  category_level: 5,
  tag: "生活记录",
  description: "How to make GYO | Quick Feeds",
}

async function main() {
  const browser = await browserCore.launch({
    headless: !showBrowser,
  })
  const context = await browser.newContext({
    userAgent,
    storageState: {
      origins: [
        {
          origin: "https://studio.ixigua.com",
          localStorage: [
            {
              name: "SHOW_GUIDE",
              value: "1",
            },
          ],
        },
      ],
    },
  })
  context.addCookies(parseCookieObject(cookieMap, ".ixigua.com"))
  const page = await context.newPage()
  try {
    await Promise.all([
      page.goto(homePage, {
        waitUntil: "domcontentloaded",
        timeout: 60 * 1000,
      }),
      page.waitForResponse(/\/OK/), //Fix：库未加载完的无效点击
    ])
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.log("网络问题导致页面加载超时...")
    }
  }

  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.click(".byte-upload-trigger-area"),
  ])

  if (!videoPath) {
    const ext = ["webm", "mp4", "mkv"].find((ext) =>
      existsSync(`${downloadPath}${meta["id"]}.${ext}`)
    )
    if (!ext) {
      console.error(
        `无法在${downloadPath}找到${meta["id"]}命名的视频文件，上传未成功。`
      )
      process.exit(-1)
    }
    videoPath = `${downloadPath}${meta["id"]}.${ext}`
  }
  await fileChooser.setFiles(videoPath)
  // 等待视频上传完成
  await page.waitForSelector("svg.success", { timeout: 120 * 1000 })

  await page.click('div[data-editor="title"]')
  await page.keyboard.type(meta["title"])

  await page.click('text="上传封面"')
  await page.waitForSelector("div.byte-slider.show-img-preview")
  await page.click('text="下一步"')
  await page.waitForSelector('text="确定"', { timeout: 10 * 1000 })
  await page.click('text="确定"')
  await page.waitForSelector('text="完成后无法继续编辑，是否确定完成？"')
  await page.click("div.footer>button.red")

  await page.click('text="转载"')
  await page.fill("input[placeholder^=转载内容应]", meta["webpage_url"])

  // 创建标签
  await page.click('input[placeholder="输入合适的话题"]')
  await page.keyboard.type(meta["uploader"])
  await page.keyboard.down("Enter")
  // await page.keyboard.type(videoInfo.tag)
  // await page.keyboard.down("Enter")

  //更多选项(这里会抖动，暂时不知道原因)
  // await page.click('text="(简介、互动贴纸、合集、章节、字幕等)"')
  // // 视频描述
  // await page.click("#placeholder-abstract")
  // await page.keyboard.type(
  //   `${videoInfo.description}\n${meta["description"]}`.slice(0, 250)
  // )
  await page.waitForSelector("div.m-xigua-upload>div.bg", {
    timeout: 20 * 1000,
  })
  await page.click('text="发布"')
  let result = await page.textContent("div.content-card__status-item ", {
    timeout: 60_000,
  })
  console.log(result)
  await page.waitForLoadState("networkidle")

  await page.close()
  await context.close()
  await browser.close()
}

main()
