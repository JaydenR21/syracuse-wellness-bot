const http = require('http');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const userData = JSON.parse(body);
                const userMessageText = userData.chatMessage || "Hello";

                // Pulls your secret API key safely out of Render's environment vault
                const apiKey = process.env.ANTHROPIC_API_KEY;

                const response = await fetch('https://anthropic.com', {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 150,
                        system: "You are the virtual front-desk assistant for Syracuse Acupuncture Clinic. Your sole metric of success is capturing the user's name and phone number and placing a consultation hold on an open calendar slot. If the user asks about pricing, state that treatments typically land around $120 depending on their unique goals. Keep answers under 2 sentences.",
                        messages: [{ role: 'user', content: userMessageText }]
                    })
                });

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error.message);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: data.content.text }));

            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Backend Active on Port ${PORT}`);
});
