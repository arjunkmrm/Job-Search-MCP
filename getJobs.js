import scrapeLinkedInJobs from './scrapeLinkedInJobs.js';

async function getReactJobs() {
  try {
    const jobs = await scrapeLinkedInJobs({
      jobTitle: "ReactJS",
      location: "Dhaka, Bangladesh",
      datePosted: "r604800", // Last 7 days to get more results
      pages: 2, // Increasing pages to get more results
    });
    console.log(JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error('Error fetching jobs:', error);
  }
}

getReactJobs(); 