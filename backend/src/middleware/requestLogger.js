/** Structured one-line request log: method, path, status, duration. Never logs bodies (may contain personal data). */
export function requestLogger(req, res, next) {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const role = req.get('x-demo-role') || '-';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${ms.toFixed(1)}ms role=${role}`);
  });
  next();
}
