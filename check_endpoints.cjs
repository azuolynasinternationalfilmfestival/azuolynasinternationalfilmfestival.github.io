const fs = require('fs');

const files = [
  'js/submissions.js',
  'js/tasks.js',
  'js/stream-admin.js',
  'js/diagnostics.js',
  'js/activity-logs.js',
  'js/settings.js',
  'js/editions.js',
  'js/users.js',
  'live.html',
  'lt/index.html',
  'en/index.html'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
  const unique = [...new Set(matches)];
  console.log(file, '==>', unique);
}
