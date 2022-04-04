import { replaceYoutubeUrl } from './utils.js';

const str = `
How to make GYO | Quick Feeds
Watch Part Two: https://www.youtube.com/watch?v=if1znv_tkY4

The unlicensed BBC documentary based on the bestseller "Baby goes walk about" `;

console.log('replaceYoutubeUrl(str)=', replaceYoutubeUrl(str));
