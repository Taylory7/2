/**
 * Supabase shared client for Xiangtan Zhonghuan Water website.
 * Include before any page-specific Supabase logic:
 *   <script src="supabase-client.js"></script>
 *
 * Places window.supabase after loading. Dispatches:
 *   'supabase:ready' — client is available at window.supabase
 *   'supabase:error' — CDN or init failure (hardcoded HTML stays as fallback)
 */

// -- Replace with your Supabase project credentials --
var SUPABASE_URL = 'https://yyjnpxjbnjuupqdwuuoq.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_Wa1vSAlz748umLRKBkTgWg_HROPciyE';

(function () {
  if (window._supabaseLoaded) return;
  window._supabaseLoaded = true;

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = function () {
    try {
      window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.dispatchEvent(new CustomEvent('supabase:ready'));
    } catch (e) {
      console.warn('Supabase init failed:', e.message);
      window.dispatchEvent(new CustomEvent('supabase:error'));
    }
  };
  script.onerror = function () {
    console.warn('Supabase CDN unreachable, using fallback content.');
    window.dispatchEvent(new CustomEvent('supabase:error'));
  };
  document.head.appendChild(script);
})();
