const axios = require('axios');

async function test() {
  console.log('Testing vsembed.ru for movie 603...\n');
  
  try {
    // Test vsembed - this is what vidsrc.to iframes
    const r = await axios.get('https://vsembed.ru/embed/movie/603/', { 
      timeout: 15000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://vidsrc.to/',
      },
    });
    
    const data = r.data;
    const matches = data.match(/https:\/\/[^"'\s]+\.m3u8[^"'\s]*/g);
    console.log('vsembed.ru m3u8 links:', matches ? matches.length : 0);
    
    if (matches && matches.length > 0) {
      console.log('First m3u8:', matches[0].substring(0, 100));
    } else {
      console.log('Response:', data.substring(0, 1500));
    }
    
  } catch(e) {
    console.log('Error:', e.message);
  }
}

test();