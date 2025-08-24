export const rateLimitMiddleware = {
  max: 100, // Maximum 100 requests per window
  timeWindow: '1 minute', // Per minute
  allowList: ['127.0.0.1'], // Allow localhost
  errorResponseBuilder: (_request: any, context: any) => ({
    code: 429,
    error: 'Too Many Requests',
    message: `Rate limit exceeded, retry in ${context.after}`,
    retryAfter: context.after,
  }),
};
