const https = require('https');

https.get('https://feeds.bbci.co.uk/sport/formula1/rss.xml', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const firstItem = data.split('<item>')[1].split('</item>')[0];
        console.log('--- RAW BBC ITEM ---');
        console.log(firstItem);
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
