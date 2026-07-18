# End-to-End Testing Guide: ProcureTrack Enterprise

Follow this guide to manually validate all core features, database integrations, and Gemini AI features built for **ProcureTrack Enterprise**.

---

## 🛠️ Step 1: Boot Up the Application Stack

1. Open your terminal in the project root directory (`d:\imobiliothon 6.0\procuretrack-enterprise`).
2. Run the Docker compose stack to compile and boot up the containers:
   ```bash
   docker-compose up --build
   ```
3. Open your browser and navigate to: **`http://localhost:3000`**

---

## 🔐 Step 2: Login & Role-Based Access Control (RBAC)

1. **Verify Login Screen:**
   - You should see the corporate login panel with the ProcureTrack banner.
   - Input username: **`kishore`**
   - Input password: **`kishore@123`**
   - Click **Sign In**. You should land on the Dashboard.
2. **Switch Roles:**
   - Look at the header bar at the top right. Find the **Role Selection** dropdown.
   - Switch your role to **Requester**.
   - Navigate to the **Case Registry** (`/cases`). Verify that you **cannot** see the **"New Case"** action button (it hides automatically to shield requester access).
   - Switch your role back to **Procurement Officer** or **Procurement Lead** to restore creation access.

---

## 🎨 Step 3: Global Theme Switcher & Empty States

1. **Theme Swapping:**
   - Click the **Sun/Moon** icon in the header.
   - Verify that the layout shifts between slate-light and deep-blue dark modes.
   - Refresh the page and confirm that your chosen theme remains active (saved to `localStorage`).
2. **Pulsing Loading Skeletons:**
   - Go to **Suppliers** (`/suppliers`).
   - You will see glowing loading skeletons momentarily block row areas before database records render.
3. **Empty States:**
   - In the **Case Registry** (`/cases`), type a random unmatched query in the search bar (e.g. `xyz999`).
   - Verify that a clean empty-state panel appears informing you that no records match your criteria.

---

## 🔄 Step 4: 10-Stage Process Flow & Bidder Comparison

1. **Create a Case:**
   - Select the role **Procurement Manager**.
   - Go to `/cases` and click **New Case**.
   - Fill out Case Title, Category, Budget, and expected closure date, then click **Save**.
2. **Stage Progression via Bidders:**
   - Click on the newly created case row to load its details page.
   - Observe the horizontal step-tracker showing stage **`RFQ Draft`**.
   - Click **Assign Bidders**. Check 2 suppliers and click **Save Bidders**.
   - Verify that the status tracker automatically advances to **`Bidders Defined`** and records this event on the timeline.
3. **Quotation Highlight:**
   - Click **Submit Quote** and input pricing of **45,000 INR** for Supplier A.
   - Click **Submit Quote** and input pricing of **38,000 INR** for Supplier B.
   - Look at the **Quotation Comparison Grid** at the bottom. Verify that the Supplier B row is **highlighted in green** as the lowest bid.

---

## 🔔 Step 5: Real-Time Notifications

1. Click the notification bell icon in the top header and click **Clear All** to reset the pane.
2. On your Case details page, click on any step on the horizontal tracker to advance the stage (e.g. shift from `Bidders Defined` to `RFQ Shared`).
3. Click the bell icon again. Verify that a new notification card appears showing the case stage transition. Click on the notification to mark it as read.

---

## 📧 Step 6: Overdue Cron Scanning (Resend Emails)

1. **Create an Overdue Case:**
   - Click **New Case** on `/cases`.
   - Set the **Expected Closure** date to a past date (e.g. yesterday) and click **Save**.
2. **Trigger the Checker:**
   - Run this command in a separate PowerShell window to trigger the overdue checker immediately:
     ```powershell
     Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/cases/check-overdue"
     ```
   - Verify that the console outputs: `{"status": "success", "emails_dispatched": 1}`.
3. **Verify Alert History:**
   - Load the case detail view. Verify that the Timeline logs:
     *"Overdue email notification dispatched to management..."*

---

## ✨ Step 7: AI Email-to-Case Auto-Fill

1. In the **Case Registry** (`/cases`), click **New Case**.
2. At the top of the modal, click the button **✨ AI Auto-Fill from Email Sourcing Document**.
3. Paste this raw email text into the textarea:
   ```text
   Hi Priya,
   We need to purchase 50 developer laptops for the Engineering division. 
   Estimated cost is 85,000 INR, and the budget approved is capped at 90,000 INR. 
   This is a high priority request. We need these assets delivered by August 20, 2026.
   Thanks,
   Kishore Kavali
   ```
4. Click **Extract & Auto-Fill**.
5. Verify that the form inputs automatically fill out:
   - **Title:** `"Developer Laptop Workstations"` (or similar)
   - **Category:** `"IT & Software"`
   - **Estimated Value:** `85000`
   - **Approved Budget:** `90000`
   - **Priority:** `"High"`
   - **Expected Closure:** `2026-08-20`
6. Make any adjustments and click **Save** to create the case record!

---

## 🧠 Step 8: AI Sourcing Advisor (Risk & Actions)

1. Open any case details page (e.g. `/cases/PC-2025-001`).
2. Look at the right sidebar column. Locate the new **AI Sourcing Advisor** panel.
3. Click **Generate AI Advisor Insights** (with the sparkles icon).
4. Verify that:
   - **⚠️ AI Risk Audit** populates with detailed business risk descriptions.
   - **🎯 AI Next Best Actions** lists 3 prioritized tasks with context-specific reasons.

---

## 📊 Step 9: AI Executive Stakeholder Briefing

1. Navigate to **Reports & Summaries** (`/reports`).
2. Click on the tab **✨ AI Executive Briefing**.
3. Click **Generate AI Summary**.
4. Verify that a comprehensive executive markdown brief is generated, outlining active pipelines, high-risk cases, and mitigation steps.
