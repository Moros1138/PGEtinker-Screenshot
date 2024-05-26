import { configDotenv } from "dotenv";
import puppeteer from "puppeteer";
import express from "express";
import morgan from "morgan";

configDotenv();

const app = express();
const port = process.env.PORT || 6969;
const mode = process.env.MODE || 'production';

app.use(express.json({ limit: "20mb"}));
app.use(morgan("combined"));

function log(...args)
{
    if(mode === "production")
        return;
    
    console.log(...args);
}

app.post("/", async(request, response) =>
{
    if(!request.body.html)
    {
        response.statusCode = 400;
        response.send({
            statusCode: 400,
            message: "Missing required parameter",
        });
        return;
    }
    
    // open the browser
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--autoplay-policy=user-gesture-required',
            '--mute-audio',
        ],
    });

    // open the tab
    const page = await browser.newPage();
    log("new page");
    // set the page's content
    await page.setContent(request.body.html);
    log("set html content");

    try
    {
        // just a delay, gotta give PGE time to settle in
        await new Promise((resolve) => setTimeout(() => resolve(), 5000));
        log("sleep 5 seconds");

        // wait 10 seconds, if the browser is still running, kill the browser
        setTimeout(async() =>
        {
            await browser.close();
            console.log("killed browser due to timeout");
        }, 10000);
        
        // get the PGE canvas
        const canvas = await page.$('canvas');
        log("get the canvas");
        // get the size of the PGE canvas
        const boundingBox = await canvas.boundingBox();
        log("get bounding box");
        // change the size of the viewport to match the PGE canvas size
        await page.setViewport({
            width: boundingBox.width,
            height: boundingBox.height
        });
        log("resize window to size of bounding box");
        // shutter --- click 
        const screenshot = await page.screenshot({
            type: "png",
            encoding: "binary",
        });
        log("take screenshot");
        // close the tab
        await page.close();
        log("close tab");
        // close the browser
        await browser.close();
        log("close browser");
        
        response.statusCode = 200;
        response.header("Content-Type", "image/png");
        response.send(screenshot);
    }
    catch(e)
    {
        response.statusCode = 400;
        response.send(null);
    }

});

app.listen(port, () =>
{
    console.log(`Screenshotter listening on port ${port}`);
});
