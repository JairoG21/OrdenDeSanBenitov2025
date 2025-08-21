// Path to language files (JSON)
const supportedLanguages = ['es', 'en'];
let currentLang = 'es';

// Fetch and apply the selected language
function setLanguage(lang) {
  if (!supportedLanguages.includes(lang)) lang = 'es';
  currentLang = lang;

  fetch(`assets/lang/${lang}.json`)
    .then(response => response.json())
    .then(data => applyTranslations(data))
    .catch(error => console.error('Error loading language file:', error));
}

// Apply translations to elements with data-key
function applyTranslations(translations) {
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (translations[key]) {
      if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
        el.placeholder = translations[key];
      } else if (el.tagName.toLowerCase() === 'meta') {
        el.setAttribute('content', translations[key]);
      } else if (el.tagName.toLowerCase() === 'title') {
        document.title = translations[key];
      } else {
        el.textContent = translations[key];
      }
    }
  });
}

// Initialize default language
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  const enBtn = document.querySelector('[data-key="lang_en"]');
  if (enBtn) enBtn.addEventListener('click', () => setLanguage('en'));
  const esBtn = document.querySelector('[data-key="lang_es"]');
  if (esBtn) esBtn.addEventListener('click', () => setLanguage('es'));
});
