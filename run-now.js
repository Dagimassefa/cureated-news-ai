require('dotenv').config();
const NewsCurateJob = require('./src/jobs/news-curate');

async function runNow() {
  try {
    const job = new NewsCurateJob();
    const result = await job.run();
    console.log('Job completed successfully:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Job failed:', error);
    process.exit(1);
  }
}

runNow();