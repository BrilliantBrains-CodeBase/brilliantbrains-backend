// Queue removed — emails are sent directly without Redis/BullMQ.
// Kept as a stub for compatibility with any existing imports.

function initEmailQueue() {}
function getQueueStats() { return { ready: false, mode: "direct" }; }

module.exports = { initEmailQueue, getQueueStats };
