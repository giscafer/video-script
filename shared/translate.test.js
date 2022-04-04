// eslint-disable-next-line import/extensions
import translate from './translate.js';

// describe('translate', () => {});

async function test() {
  const zhTitle = await translate('How are you');
  console.log('title=', zhTitle);
}

test();
