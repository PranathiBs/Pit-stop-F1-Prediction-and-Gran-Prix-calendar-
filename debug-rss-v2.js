const Parser = require('rss-parser');

const parser = new Parser({
    customFields: {
        item: [
            ['media:thumbnail', 'thumbnail'],
            ['media:content', 'mediaContent', { keepArray: true }],
            ['enclosure', 'enclosure'],
        ],
    }
});

async function debug() {
    try {
        const feed = await parser.parseURL('https://www.skysports.com/rss/12433');
        console.log('--- SKY SPORTS FEED ITEM 0 ---');
        console.log(JSON.stringify(feed.items[0], null, 2));
    } catch (e) {
        console.error('Sky Error:', e);
    }

    try {
        const feed = await parser.parseURL('https://www.autosport.com/rss/f1/');
        console.log('\n--- AUTOSPORT FEED ITEM 0 ---');
        console.log(JSON.stringify(feed.items[0], null, 2));
    } catch (e) {
        console.error('Autosport Error:', e);
    }
}

debug();
