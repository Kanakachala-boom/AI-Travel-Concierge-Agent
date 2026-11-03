// Complete Chrome DevTools Protocol (CDP) automated end-to-end integration test
// Tests authentication guards, registration, login, multi-page routing, booking, and multi-tenant data isolation

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CDP_PORT = 9222;
const FRONTEND_URL = "http://127.0.0.1:5500";

let msgId = 1;
function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener("message", handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(ws, expression) {
  const res = await send(ws, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.exception?.description || "Evaluation error");
  }
  return res.result?.value;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log("=== STARTING REAL CHROME CDP BROWSER VERIFICATION ===");

  // 1. Launch Headless Chrome
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-cdp-"));
  const chrome = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${tmpProfile}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  console.log("1. Chrome launched with debugging port", CDP_PORT);

  // Poll until Chrome CDP endpoint is ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (v.ok) {
        ready = true;
        break;
      }
    } catch {}
    await sleep(300);
  }
  if (!ready) throw new Error("Chrome did not become ready on port " + CDP_PORT);
  console.log("   Chrome CDP endpoint is responsive.");

  let ws;
  const consoleErrors = [];

  try {
    // 2. Create Target Page
    const targetRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, {
      method: "PUT",
    });
    const target = await targetRes.json();
    console.log("2. Target created, WebSocket URL:", target.webSocketDebuggerUrl);

    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    // Enable CDP Domains
    await send(ws, "Page.enable");
    await send(ws, "Runtime.enable");

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        const text = msg.params.args.map((a) => a.value || a.description).join(" ");
        consoleErrors.push(text);
        console.error("   [BROWSER CONSOLE ERROR]:", text);
      }
      if (msg.method === "Runtime.exceptionThrown") {
        const text = msg.params.exceptionDetails.text || msg.params.exceptionDetails.exception?.description;
        consoleErrors.push(text);
        console.error("   [BROWSER EXCEPTION]:", text);
      }
    };

    console.log("3. Navigating to frontend URL with #home requested...");
    await send(ws, "Page.navigate", { url: `${FRONTEND_URL}/#home` });
    await sleep(2500);

    // ================= TEST STEP 1: UNAUTHENTICATED GUARD =================
    const currentHash = await evalInPage(ws, "window.location.hash");
    console.log("   Initial route requested: #home -> Guard redirected to:", currentHash);
    if (currentHash !== "#login") {
      throw new Error(`Auth guard failed: expected #login but got ${currentHash}`);
    }

    const loginVisible = await evalInPage(ws, "!document.getElementById('view-login').hidden");
    const homeHidden = await evalInPage(ws, "document.getElementById('view-home').hidden");
    console.log("   #view-login visible:", loginVisible, "| #view-home hidden:", homeHidden);
    if (!loginVisible || !homeHidden) {
      throw new Error("Login view must be visible and Home view must be hidden for unauthenticated users");
    }

    // ================= TEST STEP 2: REGISTER USER A (PRIYA SHARMA) =================
    console.log("\n4. Testing User A Registration (Priya Sharma)...");
    await evalInPage(ws, `
      window.location.hash = '#register';
    `);
    await sleep(500);

    const emailA = `priya_${Date.now()}@example.com`;
    await evalInPage(ws, `
      document.getElementById('reg_name').value = 'Priya Sharma';
      document.getElementById('reg_email').value = '${emailA}';
      document.getElementById('reg_password').value = 'PriyaTravels2026!';
      document.getElementById('reg_confirm_password').value = 'PriyaTravels2026!';
      document.getElementById('registerForm').requestSubmit();
    `);
    console.log("   Submitted registration form for:", emailA);
    await sleep(2500);

    const alertText = await evalInPage(ws, "document.getElementById('register-alert').textContent");
    const alertHidden = await evalInPage(ws, "document.getElementById('register-alert').hidden");
    console.log("   Alert hidden:", alertHidden, "| Alert text:", alertText);

    const postRegisterHash = await evalInPage(ws, "window.location.hash");
    console.log("   Post-registration auto-login redirected to:", postRegisterHash);
    if (postRegisterHash !== "#home") {
      throw new Error(`Expected redirection to #home after registration, got ${postRegisterHash}`);
    }

    const userNameInNav = await evalInPage(ws, "document.getElementById('navUserName').textContent");
    console.log("   Navbar shows user name:", userNameInNav);
    if (!userNameInNav.includes("Priya")) {
      throw new Error(`Navbar should display 'Priya', got: ${userNameInNav}`);
    }

    // ================= TEST STEP 3: SEARCH & OPTIMIZE TRAVEL =================
    console.log("\n5. Executing Travel Search for User A (Delhi -> Mumbai)...");
    await evalInPage(ws, `
      const today = new Date();
      const d1 = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);
      const d2 = new Date(today.getTime() + 11 * 86400000).toISOString().slice(0, 10);
      
      document.getElementById('departure_city').value = 'Delhi';
      document.getElementById('destination_city').value = 'Mumbai';
      document.getElementById('departure_date').value = d1;
      document.getElementById('return_date').value = d2;
      document.getElementById('adults').value = '2';
      document.getElementById('hotel_category').value = '3';
      document.getElementById('budget').value = '60000';
      document.getElementById('submitBtn').click();
    `);
    await sleep(3500);

    const resultsHash = await evalInPage(ws, "window.location.hash");
    console.log("   Current route after search:", resultsHash);
    const hasBestCard = await evalInPage(ws, "Boolean(document.querySelector('.best-summary'))");
    console.log("   Recommendation package card rendered:", hasBestCard);
    if (!hasBestCard) {
      throw new Error("Best package summary card not rendered in results view");
    }

    // ================= TEST STEP 4: PACKAGE DETAILS & OFFER VERIFY =================
    console.log("\n6. Navigating to Package Details & Revalidating Offer...");
    await evalInPage(ws, `
      document.querySelector('button[data-action="view-details"]').click();
    `);
    await sleep(600);
    console.log("   Current route:", await evalInPage(ws, "window.location.hash"));

    await evalInPage(ws, `
      document.querySelector('button[data-action="proceed-to-verify"]').click();
    `);
    await sleep(600);
    console.log("   Current route:", await evalInPage(ws, "window.location.hash"));

    // Click Re-check Offer
    await evalInPage(ws, `
      (document.getElementById('btnVerifyOffer') || document.getElementById('btnRunVerification')).click();
    `);
    await sleep(2000);

    const isVerified = await evalInPage(ws, "Boolean(document.querySelector('.verify-status.verified'))");
    console.log("   Offer verified successfully:", isVerified);
    if (!isVerified) {
      throw new Error("Offer revalidation failed");
    }

    // ================= TEST STEP 5: SIMULATED BOOKING =================
    console.log("\n7. Proceeding to Booking and Submitting Simulated Reservation...");
    await evalInPage(ws, `
      document.getElementById('btnContinueToBooking').click();
    `);
    await sleep(600);
    console.log("   Current route:", await evalInPage(ws, "window.location.hash"));

    // Check that traveler info is prefilled with logged in user!
    const travelerName = await evalInPage(ws, "document.getElementById('travelerName').value");
    const travelerEmail = await evalInPage(ws, "document.getElementById('travelerEmail').value");
    console.log("   Pre-filled traveler name:", travelerName, "| email:", travelerEmail);
    if (!travelerName.includes("Priya")) {
      throw new Error(`Expected pre-filled traveler name 'Priya Sharma', got: ${travelerName}`);
    }

    // Explicit confirmation checkbox & submit
    await evalInPage(ws, `
      const chk = document.getElementById('chkExplicitConfirm');
      chk.checked = true;
      chk.dispatchEvent(new Event('change'));
      document.getElementById('bookingForm').requestSubmit();
    `);
    await sleep(3000);

    const bookingRef = await evalInPage(ws, `
      const refEl = document.querySelector('.ref-code-box .code') || document.querySelector('.receipt-header div[style*="font-family: monospace"]');
      refEl ? refEl.textContent.trim() : null;
    `);
    console.log("   Confirmed Simulated Reservation Reference:", bookingRef);
    if (!bookingRef || !bookingRef.startsWith("SIM-RES-")) {
      throw new Error(`Invalid or missing booking reference: ${bookingRef}`);
    }

    // ================= TEST STEP 6: VERIFY MY BOOKINGS & PROFILE =================
    console.log("\n8. Verifying User A's Booking History & Profile Page...");
    await evalInPage(ws, "window.location.hash = '#my-bookings';");
    let userABookingsText = "";
    for (let i = 0; i < 25; i++) {
      userABookingsText = await evalInPage(ws, "document.getElementById('bookingHistory').textContent");
      if (userABookingsText.includes(bookingRef)) break;
      await sleep(300);
    }

    console.log("   Booking list contains reference:", userABookingsText.includes(bookingRef));
    if (!userABookingsText.includes(bookingRef)) {
      throw new Error(`Booking reference ${bookingRef} not found in Priya's booking history! Text was: ${userABookingsText}`);
    }

    // Profile
    await evalInPage(ws, "window.location.hash = '#profile';");
    let profileBookingsCountVal = "0";
    for (let i = 0; i < 25; i++) {
      profileBookingsCountVal = await evalInPage(ws, "document.getElementById('profileBookingsCount').textContent");
      if (Number(profileBookingsCountVal) >= 1) break;
      await sleep(300);
    }
    console.log("   Priya's Profile Total Bookings Count:", profileBookingsCountVal);
    if (Number(profileBookingsCountVal) < 1) {
      throw new Error(`Expected at least 1 booking in profile, got ${profileBookingsCountVal}`);
    }

    // ================= TEST STEP 7: LOGOUT USER A & MULTI-TENANT ISOLATION =================
    console.log("\n9. Testing User A Logout & Multi-Tenant Data Isolation with User B...");
    await evalInPage(ws, "document.getElementById('nav-logout').click();");
    await sleep(1000);

    const postLogoutHash = await evalInPage(ws, "window.location.hash");
    console.log("   Post-logout route:", postLogoutHash);
    if (postLogoutHash !== "#login") {
      throw new Error(`Expected #login after logout, got ${postLogoutHash}`);
    }

    // Register User B (Rajesh Kumar)
    await evalInPage(ws, "window.location.hash = '#register';");
    await sleep(500);

    const emailB = `rajesh_${Date.now()}@example.com`;
    await evalInPage(ws, `
      document.getElementById('reg_name').value = 'Rajesh Kumar';
      document.getElementById('reg_email').value = '${emailB}';
      document.getElementById('reg_password').value = 'RajeshTravels2026!';
      document.getElementById('reg_confirm_password').value = 'RajeshTravels2026!';
      document.getElementById('registerForm').requestSubmit();
    `);
    console.log("   Registered User B (Rajesh Kumar):", emailB);
    await sleep(2500);

    const userBNavName = await evalInPage(ws, "document.getElementById('navUserName').textContent");
    console.log("   Navbar now shows User B:", userBNavName);
    if (!userBNavName.includes("Rajesh")) {
      throw new Error(`Navbar should display 'Rajesh', got: ${userBNavName}`);
    }

    // Navigate to #my-bookings as User B
    await evalInPage(ws, "window.location.hash = '#my-bookings';");
    await sleep(1500);

    const userBBookingsText = await evalInPage(ws, "document.getElementById('bookingHistory').textContent");
    console.log("   User B's Bookings Text:", userBBookingsText.trim());
    if (userBBookingsText.includes(bookingRef)) {
      throw new Error(`CRITICAL PRIVACY VIOLATION: User B can see User A's booking reference ${bookingRef}!`);
    }
    console.log("   ✓ User B CANNOT see User A's bookings (Complete multi-tenant data isolation verified!)");

    // Check Console Errors
    console.log("\n10. Checking browser console errors during entire test run...");
    console.log("   Console Errors Count:", consoleErrors.length);
    if (consoleErrors.length > 0) {
      throw new Error(`Browser console errors detected: ${JSON.stringify(consoleErrors)}`);
    }
    console.log("   ✓ 0 browser console errors detected!");

    console.log("\n=== ALL REAL CHROME CDP BROWSER TESTS PASSED 100% SUCCESSFULLY! ===");
  } finally {
    if (ws) ws.close();
    chrome.kill("SIGKILL");
    try {
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    } catch {}
  }
}

run().catch((err) => {
  console.error("FATAL BROWSER TEST ERROR:", err);
  process.exit(1);
});
