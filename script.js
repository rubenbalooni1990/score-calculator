const tierData = {
  "Tier 1 : SCF - Limit up to 100k SAR": [
    { name: "CR Status", options: { "Active": 10, "Expired": 0 }, weight: 10 },
    { name: "Business Age", options: { "<6": 0, "6–11": 2, "12–23": 4, "24–35": 6, "36+": 10 }, weight: 20 },
    { name: "Owner Match", options: { "Yes": 10, "No": 0 }, weight: 5 }
  ],
  "Tier 2 : SCF - Limit up to 1M SAR": [
    { name: "SIMAH Defaults", options: { "None": 10, "1–2": 5, "3+": 0 }, weight: 15 },
    { name: "Facility Ratio", options: { "<1.5": 10, "1.5–2.5": 5, ">2.5": 0 }, weight: 10 },
    { name: "CR Status", options: { "Active": 10, "Expired": 0 }, weight: 5 }
  ],
  "Tier 3 : SCF - Limit >1M SAR": [
    { name: "Legal Structure", options: { "LLC": 10, "Others": 5 }, weight: 10 },
    { name: "Saudization Band", options: { "High": 10, "Medium": 8, "Low": 6 }, weight: 5 },
    { name: "SIMAH Score", options: { "Excellent": 10, "Good": 8, "Fair": 6, "Poor": 3 }, weight: 10 }
  ],
  "Tier 4 : EDP": [
    { name: "Exclusive Agreement", options: { "Signed": 10, "Not Signed": 0 }, weight: 15 },
    { name: "Inventory Coverage", options: { ">90 Days": 10, "60–90": 5, "<60": 0 }, weight: 10 },
    { name: "Procurement Loyalty", options: { "100%": 10, "75–99%": 8, "50–74%": 5, "<50%": 0 }, weight: 5 }
  ]
};

const tierSelect = document.getElementById('tierSelect');
const paramsContainer = document.getElementById('parametersContainer');
const calcBtn = document.getElementById('calculateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const result = document.getElementById('result');

// Populate Tier Dropdown
Object.keys(tierData).forEach(tier => {
  let opt = document.createElement('option');
  opt.value = tier;
  opt.textContent = tier;
  tierSelect.appendChild(opt);
});

tierSelect.addEventListener('change', () => {
  renderParameters();
  calcBtn.disabled = true;
  calcBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
  calcBtn.classList.remove('bg-green-600', 'cursor-pointer');
  downloadBtn.disabled = true;
});

function renderParameters() {
  paramsContainer.innerHTML = '';
  const tier = tierSelect.value;
  if (!tier || !tierData[tier]) return;

  tierData[tier].forEach((param, idx) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <label class="block mb-1 font-medium">${param.name}</label>
      <select data-weight="${param.weight}" class="param-dropdown w-full border p-2 rounded" onchange="checkCompletion()">
        <option value="">-- Select --</option>
        ${Object.entries(param.options).map(([label, score]) =>
          `<option value="${score}">${label}</option>`
        ).join('')}
      </select>
    `;
    paramsContainer.appendChild(div);
  });
}

function checkCompletion() {
  const dropdowns = document.querySelectorAll('.param-dropdown');
  const allSelected = [...dropdowns].every(d => d.value !== '');
  if (allSelected) {
    calcBtn.disabled = false;
    calcBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
    calcBtn.classList.add('bg-green-600', 'cursor-pointer');
  } else {
    calcBtn.disabled = true;
    calcBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
    calcBtn.classList.remove('bg-green-600', 'cursor-pointer');
  }
}

function calculateScore() {
  const dropdowns = document.querySelectorAll('.param-dropdown');
  let totalWeight = 0;
  let weightedScore = 0;

  dropdowns.forEach(dropdown => {
    const score = parseFloat(dropdown.value);
    const weight = parseFloat(dropdown.dataset.weight);
    totalWeight += weight;
    weightedScore += (score * weight);
  });

  const finalScore = +(weightedScore / totalWeight).toFixed(2);
  const avgSales = parseFloat(document.getElementById('monthlySales').value || 0);
  const tier = tierSelect.value;
  let limit = 0;

  if (tier.startsWith('Tier 1')) {
    limit = finalScore < 4 ? 0 : Math.min(100000, 10000 + 0.5 * avgSales);
  } else if (tier.startsWith('Tier 2')) {
    if (finalScore >= 5) {
      const maxLimit = Math.min(1000000, 0.5 * avgSales);
      limit = (finalScore / 10) * maxLimit;
    }
  } else if (tier.startsWith('Tier 3')) {
    if (finalScore >= 5) {
      limit = (finalScore / 10) * 0.5 * avgSales;
      limit = Math.min(limit, 2500000);
    }
  } else if (tier.startsWith('Tier 4')) {
    limit = finalScore >= 5 ? 'Compute Manually' : 0;
  }

  result.innerHTML = `
    Final Score: <b>${finalScore}</b><br>
    Assigned Limit: <b>${typeof limit === 'number' ? Math.round(limit).toLocaleString() + ' SAR' : limit}</b>
  `;

  downloadBtn.disabled = false;
}

// Basic PDF Download
function downloadPDF() {
  const name = document.getElementById('customerName').value;
  const cr = document.getElementById('crNumber').value;
  const unn = document.getElementById('unifiedNumber').value;
  const vat = document.getElementById('vatNumber').value;
  const sales = document.getElementById('monthlySales').value;
  const tier = tierSelect.value;
  const scoreText = result.innerText;

  const content = `
    Customer Name: ${name}
    CR Number: ${cr}
    Unified Number: ${unn}
    VAT Number: ${vat}
    Avg Monthly Sales: ${sales}
    Tier Selected: ${tier}

    Scoring Result:
    ${scoreText}
  `;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name || 'RiskScore'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
