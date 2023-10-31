import { spawn } from "child_process";
import { launch } from "puppeteer";

async function sleep(ms) {
   await new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
   });
}

async function check() {
   const browser = await launch({ headless: false });
   const page = await browser.newPage();

   await page.goto(
      "https://in.bookmyshow.com/buytickets/srk-miraj-cinemas-coimbatore/cinema-coim-SRMJ-MT/20230310"
   );

   let popupClicked = false;

   const checkPage = async () => {
      if (!popupClicked) {
         await page.waitForSelector("#wzrk-confirm");
         await page.click("#wzrk-confirm");
         popupClicked = true;
      }

      await page.hover("[data-session-id='SRMJ_16694']");

      // await sleep(2000);

      const requiredShow = await page.evaluate(() => {
         const show = document.querySelector(
            "#category-tooltip > div > div._sold.category-3 > span"
         );

         return show.textContent;
      });

      return requiredShow;
   };

   while (true) {
      try {
         const result = await checkPage();

         console.log(new Date().toLocaleTimeString(), result);

         if (result !== "Sold Out") {
            spawn("start", ["audio.mp3"], {
               detached: true,
               shell: true,
               stdio: ["ignore", "ignore", "ignore"],
            }).on("error", e => {
               console.log(e);
            });
            await browser.close();
            break;
         }

         await page.reload();
      } catch (error) {
         console.error(error);
         spawn("start", ["audio.mp3"], {
            detached: true,
            shell: true,
            stdio: ["ignore", "ignore", "ignore"],
         }).on("error", e => {
            console.log(e);
         });
         await browser.close();
         break;
      } finally {
      }
   }
}

check().catch(console.error);
