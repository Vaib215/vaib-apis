import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
const PORT = 3000;
let browser = null;
const startBrowser = async () => {
    browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
}

app.use(cors()); // Add this line to enable CORS for all routes

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
        if (!browser) await startBrowser()
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(url, {
            waitUntil: "networkidle2"
        });
        const screenshot = await page.screenshot({
            fullPage
        });
        page.close()
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
