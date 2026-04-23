const fs = require('fs');
const axios = require('axios');
const sodium = require('libsodium-wrappers');

// Mock browser environment for Go WASM
global.window = global;
global.performance = { now: () => Date.now() };
global.crypto = require('crypto');
global.document = {
    createElement: (tag) => ({ src: '', onload: null }),
    getElementById: () => null,
    body: { appendChild: () => {} },
    head: { appendChild: () => {} }
};

// Load Go Polyfill
const scriptContent = fs.readFileSync('vidlink_script.js', 'utf8');
eval(scriptContent);

async function extract(tmdbId, season = null, episode = null) {
    const isTv = season !== null && episode !== null;
    const type = isTv ? 'TV Show' : 'Movie';
    console.log(`[*] Extracting Vidlink.pro for ${type} - ID: ${tmdbId}${isTv ? ` S${season} E${episode}` : ''}`);
    
    // 1. Initialize sodium
    await sodium.ready;
    global.sodium = sodium;
    
    // 2. Initialize Go WASM
    const go = new globalThis.Dm();
    const wasmBuffer = fs.readFileSync('vidlink_fu.wasm');
    const { instance } = await WebAssembly.instantiate(wasmBuffer, go.importObject);
    go.run(instance).catch(e => {}); // Non-blocking run

    // Wait for registration
    await new Promise(r => setTimeout(r, 500));

    if (typeof global.getAdv !== 'function') {
        throw new Error("Failed to register getAdv function");
    }

    // 3. Generate token
    const token = global.getAdv(tmdbId.toString());
    console.log(`[*] Generated Token: ${token}`);

    // 4. Fetch API
    let url;
    if (isTv) {
        url = `https://vidlink.pro/api/b/tv/${token}/${season}/${episode}?multiLang=0`;
    } else {
        url = `https://vidlink.pro/api/b/movie/${token}?multiLang=0`;
    }
    
    console.log(`[*] Fetching: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': isTv ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}` : `https://vidlink.pro/movie/${tmdbId}`,
                'Origin': 'https://vidlink.pro'
            }
        });

        const data = response.data;
        console.log("\n[+] SUCCESS! Extracted Data:");
        // console.log(JSON.stringify(data, null, 2));

        if (data.stream && data.stream.playlist) {
            console.log(`\n[!] Stream URL: ${data.stream.playlist}`);
        }

        return data;
    } catch (e) {
        console.error(`\n[!] Extraction failed: ${e.message}`);
        if (e.response) {
            console.error(`[*] Status: ${e.response.status}`);
            console.error(`[*] Content: ${e.response.data}`);
        }
    }
}

const args = process.argv.slice(2);
if (args[0]) {
    extract(args[0], args[1], args[2]);
} else {
    console.log("Usage: node vidlink_extractor.js <tmdbId> [season] [episode]");
    console.log("Example Movie: node vidlink_extractor.js 1317288");
    console.log("Example TV: node vidlink_extractor.js 1399 1 1");
}
