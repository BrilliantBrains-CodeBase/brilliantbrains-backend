/**
 * Dashboard DTO
 *
 * Transforms raw service output into the stable public API contract.
 * Keeps controller thin and makes the response shape explicit + testable.
 *
 * @typedef {Object} DashboardResponse
 * @property {import('../services/dashboard.service').Overview}         overview
 * @property {import('../services/dashboard.service').CRMMetrics}       crm
 * @property {import('../services/dashboard.service').CareersMetrics}   careers
 * @property {import('../services/dashboard.service').BlogMetrics}      blogs
 * @property {import('../services/dashboard.service').UserMetrics}      users
 * @property {import('../services/dashboard.service').TestimonialMetrics} testimonials
 * @property {import('../services/dashboard.service').NewsletterMetrics} newsletter
 * @property {import('../services/dashboard.service').MediaMetrics}     media
 * @property {Array}                                                    activities
 * @property {import('../services/dashboard.service').PendingActions}   pendingActions
 * @property {import('../services/dashboard.service').SystemHealth}     systemHealth
 * @property {Array<{key:string,type:string,title:string,module:string,value:*}>} widgets
 */

/**
 * @param {object} metrics - raw output from getDashboardMetrics()
 * @returns {DashboardResponse}
 */
function toDashboardResponse(metrics) {
  return {
    overview:      metrics.overview,
    crm:           metrics.crm,
    careers:       metrics.careers,
    blogs:         metrics.blogs,
    users:         metrics.users,
    testimonials:  metrics.testimonials,
    newsletter:    metrics.newsletter,
    media:         metrics.media,
    activities:    metrics.activities,
    pendingActions: metrics.pendingActions,
    systemHealth:  metrics.systemHealth,
    widgets:       metrics.widgets,
  };
}

module.exports = { toDashboardResponse };
