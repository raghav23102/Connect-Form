const fs = require('fs');
const path = require('path');

const ids = [
  'classic', 'modern-minimal', 'split-contact', 'card-contact',
  'floating-label', 'dark-contact', 'customer-support', 'product-inquiry',
  'feedback', 'business-inquiry', 'newsletter-contact', 'premium-gradient'
];

const dir = path.join(__dirname, 'public', 'thumbnails');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

ids.forEach(id => {
  const content = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#f8fafc"/><text x="200" y="100" font-family="sans-serif" font-size="24" fill="#64748b" text-anchor="middle" dominant-baseline="middle">${id}</text></svg>`;
  fs.writeFileSync(path.join(dir, `${id}.svg`), content);
});

console.log("Thumbnails generated.");
