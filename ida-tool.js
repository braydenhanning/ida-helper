const csvFiles = [
  {
    name: "Triple Play",
    type: "bundle",
    url: "https://raw.githubusercontent.com/braydenhanning/ida-helper/main/data/West%20Triple%20Play%20Offers.csv"
  },
  {
    name: "Addons",
    type: "addon",
    url: "https://raw.githubusercontent.com/braydenhanning/ida-helper/main/data/West%20Addons.csv"
  },
  {
    name: "Single Play",
    type: "internet",
    url: "https://raw.githubusercontent.com/braydenhanning/ida-helper/main/data/West%20Single%20Play%20Offers.csv"
  },
  {
    name: "Two Play Mobile",
    type: "bundle",
    url: "https://raw.githubusercontent.com/braydenhanning/ida-helper/main/data/West%20Two%20Play%20Mobile%20Offers.csv"
  },
  {
    name: "Two Play Video",
    type: "bundle",
    url: "https://raw.githubusercontent.com/braydenhanning/ida-helper/main/data/West%20Two%20Play%20Video%20Offers.csv"
  },
{
  name: "Home Phone",
  type: "addon",
  url: "https://raw.githubusercontent.com/braydenhanning/ida-helper/main/data/West%20Home%20Phone%20Only.csv"
}
];

// Map state to the market types for that state
const stateMarketMap = {
  "WV": ["M", "P", "F", "G"],  // West Virginia's market types
  // You can add more states and their market types here
};

let allOffers = [];
let marketTypeMap = {};

const serviceDisplayMap = {
  "15Mbps": "15Mbps",
  "30M HFC": "30Mbps",
  "50M HFC": "50Mbps",
  "100M HFC": "100Mbps",
  "300M HFC": "300Mbps",
  "500M HFC": "500Mbps",
  "1G HFC": "1Gbps",
  "500M Fiber": "500Mbps (Fiber)",
  "1G Fiber": "1Gbps (Fiber)",
  "Value TV": "Value TV",
  "Select TV": "Select TV",
  "Core TV": "Core TV",
  "New Video Basic": "New Video Basic",
  "New Video Premier": "New Video Premier",
  "Phone": "Phone",
  "Home Phone": "Home Phone"
};

const serviceNameFixes = {
  "Select Video": "Select TV",
  "Core Video": "Core TV",
  "Value Video": "Value TV",
  "Video Basic": "New Video Basic",
  "Video Premier": "New Video Premier",
  "Video": "Select TV",
  "Mobile": null,
  "50M HFC OAI": "50M HFC",
  "300M HFC_": "300M HFC"
};

const serviceCategories = {
  "HFC Internet": ["15Mbps", "30M HFC", "50M HFC", "100M HFC", "300M HFC", "500M HFC", "1G HFC"],
  "Fiber Internet": ["500M Fiber", "1G Fiber"],
  "Legacy TV": ["Value TV", "Select TV", "Core TV"],
  "New TV": ["New Video Basic", "New Video Premier"],
  "Phone": ["Phone", "Home Phone"]
};

Promise.all(csvFiles.map(file =>
  fetch(file.url)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch ${file.name}: ${res.statusText}`);
      return res.text();
    })
    .then(text => ({ ...file, content: Papa.parse(text, { header: false }).data }))
)).then(results => {
  const markets = new Set();
results.forEach(({ content }) => {
  content.forEach((cols, index) => {
    if (index === 0) return; // Skip header

    if (cols.length > 4) {
      const market = cols[4].trim();
      markets.add(market);
      if (!marketTypeMap[market]) {
        marketTypeMap[market] = new Set();
      }
if (cols[3]) {
cols[3].split(',').forEach(type => {
  marketTypeMap[market].add(type.trim());
});
}
    }
  });
});

  populateDropdown([...markets]);
  allOffers = results;
}).catch(err => {
  console.error("🔥 CSV loading error:", err);
  alert("Something went wrong loading the CSVs. Check the console for details.");
});

function populateDropdown(markets) {
  const dropdown = document.getElementById('marketDropdown');
  dropdown.innerHTML = '<option value="">-- Select Market Area --</option>';
  markets.sort().forEach(market => {
    const opt = document.createElement('option');
    opt.value = market;
    opt.textContent = market;
    dropdown.appendChild(opt);
  });
}

function submitMarket() {
  const selectedMarket = document.getElementById('marketDropdown').value;
  if (!selectedMarket) return alert("Please select a market area first.");
  const container = document.getElementById('serviceCheckboxes');
  container.innerHTML = '';

  const foundServices = new Set();

  allOffers.forEach(({ content }) => {
  const headers = content[0].map(h => h.trim()); // Move this outside slice(1) loop
  content.slice(1).forEach(cols => {
    if (cols[4] && cols[4].trim().toLowerCase() === selectedMarket.toLowerCase().trim()) {
      // 🔍 Look through TV columns based on headers
      headers.forEach((header, colIndex) => {
  const fixedHeader = serviceNameFixes[header] || header;

  // Skip if it’s not a recognized service
  if (!serviceDisplayMap[fixedHeader]) return;

  const cellValue = cols[colIndex]?.trim();

  // If this row has a non-zero, valid service value
  if (cellValue && cellValue !== '$0' && cellValue !== 'N/A') {
    foundServices.add(fixedHeader);
    console.log(`📦 Found from header: ${fixedHeader} = ${cellValue}`);
  }
});
      // 🧹 Now check regular service string (cols[5])
      if (cols[5]) {
        const servicesInRow = cols[5].split('+').map(s => {
          const trimmed = s.trim().replace(/\s+/g, ' ');
          const fixed = serviceNameFixes.hasOwnProperty(trimmed) ? serviceNameFixes[trimmed] : trimmed;
          console.log("Raw:", s, "Trimmed:", trimmed, "Fixed:", fixed);
          return fixed === null ? null : fixed;
        }).filter(Boolean);

        servicesInRow.forEach(service => {
          foundServices.add(service);
        });
}
// ✅ Manually catch Optimum Phone or Home Phone from Home Phone CSV layout
if (cols[8]) {
  const label = cols[5]?.trim();
  const phoneVal = cols[8]?.trim();
  console.log("🔎 Checking phone row — Label:", label, "Value:", phoneVal);

  if (phoneVal && phoneVal !== '$0' && phoneVal !== 'N/A') {
    if (label === "Home Phone") {
      foundServices.add("Home Phone");
      console.log("☎️ Found: Home Phone (via column 8)");
    }
  }
}
    }
  });
});

for (const [category, services] of Object.entries(serviceCategories)) {
  const catDiv = document.createElement('div');
  catDiv.className = 'category';
  const heading = document.createElement('h4');
  heading.textContent = category;
  catDiv.appendChild(heading);

  services.forEach(service => {
    if (foundServices.has(service)) {
      const label = document.createElement('label');
      label.classList.add('fade-in-up'); // 💫 This is where it goes

      const displayName = serviceDisplayMap[service] || service;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = service;
      checkbox.className = 'service';
      checkbox.addEventListener('change', generateCodes);

      label.appendChild(checkbox);
      label.append(` ${displayName}`);

      catDiv.appendChild(label);
      catDiv.appendChild(document.createElement('br'));
    }
  });

  container.appendChild(catDiv);
}

  document.getElementById('marketSection').classList.add('hidden');
  document.getElementById('servicesSection').classList.remove('hidden');
}

function generateCodes() {
  const selectedMarket = document.getElementById('marketDropdown').value;
  let selectedServices = [...document.querySelectorAll('.service:checked')].map(cb => cb.value);

// Force "Phone" to behave like "Home Phone"
selectedServices = selectedServices.map(s => s === "Phone" ? "Home Phone" : s);


// Check for multiple internet selections
const allInternetServices = [
  ...serviceCategories["HFC Internet"],
  ...serviceCategories["Fiber Internet"]
];
const selectedInternet = selectedServices.filter(service => allInternetServices.includes(service));
if (selectedInternet.length > 1) {
  alert("⚠️ A customer cannot have more than one internet service selected at a time.");
}

const resultsBox = document.getElementById('results');
if (!resultsBox) return;

if (selectedServices.length === 0) {
  resultsBox.innerText = 'No services selected.';
resultsBox.classList.remove('fade-in-up');
resultsBox.classList.remove('hidden'); // Remove animation if needed
  return;
}

  const matchedMarketTypes = marketTypeMap[selectedMarket] || new Set();

  console.log("🔍 Running generateCodes()");
  console.log("➡️ Selected Market:", selectedMarket);
  console.log("✅ Selected Services:", selectedServices);
  console.log("📊 Matched Market Types from map:", [...matchedMarketTypes]);

  let results = `Market Area: ${selectedMarket}\n\nSelected Services:\n${selectedServices.join('\n')}\n\n`;
  const seenMatches = new Set();

  allOffers.forEach(({ content }) => {
    const headers = content[0].map(h => h.trim().replace(/\s+/g, ' '));
    content.slice(1).forEach(cols => {
      const offerString = cols[5] ? cols[5].trim() : '';
if (!cols || cols.length < 6) {
  console.warn("⛔ Skipping malformed row:", cols);
  return;
}

// Handle standalone Optimum Phone / Home Phone rows
  const label = cols[5]?.trim();
  const phoneVal = cols[8].trim();

const isManualPhone =
  selectedServices.includes("Home Phone") &&
  (label === "Home Phone" || label === "Optimum Phone");

if (isManualPhone && cols[21]?.trim()) {
  const isOptimumPhone = label === "Optimum Phone";
  const isHomePhone = label === "Home Phone";

  results += `Offer Match: ${label}\n`;

  const baseCode = cols[13]?.trim() || 'N/A';
  const credit = cols[17]?.trim() || 'N/A';
  const autoPay = cols[23]?.trim() || 'N/A';
  const gift = cols[29]?.trim() || 'N/A';
  const tracking = cols[9]?.trim() || 'N/A';

  // ✅ Properly split voice code based on the label
  const voiceCode = cols[21]?.trim() || 'N/A';

  results += `\n[Service Codes]\n`;
  if (isHomePhone || isOptimumPhone) {
    results += `Voice: ${voiceCode}\n`;
  }

  results += `Base: ${baseCode}\n`;
  if (credit && credit !== 'N/A') results += `Credit: ${credit}\n`;
  if (autoPay && autoPay !== 'N/A') results += `Auto Pay: ${autoPay}\n`;
  if (tracking && tracking !== 'N/A') results += `Tracking Code: ${tracking}\n`;
  if (gift && gift !== 'N/A') results += `Gift: ${gift}\n\n`;

  seenMatches.add(label);
  return;
}

const offerMarketTypes = cols[3]?.split(',').map(t => t.trim()) || [];
const typeMatch = [...matchedMarketTypes].some(typeSet =>
  offerMarketTypes.includes(typeSet)
);

      console.log("— Checking row —");
      console.log("Offer Market Types (cols[3]):", cols[3]);
      console.log("Does it match any?", typeMatch);

const marketMatch = cols[4]?.trim().toLowerCase() === selectedMarket.toLowerCase().trim();

// ✅ Skip if neither valid market nor a phone-only manual row
if ((!typeMatch || !marketMatch) && !isManualPhone) return;

      // ...rest of your code continues

const offerServices = offerString
  .split('+')
  .map(s => s.trim().replace(/\s+/g, ' '))
  .map(s => serviceNameFixes.hasOwnProperty(s) ? serviceNameFixes[s] : s)
  .filter(s => s && serviceDisplayMap.hasOwnProperty(s));

      const normalizedOffer = offerServices.map(s => s.toLowerCase()).sort().join(',');
      const normalizedSelected = selectedServices.map(s => s.toLowerCase()).sort().join(',');

      if (normalizedOffer === normalizedSelected && !seenMatches.has(normalizedOffer)) {
        console.log("Matched Row:", cols);
        seenMatches.add(normalizedOffer);

        results += `Offer Match: ${offerString}\n`;

        // Speed and bundle info
        const speedIndex = headers.indexOf("Speed");
        const bundleColumnCandidates = [
          "Internet + Entertainment TV Bundle Price",
          "Main Code",
          "Bundle Code"
        ];
        const bundleIndex = headers.findIndex(h =>
          bundleColumnCandidates.some(name => h.includes(name))
        );

        // Extract speed code (1Gbps, 500Mbps, etc.)
const internetSpeed = speedIndex !== -1 ? cols[speedIndex] : 'N/A';
const speedRateIndex = headers.findIndex(h => h.toLowerCase().includes("rate code"));
const speedRateCode = cols[15] || 'N/A';
results += `Internet Speed: ${internetSpeed}\n`;
results += `Speed Rate Code: ${speedRateCode}\n`;

        // Extracting key codes
        const internetBase = cols[13] || 'N/A';   // Speed Base code (like W( or 1E)
const internetCredit = cols[17] || 'N/A'; // Bank autopay
const autoPayCode = cols[23] || 'N/A';    // Debit autopay
const trackingcode = cols[8] || 'N/A'; // tracking code
const giftCode = cols[29] || 'N/A';

// New ones to grab extra credits
const additionalCredit1 = cols[19] || '';

results += `\n[Service Codes]\n`;
results += `Base: ${internetBase}\n`;

if (internetCredit !== 'N/A') {
  results += `Credit: ${internetCredit}\n`;
}
if (additionalCredit1 && additionalCredit1 !== 'N/A') {
  results += `Additional Credit: ${additionalCredit1}\n`;
}
if (autoPayCode !== 'N/A') {
  results += `Auto Pay: ${autoPayCode}\n`;
}
if (trackingcode !== 'N/A') {
  results += `Tracking Code: ${trackingcode}\n`;
}
results += `Gift: ${giftCode}\n\n`;

      }
    });
  });

if (!resultsBox) return; // fail-safe

resultsBox.classList.remove('fade-in-up'); // reset animation
void resultsBox.offsetWidth; // force reflow

resultsBox.classList.remove('fade-in-up'); // reset animation if already applied
resultsBox.classList.remove('hidden');
void resultsBox.offsetWidth; // force reflow for animation restart

resultsBox.innerText = results;
if (!resultsBox) return;

const checkboxes = document.querySelectorAll('.service:checked');
if (checkboxes.length === 0) {
  resultsBox.classList.remove('fade-in-up');
  resultsBox.classList.add('hidden');
  resultsBox.innerText = '';
  return;
}

// Reset and trigger animation
resultsBox.classList.remove('fade-in-up');
void resultsBox.offsetWidth;

resultsBox.innerText = results;
resultsBox.classList.remove('hidden');
resultsBox.classList.add('fade-in-up');
}
