export function parseCookieObject(cookieMap, domain = ".bilibili.com") {
  return Object.keys(cookieMap).map((k) => {
    return {
      domain,
      path: "/",
      name: k,
      value: cookieMap[k],
    }
  })
}

export function download(url, output) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      res.pipe(fs.createWriteStream(output))
      res.on("end", resolve)
      res.on("error", reject)
    })
  })
}
