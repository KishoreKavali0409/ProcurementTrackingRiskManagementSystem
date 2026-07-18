# End-to-End Testing Guide: ProcureTrack Enterprise

Follow this guide to validate all features, database integrations, and UI enhancements built for **ProcureTrack Enterprise**.

---

## 🛠️ Step 1: Boot Up the Application Stack

1. Open a **PowerShell** terminal in the project root directory (`d:\imobiliothon 6.0\procuretrack-enterprise`).
2. Run the startup script:
   ```powershell
   .\start-dev.ps1
   ```
3. Open your browser and navigate to: `http://localhost:3000`

---

## 🔐 Step 2: Authentication & Role-Based Access Control (RBAC)

1. **Log In:**
   * Username: `kishore`
   * Password: `kishore@123`
2. **Verify Dashboard Access:** You should land on the main Dashboard displaying stats.
3. **Test Role Privileges:**
   * In the top-right header, locate the **Active Role** dropdown.
   * Switch the role to **Procurement Officer**. 
   * Navigate to the Cases Registry (`/cases`). Verify that you **cannot** see the "New Case" button (it will hide or disable based on your role).
   * Switch back to **Procurement Manager** or **Procurement Lead** to restore editing privileges.

---

## 🎨 Step 3: Dark Mode & Skeletons & Empty States

1. **Theme Switcher:**
   * Click the **Sun/Moon** icon in the header.
   * Verify that the interface switches between Slate-light and Zinc-dark mode. Refresh the page; verify that your selected theme persists (saved in `localStorage`).
2. **Loading Skeletons:**
   * Navigate to **Suppliers** (`/suppliers`).
   * On initial load, you will notice clean pulsing row skeleton blocks loading before the records appear.
3. **Empty States:**
   * Go to **Cases** (`/cases`).
   * Type a random string of characters (e.g., `xyz123`) in the search bar.
   * Verify that a custom placeholder empty panel appears (*"No procurement cases match your filters"*).

---

## 🔄 Step 4: 10-Stage Flow & Bidder Comparison

1. **Create a Case:**
   * Set your Active Role to **Procurement Manager**.
   * Navigate to `/cases` and click **New Case**.
   * Fill out the form (e.g., Budget, Category, expected closure date) and save.
2. **Advance Through Process Flow:**
   * Open the newly created case details page.
   * Look at the horizontal step-tracker at the top. The stage will be at `RFQ Draft`.
   * Click **Assign Bidders**. Select 2-3 suppliers and save.
   * Verify that the stage automatically promotes to **Bidders Defined**, and a note is added to the case timeline updates.
3. **Submit Bids & Highlight Lowest Quote:**
   * Click **Add Bid** for bidder A, input pricing and delivery days.
   * Click **Add Bid** for bidder B, input a lower price.
   * Look at the **Quotation Comparison Grid**. Verify that the lowest price quote row is **automatically highlighted in green**.

---

## 🔔 Step 5: Real-Time Notifications

1. Open the bell icon dropdown in the top-right header. Click **Clear All** to start fresh.
2. Go back to your Case Detail page and advance the status stage (e.g., promote `RFQ Draft` to `RFQ Shared`).
3. Click **Add Bid** and submit a quotation for a vendor.
4. Open the bell icon dropdown again. Verify that new notification cards have appeared for:
   * Case status updates
   * Quotation submittals
5. Click on an individual notification card to mark it as read, or click **Clear All** to wipe the panel.

---

## 📧 Step 6: Overdue Case Emails (Resend)

To test the automated management email warnings:

1. **Create an Overdue Case:**
   * Click **New Case** on `/cases`.
   * Set the **Expected Closure** date to a **past date** (e.g. yesterday).
2. **Trigger the Check:**
   * Since this is a server scanner cron job, you can trigger it immediately by executing this simple command in your PowerShell terminal:
     ```powershell
     Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/cases/check-overdue"
     ```
3. **Verify Execution:**
   * The terminal command should output:
     ```json
     {"status": "success", "emails_dispatched": 1}
     ```
   * Open the case detail page in the web app. Verify that the timeline has logged the email dispatch:
     *"Overdue email notification dispatched to management (1 days overdue)."*
   * Check the target email box (configured in `.env.local` as `RESEND_TO_EMAIL`) to inspect the formatted alert email!

---

## 📧 Step 7: Multi-Tab Realtime Database Sync

1. Open two browser tabs side-by-side, both on `http://localhost:3000/cases`.
2. In **Tab 1**, click **New Case** and create a case.
3. Observe **Tab 2** without clicking anything. 
4. Verify that the new case row appears in **Tab 2** automatically within milliseconds via the Supabase Realtime channel.
