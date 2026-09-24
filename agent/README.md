# 🖨️ PrintX Shop Desktop Agent

Yeh lightweight background agent Xerox / Print shop ke computer par chalta hai aur customer ke online print orders ko **bina mouse touch kiye automatically physical printer (HP, Canon, Epson, Brother) se print karta hai**.

---

### 🚀 Dukan me Kaise Setup Karein? (Quick 2-Step Guide)

#### Step 1: Configuration check karein (`config.json`)
Aapke dukan ka unique slug set karein:
```json
{
  "serverUrl": "http://localhost:4000",
  "shopSlug": "maji-xerox-station",
  "agentName": "Maji Xerox Counter PC",
  "pollIntervalMs": 3000,
  "heartbeatIntervalMs": 10000,
  "autoPrint": true,
  "preferredPrinter": ""
}
```

#### Step 2: Agent Start Karein
- Windows par **`start-agent.bat`** par double click karein, ya terminal me run karein:
```bash
cd agent
node agent.js
```

---

### ⚙️ Kaise Kaam Karta Hai? (Workflow)

1. **Hardware Detection**: Agent Windows PowerShell ke through shop computer se Jude saare USB aur Wi-Fi printers (jaise HP LaserJet, Canon Pixma, Epson EcoTank) ko automatically detect karta hai.
2. **Heartbeat Sync**: Har 10 second me cloud database ko update karta hai taaki Super Admin dashboard me **"Printers Online: 1"** live dikhe.
3. **Instant Auto-Print**:
   - Customer dukan par QR code scan karke file upload karta hai aur UPI payment karta hai.
   - Payment SUCCESS hote hi agent ko order receive hota hai.
   - Agent document download karke seedha Windows Spooler ke through printer ko silent print command de deta hai.
   - Print hone ke baad server status **`PRINTED`** ho jata hai!
