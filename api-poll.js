import { spawn } from "child_process";
import fetch from "node-fetch";
import { writeFile } from "fs/promises";
import { Agent } from "https";
import { launch } from "puppeteer";

async function sleep(ms) {
   await new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
   });
}

async function getPageHtml(url, useBrowser) {
   if (useBrowser) {
      const browser = await launch({ headless: false });

      const page = await browser.newPage();

      await page.goto(url, {
         timeout: 60000
      });

      let html = await page.content();

      await browser.close();

      return html;
   } else {
      const res = await fetch(url, {
         headers: {
            authority: "in.bookmyshow.com",
            method: "GET",
            path: "/buytickets/srk-miraj-cinemas-coimbatore/cinema-coim-SRMJ-MT/20230428",
            scheme: "http",
            accept:
               "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "max-age=0",
            cookie:
               "bmsId=1.1440895699.1682652687779; Rgn=%7CCode%3DCOIM%7Ctext%3DCoimbatore%7Cslug%3Dcoimbatore%7C; _cfuvid=i.0qCgbd_SBPpovfrpOr275LcoyiT0L79uOPPaInzhI-1682652687985-0-604800000; _gcl_au=1.1.222644364.1682652689; APPDETAILS_ALL=%7B%22FB%22%3A%22%7CFB_APPID%3D165665113451029%7CFB_PRIVILEGES%3Demail%2Cpublic_profile%2Cuser_birthday%2Cuser_gender%7CAPPID_LIST%3D165665113451029%7CCHECKLIST%3DY%7CFB_URL%3Dhttps%3A%2F%2Fgraph.facebook.com%2Fv3.2%7C%22%2C%22PLUS%22%3A%22%7CGOOGLELOGIN_ACTION%3Dhttp%3A%2F%2Fschemas.google.com%2FAddActivity%7CGOOGLELOGIN_CLIENTID%3D990572338172-iibth2em4l86htv30eg1v44jia37fuo5.apps.googleusercontent.com%7CGOOGLELOGIN_PRIVILEGES%3Dprofile%26nbsp%3B%20openid%26nbsp%3Bemail%7C%22%7D; _ga=GA1.1.1235418670.1682652689; _fbp=fb.1.1682652689647.625286362; WZRK_G=cf90a6506b51476d8b37f30f3e42c270; __gads=ID=2f293cb5253bbd04:T=1682652690:S=ALNI_Mbqbo9BXu_j1_Dw5La-r4VEHuyoYg; __gpi=UID=00000bfee213b764:T=1682652690:RT=1682652690:S=ALNI_MbmqWTU_eCoZIP7swVfwhNy_Fpnsg; __cf_bm=iB0MOE0FEK1pCR5GiNRiEkZvBKuLh90CVg_UlE4TMiY-1682652691-0-AQTTK32U/ne/otHd3hfL2h2kHOHzcfhoKKnlRi87Y3no2+ZdDEKbm1HrYD75veAi0ijcqE4x/0EBc+F1QrOulU40oEegFwSjXn02RUa/IH2TWYWtMzjt+1C+7x1wvX21d1iJ7nkZo1KeFJzwG/N+RMI=; tvc_vid=11682652691196; AMP_TOKEN=%24NOT_FOUND; tvc_bmscookie=GA1.2.1235418670.1682652689; tvc_bmscookie_gid=GA1.2.2103303398.1682652692; _ga_84T5GTD0PC=GS1.1.1682652689.1.1.1682652697.52.0.0; _uetsid=2a2e4860e57511ed9530fb060aa7b009; _uetvid=2a2f3a30e57511edba6a471334c472b4; WZRK_S_RK4-47R-98KZ=%7B%22p%22%3A2%2C%22s%22%3A1682652689%2C%22t%22%3A1682652817%7D",
            "sec-ch-ua": `"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"`,
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": `"Windows"`,
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "user-agent":
               "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
         },
         method: "GET",
      });

      const contentType = res.headers.get("content-type");

      if (!contentType.includes("text/html")) {
         throw new Error(`Expected HTML response. Got ${contentType}`);
      }

      const html = await res.text();

      return html;
   }
}

async function requestBms(movieToCheck, showTime) {
   const html = await getPageHtml(
      "https://in.bookmyshow.com/buytickets/srk-miraj-cinemas-coimbatore/cinema-coim-SRMJ-MT/20230618",
      true
   );

   const dataJsonString = html.substring(
      html.indexOf(`"{`, html.indexOf("UAPI")),
      html.indexOf(`")`, html.indexOf("UAPI")) + 1
   );

   let dataJson = JSON.parse(dataJsonString);

   if (typeof dataJson === "string") dataJson = JSON.parse(dataJson);

   const showDetails = dataJson.ShowDetails[0];
   

   const movie = showDetails.Event.find(x => x.EventTitle === movieToCheck);

   const show = movie.ChildEvents[0].ShowTimes.find(x => x.ShowTime === showTime);

   const categoryGold = show.Categories.find(x => x.PriceDesc === "3D GOLD" || x.PriceDesc === "GOLD");

   return {
      movieName: movie.EventTitle,
      showTime: show.ShowTime,
      goldSeatsAvailable: categoryGold.AvailStatus,
      currentTime: new Date().toLocaleTimeString(),
   };
}

async function poll(movieToCheck, showTime, delay) {
   try {
      while (true) {
         const response = await requestBms(movieToCheck, showTime);
         console.table(response);
         if (response.goldSeatsAvailable !== "0") {
            playMusic();
            return "Gold seats found.";
         }
         await sleep(delay);
      }
   } catch (error) {
      playMusic();
      throw error;
   }
}

function playMusic() {
   spawn("start", ["audio.mp3"], {
      detached: true,
      shell: true,
      stdio: ["ignore", "ignore", "ignore"],
   }).on("error", e => {
      console.log(e);
   });
}

poll("Por Thozhil", "07:10 PM", 2000).then(console.log).catch(console.error);
