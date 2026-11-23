// Connects the booking rules in signup.js to the page.
import { createSignup } from "./signup.js";

const root = document.getElementById("app");
try {
  createSignup({ storage: window.localStorage });
} catch (error) {
  root.textContent = "Signup coming soon.";
}
