/* 
   SISHU RESTAURANT — script.js
*/

// ── NAV scroll effect 
window.addEventListener("scroll", () => {
  const nav = document.getElementById("navbar");
  nav.style.background =
    window.scrollY > 60 ? "rgba(42,26,10,0.99)" : "rgba(42,26,10,0.96)";
});

// ── Mobile menu
function toggleMobile() {
  const menu = document.getElementById("mobileMenu");
  const ham = document.getElementById("hamburger");
  const isOpen = menu.classList.toggle("open");
  ham.textContent = isOpen ? "✕" : "☰";
}

function closeMobile() {
  document.getElementById("mobileMenu").classList.remove("open");
  document.getElementById("hamburger").textContent = "☰";
}

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  const menu = document.getElementById("mobileMenu");
  const hamburger = document.getElementById("hamburger");
  if (
    menu.classList.contains("open") &&
    !menu.contains(e.target) &&
    e.target !== hamburger
  ) {
    closeMobile();
  }
});

// ── Menu tabs
function showTab(id, btn) {
  document
    .querySelectorAll(".menu-panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById("tab-" + id).classList.add("active");
  btn.classList.add("active");
}

// ── Scroll reveal 
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("visible"), i * 80);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ── Set min date for reservation 
const today = new Date().toISOString().split("T")[0];
const dateInput = document.getElementById("res-date");
if (dateInput) dateInput.setAttribute("min", today);

// ── Reservation form submission 
function submitReservation(e) {
  e.preventDefault();

  const btn = e.target.querySelector(".form-submit");
  btn.textContent = "Sending...";
  btn.disabled = true;

  const data = {
    name: document.getElementById("res-name").value,
    phone: document.getElementById("res-phone").value,
    email: document.getElementById("res-email").value, // ← new field
    date: document.getElementById("res-date").value,
    time: document.getElementById("res-time").value,
    guests: document.getElementById("res-guests").value,
    occasion: document.getElementById("res-occasion").value,
    notes: document.getElementById("res-notes").value,
  };

  fetch("/reserve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((result) => {
      showSuccess(btn, result.message);
    })
    .catch((err) => {
      console.warn("Server not reached:", err);
      showSuccess(
        btn,
        "Reservation received! We'll confirm via phone within 2 hours.",
      );
    });
}

function showSuccess(btn, message) {
  const successEl = document.getElementById("res-success");
  successEl.textContent = "✓ " + message;
  successEl.style.display = "block";
  btn.textContent = "Reservation Sent ✓";
  btn.style.background = "#078930";
  btn.disabled = false;
  successEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
