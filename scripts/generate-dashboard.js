const fs = require('fs');
const path = require('path');

// Step up one directory level from 'scripts' to access the project root, then target 'reports'
const projectRootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(projectRootDir, 'reports');
const jsonPath = path.join(reportsDir, 'results.json');
const outputPath = path.join(reportsDir, 'dashboard', 'dashboard.html');

if (!fs.existsSync(jsonPath)) {
  console.error(`❌ Error: 'results.json' not found at: ${jsonPath}`);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const stats = { passed: 0, failed: 0, skipped: 0, timedOut: 0, total: 0, duration: 0 };
const testCases = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getErrorText(result) {
  if (!result) {
    return null;
  }

  if (Array.isArray(result.errors) && result.errors.length > 0) {
    return result.errors
      .map((error) => (typeof error === 'string' ? error : error.message || JSON.stringify(error)))
      .join('\n');
  }

  if (result.error) {
    if (typeof result.error === 'string') {
      return result.error;
    }
    return result.error.message || JSON.stringify(result.error);
  }

  return null;
}

function parseSuite(suite) {
  if (suite.specs) {
    suite.specs.forEach((spec) => {
      const tests = Array.isArray(spec.tests) ? spec.tests : [];
      tests.forEach((test) => {
        const results = Array.isArray(test.results) ? test.results : [];
        results.forEach((result) => {
          const status = result.status || 'skipped';
          stats.total++;
          if (status === 'passed') stats.passed++;
          else if (status === 'failed') stats.failed++;
          else if (status === 'skipped') stats.skipped++;
          else if (status === 'timedout' || status === 'timeout') stats.timedOut++;

          const durationMs = Number(result.duration || 0);
          stats.duration += durationMs;

          testCases.push({
            title: spec.title || 'Unnamed spec',
            file: spec.file ? path.basename(spec.file) : 'unknown',
            status,
            duration: (durationMs / 1000).toFixed(2),
            error: getErrorText(result)
          });
        });
      });
    });
  }

  if (suite.suites) {
    suite.suites.forEach(parseSuite);
  }
}

const suites = Array.isArray(rawData.suites) ? rawData.suites : [];
suites.forEach(parseSuite);
stats.duration = Math.round(stats.duration / 1000);

// We compile the HTML as an array of strings to hide the raw HTML tags from the JSX/TSX compiler
const htmlLines = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '    <meta charset="UTF-8">',
  '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '    <title>Playwright Automation Dashboard</title>',
  '    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>',
  '    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
  '</head>',
  '<body class="bg-slate-50 text-slate-800 font-sans antialiased">',
  '    <div class="max-w-7xl mx-auto px-4 py-8">',
  '        <header class="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-8 border-b border-slate-200">',
  '            <div>',
  '                <h1 class="text-3xl font-bold tracking-tight text-slate-900">Automation Execution Dashboard</h1>',
  '                <p class="text-slate-500 mt-1">Playwright Test Suite Run Overview</p>',
  '            </div>',
  '            <div class="mt-4 md:mt-0 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600">',
  `                Total Duration: <span class="text-indigo-600 font-bold">${stats.duration}s</span>`,
  '            </div>',
  '        </header>',
  '        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">',
  '            <div class="lg:col-span-2 grid grid-cols-2 gap-4">',
  '                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">',
  '                    <span class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Executed</span>',
  `                    <span class="text-4xl font-extrabold text-slate-900 mt-2">${stats.total}</span>`,
  '                </div>',
  '                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between border-l-4 border-l-emerald-500">',
  '                    <span class="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Passed</span>',
  `                    <span class="text-4xl font-extrabold text-emerald-700 mt-2">${stats.passed}</span>`,
  '                </div>',
  '                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between border-l-4 border-l-rose-500">',
  '                    <span class="text-sm font-semibold text-rose-600 uppercase tracking-wider">Failed</span>',
  `                    <span class="text-4xl font-extrabold text-rose-700 mt-2">${stats.failed}</span>`,
  '                </div>',
  '                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between border-l-4 border-l-amber-500">',
  '                    <span class="text-sm font-semibold text-amber-600 uppercase tracking-wider">Skipped / Timeout</span>',
  `                    <span class="text-4xl font-extrabold text-amber-700 mt-2">${stats.skipped + stats.timedOut}</span>`,
  '                </div>',
  '            </div>',
  '            <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">',
  '                <div class="w-48 h-48">',
  '                    <canvas id="resultsChart"></canvas>',
  '                </div>',
  '            </div>',
  '        </div>',
  '        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">',
  '            <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">',
  '                <h2 class="font-bold text-slate-900 text-lg">Test Details Breakdown</h2>',
  '            </div>',
  '            <div class="overflow-x-auto">',
  '                <table class="w-full text-left border-collapse">',
  '                    <thead>',
  '                        <tr class="bg-slate-100/70 text-slate-600 text-xs font-semibold uppercase border-b border-slate-200">',
  '                            <th class="px-6 py-3">Status</th>',
  '                            <th class="px-6 py-3">Test Spec Name</th>',
  '                            <th class="px-6 py-3">File Location</th>',
  '                            <th class="px-6 py-3 text-right">Duration</th>',
  '                        </tr>',
  '                    </thead>',
  '                    <tbody class="divide-y divide-slate-200 text-sm">',
  testCases.map(tc => {
    let statusBadge = '';
    if (tc.status === 'passed') {
      statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">PASSED</span>';
    } else if (tc.status === 'failed') {
      statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">FAILED</span>';
    } else {
      statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">SKIPPED</span>';
    }

    const errorBlock = tc.error
      ? `<pre class="mt-2 p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-100 overflow-x-auto max-w-2xl whitespace-pre-wrap font-mono">${escapeHtml(tc.error)}</pre>`
      : '';

    return `
      <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
          <td class="px-6 py-4">
              <div class="font-semibold text-slate-900">${tc.title}</div>
              ${errorBlock}
          </td>
          <td class="px-6 py-4 text-slate-500 font-mono text-xs">${tc.file}</td>
          <td class="px-6 py-4 text-right font-medium text-slate-700">${tc.duration}s</td>
      </tr>
    `;
  }).join(''),
  '                    </tbody>',
  '                </table>',
  '            </div>',
  '        </div>',
  '    </div>',
  '    <script>',
  "        const ctx = document.getElementById('resultsChart').getContext('2d');",
  '        new Chart(ctx, {',
  "            type: 'doughnut',",
  '            data: {',
  "                labels: ['Passed', 'Failed', 'Skipped'],",
  '                datasets: [{',
  `                    data: [${stats.passed}, ${stats.failed}, ${stats.skipped + stats.timedOut}],`,
  "                    backgroundColor: ['#10b981', '#f43f5e', '#f59e0b'],",
  '                    borderWidth: 2,',
  '                    hoverOffset: 4',
  '                }]',
  '            },',
  '            options: {',
  '                plugins: { legend: { display: false } },',
  "                cutout: '75%'",
  '            }',
  '        });',
  '    </script>',
  '</body>',
  '</html>'
].join('\n');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, htmlLines, 'utf8');
console.log(`🚀 Custom dashboard successfully generated inside reports folder!`);
console.log(`📂 Path: ${outputPath}`);