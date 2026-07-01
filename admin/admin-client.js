/**
 * Admin shared client for Xiangtan Zhonghuan Water website backend.
 * Include before any admin page logic:
 *   <script src="admin-client.js"></script>
 *
 * Provides:
 *   window._adminClient = { init, getClient, getUser, login, logout, checkAuth, renderShell, toast }
 *
 * Dispatches:
 *   'admin:ready'   — user is authenticated, client is ready
 *   'admin:unauth'  — no session found, page should redirect to login
 */
var SUPABASE_URL = 'https://yyjnpxjbnjuupqdwuuoq.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_Wa1vSAlz748umLRKBkTgWg_HROPciyE';

(function () {
  if (window._adminClient) return;

  var _client = null;
  var _user = null;
  var _initialized = false;
  var _readyDispatched = false;
  var _listeners = [];

  function _dispatch(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }

  // ==================== Toast ====================
  function toast(message, type) {
    type = type || 'info'; // 'success' | 'error' | 'info'
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    var el = document.createElement('div');
    el.textContent = message;
    var bg = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#1a56db';
    el.style.cssText = 'background:' + bg + ';color:#fff;padding:10px 18px;border-radius:6px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2);animation:fadeIn 0.25s ease;max-width:360px;word-break:break-all;';
    container.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(function () { el.remove(); }, 300);
    }, 3000);
  }

  // ==================== Render Shell ====================
  function renderShell(pageTitle) {
    var currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

    var navItems = [
      { key: 'index',     label: '📊 仪表盘',         href: 'index.html' },
      { key: 'news',      label: '📰 公司要闻管理',    href: 'news.html' },
      { key: 'notices',   label: '📋 通知公告管理',    href: 'notices.html' },
      { key: 'photo-news',label: '🖼️ 图片新闻管理',    href: 'photo-news.html' },
      { key: 'media',     label: '📺 媒体聚焦管理',    href: 'media.html' },
      { key: 'topics',    label: '📌 专题专栏管理',    href: 'topics.html' },
      { key: 'videos',    label: '🎬 视频管理',        href: 'videos.html' },
    ];

    var navHTML = navItems.map(function (n) {
      var active = (currentPage === n.key) ? ' style="background:rgba(255,255,255,0.15);color:#fff;border-left:3px solid #fff;"' : '';
      return '<a href="' + n.href + '"' + active + '>' + n.label + '</a>';
    }).join('');

    var html =
      '<div class="admin-layout">' +
        '<aside class="admin-sidebar">' +
          '<div class="sidebar-brand">' +
            '<div class="sidebar-logo">💧</div>' +
            '<div class="sidebar-title">后台管理</div>' +
          '</div>' +
          '<nav class="sidebar-nav">' + navHTML + '</nav>' +
          '<div class="sidebar-footer">' +
            '<a href="../index.html" target="_blank">🏠 查看网站</a>' +
            '<a href="#" id="btnLogout">🚪 退出登录</a>' +
          '</div>' +
        '</aside>' +
        '<div class="admin-main">' +
          '<header class="admin-topbar">' +
            '<h2>' + pageTitle + '</h2>' +
            '<div class="topbar-user">' +
              '<span id="adminUserEmail"></span>' +
            '</div>' +
          '</header>' +
          '<main class="admin-content" id="adminContent"></main>' +
        '</div>' +
      '</div>';

    // Inject shell at start of body
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);

    // Inject minimal global styles
    var style = document.createElement('style');
    style.textContent =
      ':root { --primary: #1a56db; --primary-dark: #0f3dab; --bg: #f1f5f9; --text: #1e293b; --text-light: #64748b; --white: #fff; --border: #e2e8f0; --radius: 6px; --shadow: 0 1px 3px rgba(0,0,0,0.08); --shadow-md: 0 4px 12px rgba(0,0,0,0.1); }' +
      '* { margin:0; padding:0; box-sizing:border-box; }' +
      'body { font-family:"PingFang SC","Microsoft YaHei","Helvetica Neue",sans-serif; color:var(--text); background:var(--bg); font-size:14px; line-height:1.7; }' +
      'a { text-decoration:none; color:inherit; }' +
      '.admin-layout { display:flex; min-height:100vh; }' +
      '.admin-sidebar { width:240px; background:linear-gradient(180deg, #0f2b6e 0%, #1a56db 100%); color:#fff; display:flex; flex-direction:column; flex-shrink:0; position:fixed; top:0; left:0; bottom:0; z-index:100; }' +
      '.sidebar-brand { display:flex; align-items:center; gap:12px; padding:20px 18px; border-bottom:1px solid rgba(255,255,255,0.15); }' +
      '.sidebar-logo { width:40px; height:40px; background:rgba(255,255,255,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }' +
      '.sidebar-title { font-size:16px; font-weight:600; letter-spacing:1px; }' +
      '.sidebar-nav { flex:1; padding:12px 0; overflow-y:auto; }' +
      '.sidebar-nav a { display:block; padding:10px 18px; color:rgba(255,255,255,0.8); font-size:14px; transition:all 0.2s; border-left:3px solid transparent; }' +
      '.sidebar-nav a:hover { background:rgba(255,255,255,0.1); color:#fff; }' +
      '.sidebar-footer { padding:12px 18px; border-top:1px solid rgba(255,255,255,0.15); display:flex; flex-direction:column; gap:4px; }' +
      '.sidebar-footer a { color:rgba(255,255,255,0.7); font-size:13px; padding:6px 0; transition:color 0.2s; }' +
      '.sidebar-footer a:hover { color:#fff; }' +
      '.admin-main { margin-left:240px; flex:1; display:flex; flex-direction:column; }' +
      '.admin-topbar { background:#fff; border-bottom:1px solid var(--border); padding:14px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; position:sticky; top:0; z-index:50; }' +
      '.admin-topbar h2 { font-size:18px; font-weight:600; }' +
      '.topbar-user { font-size:13px; color:var(--text-light); display:flex; align-items:center; gap:12px; }' +
      '.admin-content { flex:1; padding:24px; }' +
      '@media (max-width:768px) {' +
        '.admin-sidebar { width:200px; }' +
        '.admin-main { margin-left:200px; }' +
        '.admin-content { padding:16px; }' +
      '}' +
      '@media (max-width:600px) {' +
        '.admin-sidebar { display:none; }' +
        '.admin-main { margin-left:0; }' +
      '}' +
      '@keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }' +
      '@keyframes spin { to { transform:rotate(360deg); } }';
    document.head.appendChild(style);

    // Populate user email
    if (_user && _user.email) {
      var el = document.getElementById('adminUserEmail');
      if (el) el.textContent = '👤 ' + _user.email;
    }

    // Bind logout
    var btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function (e) {
        e.preventDefault();
        window._adminClient.logout();
      });
    }
  }

  // ==================== Init ====================
  function init() {
    if (_initialized) return;
    _initialized = true;

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = function () {
      try {
        _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Check existing session
        _client.auth.getSession().then(function (r) {
          if (r.data && r.data.session) {
            _user = r.data.session.user;
            if (!_readyDispatched) { _readyDispatched = true; _dispatch('admin:ready', { user: _user }); }
          } else {
            _dispatch('admin:unauth');
          }
        }).catch(function () {
          _dispatch('admin:unauth');
        });

        // Listen for auth state changes
        _client.auth.onAuthStateChange(function (event, session) {
          if (event === 'SIGNED_IN' && session) {
            _user = session.user;
            if (!_readyDispatched) { _readyDispatched = true; _dispatch('admin:ready', { user: _user }); }
          } else if (event === 'SIGNED_OUT') {
            _user = null;
            _readyDispatched = false;
            _dispatch('admin:unauth');
          } else if (event === 'TOKEN_REFRESHED' && session) {
            _user = session.user;
          }
        });
      } catch (e) {
        console.warn('Admin client init failed:', e.message);
        _dispatch('admin:unauth');
      }
    };
    script.onerror = function () {
      console.warn('Supabase CDN unreachable for admin.');
      _dispatch('admin:unauth');
    };
    document.head.appendChild(script);
  }

  // ==================== Public API ====================
  window._adminClient = {
    init: init,
    getClient: function () { return _client; },
    getUser: function () { return _user; },

    login: function (email, password) {
      if (!_client) throw new Error('Client not ready');
      return _client.auth.signInWithPassword({ email: email, password: password });
    },

    logout: function () {
      if (_client) {
        _client.auth.signOut().then(function () {
          window.location.href = 'login.html';
        });
      } else {
        window.location.href = 'login.html';
      }
    },

    checkAuth: function () {
      if (!_user) {
        window.location.href = 'login.html';
        return false;
      }
      return true;
    },

    // Upload image to Supabase Storage 'media' bucket
    // Returns the public URL string. Throws on error.
    uploadImage: async function (file) {
      if (!_client) throw new Error('客户端未就绪');
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      var fileName = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      var r = await _client.storage.from('media').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (r.error) throw new Error('上传失败: ' + r.error.message);
      var urlR = _client.storage.from('media').getPublicUrl(fileName);
      return urlR.data.publicUrl;
    },

    renderShell: renderShell,
    toast: toast
  };

  // Auto-init
  init();
})();
