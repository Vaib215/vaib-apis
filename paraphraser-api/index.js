import express, { json } from 'express';
import { launch } from 'puppeteer';

const app = express();
app.use(json());

// Browser pool to handle concurrent requests
const browserPromise = launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--single-process',
    '--no-zygote',
  ],
  headless: true, // Use `true` instead of "new" to launch headless mode
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});

// Endpoint to handle paraphrasing requests
app.post('/paraphrase', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text input is required.' });
  }

  let browser;
  try {
    browser = await browserPromise;
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://quillbot.com', ['clipboard-read']);
    const paraphrasedText = await paraphraseText(text, browser);
    res.json({ paraphrasedText: paraphrasedText.replace("With the help of QuillBot's paraphraser, you can rapidly and effectively rework and rephrase your content by taking your sentences and making adjustments!", "") });
  } catch (err) {
    console.error('Error during paraphrasing:', err);
    res.status(500).json({ error: 'An error occurred during paraphrasing.' });
  }
});

async function paraphraseText(inputText, browser) {
  const page = await browser.newPage();
  await page.goto('https://quillbot.com', {
    waitUntil: 'networkidle2',
  });

  const wordLimit = 100;
  const inputWords = inputText.split(' ');
  const chunks = [];

  while (inputWords.length) {
    chunks.push(inputWords.splice(0, wordLimit).join(' '));
  }

  let paraphrasedText = '';

  for (const chunk of chunks) {
    try {
      await page.click("[role='textbox']");
      await page.evaluate(() => {
        document.execCommand('selectAll', false, null);
        document.execCommand('delete');
      });

      await page.type("[role='textbox']", chunk);
      await page.click("#pphr-view-input-panel-footer-box > div.MuiGrid-root.MuiGrid-item > div > button");
      await page.click("#pphr-view-input-panel-footer-box > div.MuiGrid-root.MuiGrid-item > div > button");
      await page.waitForSelector("[aria-label='Copy Full Text']");
      await page.click("[aria-label='Copy Full Text']");

      const chunkParaphrasedText = await page.evaluate(() => {
        return navigator.clipboard.readText();
      });

      paraphrasedText += chunkParaphrasedText;
    } catch (err) {
      console.error('Error during paraphrasing:', err);
      throw err; // Re-throw the error to be caught in the main error handler
    }
  }

  await page.close();
  return paraphrasedText;
}

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
