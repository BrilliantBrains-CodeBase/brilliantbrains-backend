const { logger } = require("../../../utils/logger");

let _queue = null;
let _worker = null;
let _isReady = false;

async function initEmailQueue() {
  if (!process.env.REDIS_URL) {
    logger.warn("[EmailQueue] REDIS_URL not set — running in direct-send mode (no queue)");
    return;
  }

  try {
    const { Queue, Worker } = require("bullmq");
    const IORedis = require("ioredis");

    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    connection.on("error", (err) => {
      logger.error(`[EmailQueue] Redis error: ${err.message}`);
    });

    _queue = new Queue("email-queue", { connection });

    _worker = new Worker(
      "email-queue",
      async (job) => {
        const { sendMailDirect } = require("../services/emailService");
        await sendMailDirect(job.data);
      },
      {
        connection,
        concurrency: 5,
        limiter: { max: 50, duration: 60000 }, // max 50 emails/min
      }
    );

    _worker.on("completed", (job) => {
      logger.info(`[EmailQueue] job ${job.id} completed — event=${job.data.eventType}`);
    });

    _worker.on("failed", (job, err) => {
      logger.error(`[EmailQueue] job ${job?.id} failed — ${err.message}`);
    });

    _isReady = true;
    logger.info("[EmailQueue] BullMQ queue initialized with Redis");
  } catch (err) {
    logger.error(`[EmailQueue] failed to initialize — ${err.message}. Falling back to direct-send.`);
    _isReady = false;
  }
}

async function enqueueEmail(jobData) {
  if (!_isReady || !_queue) {
    const { sendMailDirect } = require("../services/emailService");
    return sendMailDirect(jobData);
  }

  return _queue.add("send-email", jobData, {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  });
}

function getQueueStats() {
  return {
    ready: _isReady,
    mode: _isReady ? "bullmq" : "direct",
  };
}

module.exports = { initEmailQueue, enqueueEmail, getQueueStats };
