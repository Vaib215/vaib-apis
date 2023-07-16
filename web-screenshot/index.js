import express from 'express';
import puppeteer from 'puppeteer';
import chromium from "@sparticuz/chromium";
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors()); // Add this line to enable CORS for all routes

app.get('/', async(req,res)=>{
    res.send("API is running")
}

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
        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath:
              process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath),
            headless: "new",
            ignoreHTTPSErrors: true,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--single-process",
            ],
            ignoreDefaultArgs: ["--disable-extensions"],
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

export default app;
