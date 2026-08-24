export default function handler(_req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  return res.status(200).json({
    status: 'ok',
    service: 'oblivion',
    timestamp: new Date().toISOString()
  });
}
