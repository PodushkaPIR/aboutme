const CONFIG = {
  githubUser: 'PodushkaPIR',
  excludeForks: true,
  pinned: [],
  maxProjects: 9,
  cacheTtlMs: 60 * 60 * 1000,
};

const I18N = {
  ru: {
    nav_projects: 'Проекты',
    nav_about: 'Обо мне',
    hero_greeting: 'Привет, я',
    hero_bio: 'Разработчик. Пишу код, ломаю прод, чиню прод. Здесь собраны мои проекты с GitHub.',
    hero_cta: 'Мои проекты',
    projects_title: 'Проекты',
    projects_subtitle: 'Актуальные репозитории с GitHub',
    about_title: 'Обо мне',
    about_p1: 'Привет! Я разработчик, которому нравится превращать идеи в работающий код. Люблю open source, чистую архитектуру и инструменты, которые экономят время.',
    about_p2: 'В свободное время экспериментирую с новыми технологиями, пишу пет-проекты и делюсь ими на GitHub. Если хочешь сотрудничать — пиши!',
    footer_text: 'Сделано с душой',
    no_description: 'Описание отсутствует.',
    stars: 'звёзд',
    updated: (t) => `обновлено ${t}`,
    load_error: 'Не удалось загрузить проекты. Возможно, превышен лимит GitHub API.',
    retry: 'Повторить',
  },
  en: {
    nav_projects: 'Projects',
    nav_about: 'About me',
    hero_greeting: "Hi, I'm",
    hero_bio: 'Developer. I write code, break prod, fix prod. This site collects my GitHub projects.',
    hero_cta: 'My projects',
    projects_title: 'Projects',
    projects_subtitle: 'Fresh repositories from GitHub',
    about_title: 'About me',
    about_p1: "Hi! I'm a developer who enjoys turning ideas into working code. I love open source, clean architecture, and tools that save time.",
    about_p2: "In my free time I experiment with new technologies, build pet projects, and share them on GitHub. Feel free to reach out!",
    footer_text: 'Made with care',
    no_description: 'No description provided.',
    stars: 'stars',
    updated: (t) => `updated ${t}`,
    load_error: 'Failed to load projects. The GitHub API rate limit may be exceeded.',
    retry: 'Retry',
  },
};

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Lua: '#000080',
  Vue: '#41b883',
  Zig: '#ec915c',
  Nix: '#7e7eff',
};

let currentLang = 'ru';

function t(key) {
  return I18N[currentLang][key];
}

function detectLang() {
  const saved = localStorage.getItem('lang');
  if (saved && I18N[saved]) return saved;
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function applyLang(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = t(el.dataset.i18n);
    if (typeof value === 'string') el.textContent = value;
  });

  document.querySelectorAll('.lang-switch button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  renderCachedProjects();
}

async function fetchRepos() {
  const cacheKey = `repos:${CONFIG.githubUser}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < CONFIG.cacheTtlMs && Array.isArray(data)) return data;
    } catch {}
  }

  const res = await fetch(
    `https://api.github.com/users/${CONFIG.githubUser}/repos?per_page=100&sort=updated&nocache=${Date.now()}`
  );
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const repos = await res.json();
  localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: repos }));
  return repos;
}

function selectRepos(repos) {
  let list = repos.filter((r) => !CONFIG.excludeForks || !r.fork);

  if (CONFIG.pinned.length > 0) {
    list.sort((a, b) => {
      const ia = CONFIG.pinned.indexOf(a.name);
      const ib = CONFIG.pinned.indexOf(b.name);
      if (ia !== -1 || ib !== -1) {
        return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
      }
      return 0;
    });
    const pinnedSet = new Set(CONFIG.pinned);
    const rest = list
      .filter((r) => !pinnedSet.has(r.name))
      .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at));
    return [...list.filter((r) => pinnedSet.has(r.name)), ...rest].slice(0, CONFIG.maxProjects);
  }

  return list
    .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, CONFIG.maxProjects);
}

function relativeTime(dateStr) {
  const rtf = new Intl.RelativeTimeFormat(currentLang === 'ru' ? 'ru' : 'en', { numeric: 'auto' });
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const days = Math.round(diffMs / 86400000);
  if (Math.abs(days) >= 30) {
    const months = Math.round(days / 30);
    if (Math.abs(months) >= 12) return rtf.format(Math.round(days / 365), 'year');
    return rtf.format(months, 'month');
  }
  return rtf.format(days, 'day');
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svgIcon(path, size = 14) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', path);
  svg.appendChild(p);
  return svg;
}

const ICONS = {
  star: 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z',
  link: 'M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z',
};

function renderCard(repo) {
  const card = el('article', 'card');

  const header = el('div', 'card-header');
  const title = el('a', 'card-title', repo.name);
  title.href = repo.html_url;
  title.target = '_blank';
  title.rel = 'noopener noreferrer';
  header.appendChild(title);

  const linkIcon = el('a', 'card-link-icon');
  linkIcon.href = repo.homepage || repo.html_url;
  linkIcon.target = '_blank';
  linkIcon.rel = 'noopener noreferrer';
  linkIcon.title = repo.homepage ? repo.homepage : repo.name;
  linkIcon.appendChild(svgIcon(ICONS.link));
  header.appendChild(linkIcon);
  card.appendChild(header);

  card.appendChild(el('p', 'card-desc', repo.description || t('no_description')));

  if (Array.isArray(repo.topics) && repo.topics.length > 0) {
    const topics = el('div', 'card-topics');
    repo.topics.slice(0, 3).forEach((topic) => topics.appendChild(el('span', 'topic', topic)));
    card.appendChild(topics);
  }

  const meta = el('div', 'card-meta');

  if (repo.language) {
    const langItem = el('span', 'meta-item');
    const dot = el('span', 'lang-dot');
    dot.style.backgroundColor = LANG_COLORS[repo.language] || '#8b949e';
    langItem.appendChild(dot);
    langItem.appendChild(document.createTextNode(repo.language));
    meta.appendChild(langItem);
  }

  const stars = el('span', 'meta-item');
  stars.appendChild(svgIcon(ICONS.star));
  stars.appendChild(document.createTextNode(`${repo.stargazers_count}`));
  stars.title = t('stars');
  meta.appendChild(stars);

  meta.appendChild(el('span', 'meta-item', t('updated')(relativeTime(repo.pushed_at))));
  card.appendChild(meta);

  return card;
}

function showSkeletons() {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';
  for (let i = 0; i < CONFIG.maxProjects; i++) {
    grid.appendChild(el('div', 'skeleton-card'));
  }
}

function showError() {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';
  const state = el('div', 'error-state');
  state.appendChild(el('p', null, t('load_error')));
  const retry = el('button', 'btn btn-primary', t('retry'));
  retry.type = 'button';
  retry.addEventListener('click', () => {
    localStorage.removeItem(`repos:${CONFIG.githubUser}`);
    loadProjects();
  });
  state.appendChild(retry);
  grid.appendChild(state);
}

function renderProjects(repos) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';
  selectRepos(repos).forEach((repo) => grid.appendChild(renderCard(repo)));
  sessionStorage.setItem('reposData', JSON.stringify(repos));
}

function renderCachedProjects() {
  const raw = sessionStorage.getItem('reposData');
  if (!raw) return;
  try {
    const grid = document.getElementById('projects-grid');
    if (grid.querySelector('.card')) renderProjects(JSON.parse(raw));
  } catch {}
}

async function loadProjects() {
  showSkeletons();
  try {
    renderProjects(await fetchRepos());
  } catch {
    showError();
  }
}

document.querySelectorAll('.lang-switch button').forEach((btn) => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

document.getElementById('year').textContent = new Date().getFullYear();

applyLang(detectLang());
loadProjects();
