const Parser = require('rss-parser');

const parser = new Parser({
    customFields: {
        item: [
            ['media:thumbnail', 'thumbnail'],
            ['media:content', 'mediaContent'],
        ],
    }
});

async function debug() {
    try {
        const feed = await parser.parseURL('https://feeds.bbci.co.uk/sport/formula1/rss.xml');
        console.log('--- FEED ITEM 0 ---');
        console.log(JSON.stringify(feed.items[0], null, 2));
    } catch (e) {
        console.error(e);
    }
}

debug();
