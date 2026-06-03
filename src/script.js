// ============================================
// HERO ENTRANCE
// ============================================

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

// ============================================
// SMOOTH SCROLL
// ============================================

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    e.preventDefault();

    const target = document.querySelector(
      anchor.getAttribute("href")
    );

    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});

// ============================================
// SCROLL REVEAL
// ============================================

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("show");

      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.15,
  }
);

document
  .querySelectorAll(".fade-up")
  .forEach((el) => observer.observe(el));

// ============================================
// ACTIVE NAVIGATION
// ============================================

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

function updateActiveNav() {
  let currentSection = "";

  sections.forEach((section) => {
    const sectionTop =
      section.offsetTop - 200;

    if (
      window.scrollY >= sectionTop
    ) {
      currentSection =
        section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");

    if (
      link.getAttribute("href") ===
      `#${currentSection}`
    ) {
      link.classList.add("active");
    }
  });
}

window.addEventListener(
  "scroll",
  updateActiveNav
);

// ============================================
// NAVBAR SHADOW
// ============================================

const navbar =
  document.querySelector(".navbar");

function updateNavbar() {
  if (!navbar) return;

  if (window.scrollY > 20) {
    navbar.classList.add(
      "navbar-scrolled"
    );
  } else {
    navbar.classList.remove(
      "navbar-scrolled"
    );
  }
}

window.addEventListener(
  "scroll",
  updateNavbar
);

// ============================================
// MOBILE NAV TOGGLE
// ============================================

const navToggle = document.querySelector('.nav-toggle');
const navbarEl = document.querySelector('.navbar');

if (navToggle && navbarEl) {
  navToggle.addEventListener('click', () => {
    const isOpen = navbarEl.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  // Close nav when a link is clicked (mobile)
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      if (navbarEl.classList.contains('nav-open')) {
        navbarEl.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation');
      }
    });
  });

  // Remove nav-open on resize above breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navbarEl.classList.contains('nav-open')) {
      navbarEl.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
    }
  });
}

// ============================================
// REDUCED MOTION SUPPORT
// ============================================

const prefersReducedMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

if (prefersReducedMotion.matches) {
  document
    .querySelectorAll(".fade-up")
    .forEach((el) => {
      el.classList.add("show");
    });
}

// ============================================
// FOOTER YEAR
// ============================================

const year =
  document.getElementById("year");

if (year) {
  year.textContent =
    new Date().getFullYear();
}