(function () {
  const listEl = document.querySelector('[data-blog-list]');
  if (!listEl) return;

  const loadingEl = listEl.querySelector('[data-blog-loading]');
  const emptyEl = document.querySelector('[data-blog-empty]');
  const limitAttr = listEl.getAttribute('data-blog-limit');
  const limit = limitAttr ? parseInt(limitAttr, 10) : 3;
  const manifestPath = listEl.getAttribute('data-blog-manifest') || './blog/posts.json';
  const basePath = listEl.getAttribute('data-blog-base') || './blog';
  const viewerBase = basePath.replace(/\/$/, '');

  const clearLoading = () => {
    if (loadingEl && loadingEl.parentElement) {
      loadingEl.parentElement.removeChild(loadingEl);
    }
  };

  const showEmpty = () => {
    clearLoading();
    if (emptyEl) {
      emptyEl.hidden = false;
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPost = (post, index) => {
    const article = document.createElement('article');
    article.className = 'blog-card';
    if (post && (post.feature || index === 0)) {
      article.classList.add('blog-card--feature');
    }

    const meta = document.createElement('div');
    meta.className = 'blog-card__meta';
    const bits = [];
    if (post.date) bits.push(formatDate(post.date));
    if (post.tagline) bits.push(post.tagline);
    meta.textContent = bits.join(' • ') || 'Fresh drop';

    const title = document.createElement('h3');
    title.className = 'blog-card__title';
    title.textContent = post.title || post.slug;

    const excerpt = document.createElement('p');
    excerpt.className = 'blog-card__excerpt';
    excerpt.textContent = post.description || 'Crack open the shell to read more.';

    const cta = document.createElement('a');
    cta.className = 'blog-card__cta';
    cta.href = `${viewerBase}/viewer.html?post=${encodeURIComponent(post.slug)}`;
    cta.textContent = 'Read update';

    article.append(meta, title, excerpt, cta);
    listEl.appendChild(article);
  };

  const hydrate = (posts) => {
    clearLoading();
    if (!posts || posts.length === 0) {
      showEmpty();
      return;
    }

    const count = Number.isFinite(limit) && limit > 0 ? limit : posts.length;
    posts
      .slice(0, count)
      .forEach((post, index) => {
        renderPost(post, index);
      });
  };

  fetch(manifestPath, { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error('network');
      return res.json();
    })
    .then((data) => {
      if (Array.isArray(data)) {
        hydrate(data);
      } else if (Array.isArray(data.posts)) {
        hydrate(data.posts);
      } else {
        throw new Error('bad manifest');
      }
    })
    .catch((error) => {
      console.warn('Unable to load blog posts', error);
      showEmpty();
    });
})();
