document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".cert-card");
  cards.forEach(card => {
    const header = card.querySelector(".cert-header");
    header.addEventListener("click", () => {
      cards.forEach(other => {
        if (other !== card) other.classList.remove("active");
      });
      card.classList.toggle("active");
    });
  });
});


// ✅ HAMBURGER MENU FUNCTIONALITY
document.addEventListener("DOMContentLoaded", () => {
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    hamburger.classList.toggle("active");
});

// ✅ Close menu when clicking a link (for mobile UX)
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
    navLinks.classList.remove("active");
    hamburger.classList.remove("active");
    });
});

// ✅ Expand/Collapse Cards (for certifications/projects)
const cards = document.querySelectorAll(".cert-card, .project-card");
cards.forEach(card => {
    const header = card.querySelector(".cert-header, .project-header");
    header?.addEventListener("click", () => {
    cards.forEach(other => {
        if (other !== card) other.classList.remove("active");
    });
    card.classList.toggle("active");
    });
});
});

