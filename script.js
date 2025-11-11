// script.js
document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
});


// Mobile menu toggle (keep your existing code if already there)
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Fetch Live LeetCode Stats
async function loadLeetCodeStats() {
    const container = document.getElementById("leetcode-stats");
    try {
        const response = await fetch("https://leetcode-stats-api.herokuapp.com/Ruchith1018j");
        const data = await response.json();

        if (data.status === "success" || data.totalSolved !== undefined) {
            container.innerHTML = `
                <p><strong>Total Solved:</strong> ${data.totalSolved}</p>
                <p><strong>Easy:</strong> ${data.easySolved}</p>
                <p><strong>Medium:</strong> ${data.mediumSolved}</p>
                <p><strong>Hard:</strong> ${data.hardSolved}</p>
                <p><strong>Ranking:</strong> ${data.ranking}</p>
            `;
        } else {
            container.innerHTML = `<p style="color:#f55;">⚠️ Unable to load LeetCode data.</p>`;
        }
    } catch (err) {
        console.error("LeetCode API error:", err);
        container.innerHTML = `<p style="color:#f55;">⚠️ Unable to load LeetCode data right now.</p>`;
    }
}

// Load stats when page loads
document.addEventListener("DOMContentLoaded", loadLeetCodeStats);

// ===== MOBILE NAVIGATION TOGGLE =====
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  // Toggle menu when hamburger is clicked
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
  });

  // Close the menu when any link is clicked (better mobile UX)
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navLinks.classList.remove("active");
    });
  });
});

