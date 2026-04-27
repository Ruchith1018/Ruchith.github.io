document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".experience-card");

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("active");
    });
  });

  // Handle URL hash for deep linking and auto-expansion
  const hash = window.location.hash;
  if (hash) {
    const targetCard = document.querySelector(hash);
    if (targetCard && targetCard.classList.contains("experience-card")) {
      // Delay slightly to allow the transition to be visible
      setTimeout(() => {
        targetCard.classList.add("active");
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }

});
