import puppeteer from "puppeteer";

export const scrapeLinkedInJobs = async ({
  jobTitle = "",
  location = "",
  pages = 1,
  datePosted = "r604800",
} = {}) => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`,
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
      jobTitle
    )}&location=${encodeURIComponent(location)}&f_TPR=${datePosted}`;
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });

    const jobs = [];

    for (let currentPage = 0; currentPage < pages; currentPage++) {
      await page.waitForSelector(".jobs-search__results-list", {
        timeout: 30000,
      });

      await autoScroll(page);

      const pageJobs = await page.evaluate(() => {
        const listings = [];

        const jobCards = document.querySelectorAll(
          ".jobs-search__results-list > li"
        );

        jobCards.forEach((card, index) => {
          try {
            const titleElement =
              card.querySelector(".base-search-card__title") ||
              card.querySelector(".job-card-list__title") ||
              card.querySelector("h3.base-card__title");

            const companyElement =
              card.querySelector(".base-search-card__subtitle") ||
              card.querySelector(".job-card-container__company-name") ||
              card.querySelector("h4.base-card__subtitle");

            const locationElement =
              card.querySelector(".job-search-card__location") ||
              card.querySelector(".job-card-container__metadata-item") ||
              card.querySelector(".base-card__metadata span");

            const linkElement =
              card.querySelector("a.base-card__full-link") ||
              card.querySelector("a.job-card-container__link") ||
              card.querySelector("a.base-card__link");

            const dateElement =
              card.querySelector(".job-search-card__listdate") ||
              card.querySelector("time") ||
              card.querySelector(".job-card-container__footer-item") ||
              card.querySelector(".base-search-card__metadata [datetime]") ||
              card.querySelector(".base-card__metadata time");

            const dateAttr = dateElement?.getAttribute("datetime");

            if (titleElement) {
              const url = linkElement?.href;

              let jobId = null;
              if (url) {
                try {
                  const urlObj = new URL(url);
                  jobId =
                    urlObj.searchParams.get("currentJobId") ||
                    urlObj.pathname.split("/").pop() ||
                    url.match(/\/view\/(\d+)\/?/)?.[1];
                } catch (e) {
                  console.error("Error parsing URL:", e);
                }
              }

              let datePosted = "Not specified";

              if (dateAttr) {
                datePosted = new Date(dateAttr).toISOString();
              } else if (dateElement) {
                datePosted = dateElement.textContent.trim();
              }

              listings.push({
                jobTitle: titleElement.textContent.trim(),
                company: companyElement
                  ? companyElement.textContent.trim()
                  : "Not specified",
                location: locationElement
                  ? locationElement.textContent.trim()
                  : "Not specified",
                datePosted,
                url,
                jobId,
              });
            }
          } catch (e) {
            console.error(`Error parsing job card ${index}:`, e);
          }
        });

        return listings;
      });

      jobs.push(...pageJobs);

      if (currentPage < pages - 1) {
        const hasNextButton = await page.evaluate(() => {
          const nextButton = document.querySelector(
            'button[aria-label="Next"]'
          );
          return !!nextButton && !nextButton.disabled;
        });

        if (hasNextButton) {
          await Promise.all([
            page.click('button[aria-label="Next"]'),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        } else {
          break;
        }
      }
    }

    const uniqueJobs = jobs;

    return uniqueJobs;
  } catch (error) {
    console.error("Error during scraping:", error);
    throw error;
  } finally {
    await browser.close();
  }
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

export default scrapeLinkedInJobs;
