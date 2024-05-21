import { configDotenv } from "dotenv";
import puppeteer from "puppeteer";
import express from "express";
import morgan from "morgan";

configDotenv();

const app = express();
const port = process.env.PORT || 6969;

app.use(express.json({ limit: "20mb"}));
app.use(morgan("combined"));

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
    const browser = await puppeteer.launch();
    
    // open the tab
    const page = await browser.newPage();
    
    // set the page's content
    await page.setContent(request.body.html);

    // just a delay, gotta give PGE time to settle in
    await new Promise((resolve) => setTimeout(() => resolve(), 5000));
    
    // get the PGE canvas
    const canvas = await page.$('canvas');
    
    // get the size of the PGE canvas
    const boundingBox = await canvas.boundingBox();
    
    // change the size of the viewport to match the PGE canvas size
    await page.setViewport({
        width: boundingBox.width,
        height: boundingBox.height
    });
    
    // shutter --- click 
    const screenshot = await page.screenshot({
        type: "png",
        encoding: "binary",
    });
    
    response.statusCode = 200;
    response.header("Content-Type", "image/png");
    response.send(screenshot);
});

app.listen(port, () =>
{
    console.log(`Screenshotter listening on port ${port}`);
});
