/* ==========================================================================
   ALPHA TECH SOLUTIONS - Core Frontend JS
   Design. Develop. Grow.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Initialize subsystems
  initPreloader();
  initNavbar();
  initFaqAccordion();
  initScrollAnimations();
  initReadinessAssessment();
  initContactForm();
  initPortfolioTabs();
  initThemeToggle();
});

/**
   Hides preloading screen on load
 */
function initPreloader() {
  const loader = document.getElementById('loader-screen');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500); // Wait for fade-out transition
      }, 300); // Brief visual buffer
    });
  }
}

/**
   Navbar scroll effects, active link highlight, and hamburger toggling
 */
function initNavbar() {
  const header = document.querySelector('.header');
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky header scroll behavior
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
    highlightActiveLink();
  });

  // Mobile menu click toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    nav.classList.toggle('nav-active');
    document.body.style.overflow = nav.classList.contains('nav-active') ? 'hidden' : 'auto';
  });

  // Close mobile nav on click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      nav.classList.remove('nav-active');
      document.body.style.overflow = 'auto';
    });
  });

  // Scroll spy active link
  const sections = document.querySelectorAll('section[id]');
  
  function highlightActiveLink() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120; // Fixed header offset
      const sectionId = current.getAttribute('id');
      const targetNavLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);
      
      if (targetNavLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navLinks.forEach(link => link.classList.remove('active'));
          targetNavLink.classList.add('active');
        }
      }
    });
  }
}

/**
   Accordion FAQ controller
 */
function initFaqAccordion() {
  const faqHeaders = document.querySelectorAll('.faq-header');

  faqHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const faqCard = header.parentElement;
      const faqBody = faqCard.querySelector('.faq-body');
      const isActive = faqCard.classList.contains('active');

      // Close other accordions
      document.querySelectorAll('.faq-card').forEach(card => {
        card.classList.remove('active');
        card.querySelector('.faq-body').style.height = '0px';
      });

      // Toggle current panel
      if (!isActive) {
        faqCard.classList.add('active');
        faqBody.style.height = `${faqBody.scrollHeight}px`;
      } else {
        faqCard.classList.remove('active');
        faqBody.style.height = '0px';
      }
    });
  });
}

/**
   Intersection Observer for scroll animation triggers
 */
function initScrollAnimations() {
  const scrollElements = document.querySelectorAll('.fade-in-scroll, .slide-up-scroll, .slide-left-scroll, .slide-right-scroll');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target); // Trigger once
        }
      });
    }, {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    scrollElements.forEach(el => observer.observe(el));
  } else {
    // Fallback
    scrollElements.forEach(el => el.classList.add('animate'));
  }
}

/**
   Digital Readiness Assessment Quiz System
 */
function initReadinessAssessment() {
  const steps = document.querySelectorAll('.assessment-step');
  const quizWrapper = document.getElementById('assessment-quiz-wrapper');
  const resultsWrapper = document.getElementById('assessment-results-wrapper');
  const scoreText = document.getElementById('score-text');
  const scoreLabel = document.getElementById('score-label');
  const scoreRingFill = document.getElementById('score-ring-fill');
  const recommendationsList = document.getElementById('recommendations-list');
  const resetBtn = document.getElementById('assessment-reset-btn');

  let currentStep = 0;
  let userResponses = [];

  // Add click listeners to option buttons
  steps.forEach((step, stepIdx) => {
    const optionBtns = step.querySelectorAll('.assessment-option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const score = parseInt(btn.getAttribute('data-score'), 10);
        const text = btn.textContent.trim();
        userResponses.push({ score, text });

        // Advance step or show results
        step.classList.remove('active');
        if (stepIdx < steps.length - 1) {
          steps[stepIdx + 1].classList.add('active');
        } else {
          showAssessmentResults();
        }
      });
    });
  });

  function showAssessmentResults() {
    let totalScore = userResponses.reduce((sum, item) => sum + item.score, 0);
    
    // Safety clamp
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Animate SVG Ring
    // Circumference = 2 * PI * r = 2 * PI * 70 = 439.82
    const circumference = 440;
    const offset = circumference - (totalScore / 100) * circumference;
    scoreRingFill.style.strokeDashoffset = offset;
    scoreText.textContent = `${totalScore}/100`;

    // Categorize
    let label = 'Low Readiness';
    let labelColor = 'var(--error)';
    if (totalScore >= 75) {
      label = 'Ready to Scale';
      labelColor = 'var(--success)';
    } else if (totalScore >= 40) {
      label = 'Moderate Readiness';
      labelColor = 'var(--primary)';
    }

    scoreLabel.textContent = label;
    scoreLabel.style.color = labelColor;
    scoreRingFill.style.stroke = labelColor;

    // Recommendations Builder
    recommendationsList.innerHTML = '';
    
    // Q1: Website status
    if (userResponses[0].score === 0) {
      addRecommendation('Establish a modern, mobile-responsive web presence to capture online opportunities.');
    } else if (userResponses[0].score === 10) {
      addRecommendation('Redesign your outdated website. Focus on loading speed, core SEO tags, and mobile interfaces.');
    }

    // Q2: SEO status
    if (userResponses[1].score === 0) {
      addRecommendation('Implement semantic layouts, structured JSON-LD schemas, and keyword mapping to build search authority.');
    } else if (userResponses[1].score === 10) {
      addRecommendation('Conduct a search audit. Restructure page speeds and backlink paths to improve ranking conversions.');
    }

    // Q3: GMB Status
    if (userResponses[2].score === 0) {
      addRecommendation('Claim and verify a Google Business Profile to capture local Mysuru/regional map directories.');
    } else if (userResponses[2].score === 10) {
      addRecommendation('Update details, upload graphics, and request customer reviews on your Google Business listing.');
    }

    // Q4: Online leads
    if (userResponses[3].score === 0 || userResponses[3].score === 10) {
      addRecommendation('Integrate dedicated lead forms, WhatsApp shortcuts, and client CTAs to optimize conversion pipelines.');
    }

    // fallback if everything is perfect
    if (totalScore === 100) {
      addRecommendation('Excellent digital foundation. Focus on advanced web application portals, analytics tracking, or cybersecurity testing.');
    }

    quizWrapper.style.display = 'none';
    resultsWrapper.style.display = 'block';
  }

  function addRecommendation(text) {
    const li = document.createElement('li');
    li.textContent = text;
    recommendationsList.appendChild(li);
  }

  // Reset Assessment
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      userResponses = [];
      resultsWrapper.style.display = 'none';
      quizWrapper.style.display = 'block';
      steps.forEach(step => step.classList.remove('active'));
      steps[0].classList.add('active');
      scoreRingFill.style.strokeDashoffset = 440;
    });
  }
}

// Complexity Estimator function removed

/**
   Form Handling & Validation & Nodemailer dispatch
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const successMessage = document.getElementById('form-success');
  const errorMessage = document.getElementById('form-error');
  const successRefId = document.getElementById('success-ref-id');
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitBtnText = submitBtn.querySelector('.btn-text');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset feedback banners
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    // Extract values
    const name = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email-address').value.trim();
    const phone = document.getElementById('phone-number').value.trim();
    const businessName = document.getElementById('business-name').value.trim();
    const serviceRequired = document.getElementById('service-required').value;
    const preferredContact = document.getElementById('preferred-contact').value;
    const message = document.getElementById('message').value.trim();
    const honeypot = document.getElementById('honeypot').value;

    // 1. Client-Side Field Validations
    if (!name || name.length < 2) {
      showFormFeedback(errorMessage, 'Validation Error', 'Please enter a valid name (at least 2 letters).');
      return;
    }

    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!email || !emailRegex.test(email.toLowerCase())) {
      showFormFeedback(errorMessage, 'Validation Error', 'Please enter a valid email address.');
      return;
    }

    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone.replace(/\s+/g, ''))) {
      showFormFeedback(errorMessage, 'Validation Error', 'Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (!businessName || businessName.length < 2) {
      showFormFeedback(errorMessage, 'Validation Error', 'Please enter a valid business name.');
      return;
    }

    if (!serviceRequired) {
      showFormFeedback(errorMessage, 'Validation Error', 'Please select a service from the options.');
      return;
    }

    if (!preferredContact) {
      showFormFeedback(errorMessage, 'Validation Error', 'Please select a preferred contact method.');
      return;
    }

    if (!message || message.length < 10) {
      showFormFeedback(errorMessage, 'Validation Error', 'Please elaborate on your requirements (at least 10 letters).');
      return;
    }

    // Set Loading state
    submitBtn.disabled = true;
    const originalText = submitBtnText.textContent;
    submitBtnText.textContent = 'Submitting Enquiry...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          businessName,
          serviceRequired,
          preferredContact,
          message,
          honeypot
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // success flow
        successRefId.textContent = result.leadId;
        successMessage.style.display = 'flex';
        form.reset();
        
        // Scroll smoothly to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        // backend validation fail
        showFormFeedback(errorMessage, 'Submission Failed', result.message || 'Please try again later or contact us directly at alphatechsolutions.in@gmail.com.');
      }

    } catch (err) {
      console.error('API Post Connection Error:', err);
      showFormFeedback(errorMessage, 'Connection Error', 'Failed to connect to backend server. Please check your network or try again.');
    } finally {
      // Revert loading UI
      submitBtn.disabled = false;
      submitBtnText.textContent = originalText;
    }
  });
}

function showFormFeedback(bannerElement, title, text) {
  const bannerTitle = bannerElement.querySelector('.form-message-title');
  const bannerText = bannerElement.querySelector('.form-message-text');
  
  if (bannerTitle) bannerTitle.textContent = title;
  if (bannerText) bannerText.textContent = text;
  
  bannerElement.style.display = 'flex';
  bannerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
   Interactive tab toggling inside the browser mockup in portfolio featured case study
 */
function initPortfolioTabs() {
  const cards = document.querySelectorAll('.portfolio-card.featured');

  cards.forEach(card => {
    const tabs = card.querySelectorAll('.portfolio-tab');
    const screens = card.querySelectorAll('.portfolio-screen-img');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Scope the resets to this specific card only
        tabs.forEach(t => t.classList.remove('active'));
        screens.forEach(s => s.classList.remove('active'));

        // Activate the clicked tab and corresponding screenshot image
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        const targetScreen = card.querySelector(`#${targetId}`);
        if (targetScreen) {
          targetScreen.classList.add('active');
        }
      });
    });
  });
}

/**
   Light/Dark Theme persistent toggle handler
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}
