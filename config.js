// @ts-check

/**
 *  默认只有Windows系统浏览器可视化, 方便调试和排错
 *  @type {boolean} */
export const showBrowser = process.platform === "darwin"

/**
 * youtube-dl下载位置。修改则需和u2bili.sh内的下载地址保持一致
 * @type {string}
 */
export const downloadPath = "./downloads/"
/**
 * ! 必填项，从环境变量中读取或直接填写下面参数, 环境变量优先级高
 * 具体如何获取请查看ReadMe.md
 * @type {object}
 */
export const bilibiliCookies = process.env["BILIBILI_COOKIE"]
  ?.split("; ")
  ?.map((i) => i.split("="))
  ?.reduce(
    (a, b) => {
      a[b[0]] = b[1]
      return a
    },
    { FROM_ENV: "true" }
  ) ?? {
  bili_jct: "4ee93bbdfc3ca63a0f5d0feb60452fdb",
  DedeUserID: "164945184",
  DedeUserID__ckMd5: "e34b21fa2993fbbc",
  SESSDATA: "641dfa1c%2C1655378571%2Cc4ca1%2Ac1",
}
