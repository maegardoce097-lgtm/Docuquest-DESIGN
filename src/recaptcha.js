const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const SCRIPT_ID = 'google-recaptcha-v3';

let recaptchaPromise;

function loadRecaptcha() {
  if (!SITE_KEY) {
    return Promise.reject(new Error('reCAPTCHA is not configured.'));
  }
  if (window.grecaptcha) {
    return Promise.resolve(window.grecaptcha);
  }
  if (!recaptchaPromise) {
    recaptchaPromise = new Promise((resolve, reject) => {
      let script = document.getElementById(SCRIPT_ID);
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
        script.async = true;
        script.defer = true;
      }

      script.addEventListener('load', () => {
        if (!window.grecaptcha) {
          reject(new Error('reCAPTCHA could not be loaded.'));
          return;
        }
        window.grecaptcha.ready(() => resolve(window.grecaptcha));
      }, { once: true });
      script.addEventListener('error', () => reject(new Error('reCAPTCHA could not be loaded.')), { once: true });

      if (!script.isConnected) document.head.append(script);
    }).catch((cause) => {
      recaptchaPromise = null;
      throw cause;
    });
  }
  return recaptchaPromise;
}

export async function initializeRecaptcha() {
  return loadRecaptcha();
}

export async function getRecaptchaToken(action) {
  const recaptcha = await loadRecaptcha();
  return recaptcha.execute(SITE_KEY, { action });
}