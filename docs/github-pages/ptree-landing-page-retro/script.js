/**
 * PTREE Landing Page — RETRO-MODERN Interactive Script
 * ═══════════════════════════════════════════════════════════════════════════
 * Handles: copy buttons, demo tabs, smooth scrolling, and retro effects
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // COPY FUNCTIONALITY
  // ═══════════════════════════════════════════════════════════════════════════
  
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return Promise.resolve();
    } catch (err) {
      document.body.removeChild(textarea);
      return Promise.reject(err);
    }
  }

  function initCopyButtons() {
    const copyButtons = document.querySelectorAll('[data-copy]');
    
    copyButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-copy');
        const targetEl = document.getElementById(targetId);
        
        if (!targetEl) return;
        
        // Get text content, handling both pre blocks and sr-only spans
        let text = '';
        if (targetEl.classList.contains('sr-only')) {
          text = targetEl.textContent.trim();
        } else {
          // For code blocks, get the visible code element's text
          const codeEl = targetEl.querySelector('code');
          text = (codeEl || targetEl).textContent.trim();
        }
        
        try {
          await copyToClipboard(text);
          
          // Visual feedback
          const originalContent = btn.innerHTML;
          btn.classList.add('copied');
          btn.innerHTML = '<span class="copy-icon">✓</span>';
          
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = originalContent;
          }, 1500);
        } catch (err) {
          console.warn('Copy failed:', err);
          // Could add a tooltip here if needed
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEMO TABS
  // ═══════════════════════════════════════════════════════════════════════════
  
  function initDemoTabs() {
    const tabs = document.querySelectorAll('.demo-tab');
    const panels = document.querySelectorAll('.demo-panel');
    
    if (!tabs.length || !panels.length) return;
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetPanel = tab.getAttribute('data-tab');
        
        // Update tabs
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        
        // Update panels
        panels.forEach(p => {
          p.classList.remove('active');
        });
        
        const panel = document.querySelector(`[data-panel="${targetPanel}"]`);
        if (panel) {
          panel.classList.add('active');
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ═══════════════════════════════════════════════════════════════════════════
  
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        
        // Skip if it's just "#"
        if (targetId === '#') return;
        
        const targetEl = document.querySelector(targetId);
        
        if (targetEl) {
          e.preventDefault();
          
          // Account for sticky header
          const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
          const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Update URL without scrolling
          history.pushState(null, null, targetId);
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING EFFECT (Optional enhancement for hero)
  // ═══════════════════════════════════════════════════════════════════════════
  
  function initTypingEffect() {
    const heroCode = document.getElementById('hero-code');
    if (!heroCode) return;
    
    // Add a subtle "typing complete" effect after page load
    setTimeout(() => {
      heroCode.classList.add('typed');
    }, 500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  function initScrollAnimations() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    
    const animatedElements = document.querySelectorAll(
      '.feature-card, .profile-card, .install-card'
    );
    
    if (!animatedElements.length) return;
    
    // Add initial state
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => observer.observe(el));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER SCROLL EFFECT
  // ═══════════════════════════════════════════════════════════════════════════
  
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      // Add/remove scrolled class for styling
      if (currentScroll > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRT FLICKER EFFECT (Subtle)
  // ═══════════════════════════════════════════════════════════════════════════
  
  function initCRTEffect() {
    // Check for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    
    const overlay = document.querySelector('.crt-overlay');
    if (!overlay) return;
    
    // Occasional subtle flicker
    function flicker() {
      overlay.style.opacity = Math.random() * 0.03 + 0.97;
      
      setTimeout(() => {
        overlay.style.opacity = '1';
      }, 50);
    }
    
    // Random flickers
    setInterval(() => {
      if (Math.random() > 0.95) {
        flicker();
      }
    }, 2000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  function initKeyboardNav() {
    // Tab navigation for demo tabs
    const demoTabs = document.querySelectorAll('.demo-tab');
    
    demoTabs.forEach((tab, index) => {
      tab.addEventListener('keydown', (e) => {
        let newIndex;
        
        switch(e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            newIndex = (index + 1) % demoTabs.length;
            demoTabs[newIndex].focus();
            demoTabs[newIndex].click();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            newIndex = (index - 1 + demoTabs.length) % demoTabs.length;
            demoTabs[newIndex].focus();
            demoTabs[newIndex].click();
            break;
          case 'Home':
            e.preventDefault();
            demoTabs[0].focus();
            demoTabs[0].click();
            break;
          case 'End':
            e.preventDefault();
            demoTabs[demoTabs.length - 1].focus();
            demoTabs[demoTabs.length - 1].click();
            break;
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════════
  
  function init() {
    initCopyButtons();
    initDemoTabs();
    initSmoothScroll();
    initTypingEffect();
    initScrollAnimations();
    initHeaderScroll();
    initCRTEffect();
    initKeyboardNav();
    
    // Console easter egg
    console.log('%c⎇ PTREE', 'font-size: 24px; font-weight: bold; color: #00ff88;');
    console.log('%cPretty Trees for Pretty Docs', 'font-size: 12px; color: #8b949e;');
    console.log('%chttps://github.com/...', 'font-size: 11px; color: #484f58;');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
