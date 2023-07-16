const express = require('express');
const cors = require('cors');
const chromium = require('chrome-aws-lambda');

const app = express();
const PORT = process.env.PORT || 8080

app.use(cors()); // Add this line to enable CORS for all routes

app.get('/', async (req, res) => {
    res.send("API is running")
})

// Endpoint to capture the screenshot
app.get('/screenshot', async (req, res) => {
    try {
        const url = req.query.url;
        const fullPage = req.query.full === "true"
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is missing.' });
        }
        const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
        if (!url.match(urlRegex)) {
            return res.status(400).json({ error: 'Invalid URL format.' });
        }
        const browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: "new",
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(url, {
            waitUntil: "networkidle2"
        });
        const screenshot = await page.screenshot({
            fullPage
        });
        await page.close()
        await browser.close()
        res.set('Content-Type', 'image/png')
        res.send(screenshot);
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: 'Failed to capture screenshot.', error: e });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;