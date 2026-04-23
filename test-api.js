const axios = require('axios');

async function test() {
  console.log('Testing Render API...\n');
  
  try {
    console.log('1. Health check...');
    const health = await axios.get('https://renderrepo-ain0.onrender.com/health');
    console.log('   Status:', health.data.status);
    console.log('   Source:', health.data.source);
    console.log('');
    
    console.log('2. Movie 603 (Matrix)...');
    const movie = await axios.get('https://renderrepo-ain0.onrender.com/movie/603', { timeout: 40000 });
    console.log('   Success:', movie.data.success);
    console.log('   Provider:', movie.data.provider);
    console.log('   Stream URL:', movie.data.streamUrl?.substring(0, 60) + '...');
    console.log('');
    
    console.log('3. TV 1399 S1E1 (Breaking Bad)...');
    const tv = await axios.get('https://renderrepo-ain0.onrender.com/tv/1399/1/1', { timeout: 40000 });
    console.log('   Success:', tv.data.success);
    console.log('   Provider:', tv.data.provider);
    console.log('   Stream URL:', tv.data.streamUrl?.substring(0, 60) + '...');
  } catch (err) {
    console.log('   ERROR:', err.message);
    if (err.response) {
      console.log('   Status:', err.response.status);
      console.log('   Data:', JSON.stringify(err.response.data).substring(0, 200));
    }
  }
}

test();