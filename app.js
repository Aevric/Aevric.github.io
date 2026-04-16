const CONFIG = {
  rootDir: "/docs/",
  maxFiles: 200
};

let currentPath = CONFIG.rootDir;
let pathStack = [{ name: "文档", path: CONFIG.rootDir }];

const DOM = {
  grid: document.getElementById("grid"),
  loading: document.getElementById("loading"),
  breadcrumb: document.getElementById("breadcrumb"),
  fileView: document.getElementById("fileView"),
  docView: document.getElementById("docView"),
  backBtn: document.getElementById("backBtn"),
  content: document.getElementById("content"),
  toc: document.getElementById("toc")
};

DOM.backBtn.addEventListener("click", () => {
  DOM.fileView.classList.remove("hidden");
  DOM.docView.classList.remove("show");
  DOM.backBtn.classList.remove("show");
});

function formatName(str) {
  return str.replace(/\.md$/i, "").replace(/[_-]/g, " ").trim();
}

function renderBreadcrumb() {
  DOM.breadcrumb.innerHTML = "";
  pathStack.forEach((item, idx) => {
    const span = document.createElement("span");
    span.textContent = item.name;
    span.onclick = () => jumpToPath(idx);
    DOM.breadcrumb.appendChild(span);

    if (idx < pathStack.length - 1) {
      const d = document.createElement("span");
      d.className = "divider";
      d.textContent = "/";
      DOM.breadcrumb.appendChild(d);
    }
  });
}

function jumpToPath(index) {
  pathStack = pathStack.slice(0, index + 1);
  currentPath = pathStack[index].path;
  renderBreadcrumb();
  loadCurrentDir();
}

function enterDir(name, path) {
  currentPath = path;
  pathStack.push({ name, path });
  renderBreadcrumb();
  loadCurrentDir();
}

async function loadCurrentDir() {
  DOM.grid.innerHTML = '<div id="loading" class="loading">加载中...</div>';
  try {
    const res = await fetch(currentPath, { cache: "no-store" });
    if (!res.ok) throw new Error("目录访问失败");
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const links = doc.querySelectorAll("a");

    const folders = [];
    const files = [];

    for (const link of links) {
      let href = link.getAttribute("href");
      if (!href || href.includes("?") || href === "../") continue;
      try {
        href = decodeURIComponent(href);
      } catch (e) {}

      if (href.endsWith("/")) {
        const folderName = href.replace(/\//g, "");
        if (folderName) folders.push({ name: folderName, path: currentPath + href });
      } else if (href.toLowerCase().endsWith(".md")) {
        files.push({ name: href, path: currentPath + href });
      }
    }

    DOM.grid.innerHTML = "";
    if (folders.length === 0 && files.length === 0) {
      DOM.grid.innerHTML = `
        <div class="empty-folder">
          <div class="empty-icon"><i class="fa fa-folder-o"></i></div>
          <p class="empty-text">暂无任何文件或文件夹</p>
        </div>
      `;
      return;
    }

    folders.forEach(f => {
      const card = createCard("folder", f.name, "文件夹", f.path);
      card.onclick = () => enterDir(f.name, f.path);
      DOM.grid.appendChild(card);
    });

    files.forEach(f => {
      const title = formatName(f.name);
      const card = createCard("file", title, f.name, f.path);
      card.onclick = () => openFile(f.path);
      DOM.grid.appendChild(card);
    });

  } catch (err) {
    DOM.grid.innerHTML = `
      <div class="empty-folder">
        <div class="empty-icon"><i class="fa fa-exclamation-circle"></i></div>
        <p class="empty-text">无法读取目录</p>
      </div>
    `;
  }
}

function createCard(type, title, desc, path) {
  const el = document.createElement("div");
  el.className = "card";
  const icon = type === "folder"
    ? `<div class="card-icon folder-icon"><i class="fa fa-folder"></i></div>`
    : `<div class="card-icon file-icon"><i class="fa fa-file-text-o"></i></div>`;
  el.innerHTML = `${icon}<div class="card-title">${title}</div><div class="card-desc">${desc}</div>`;
  return el;
}

async function openFile(path) {
  DOM.fileView.classList.add("hidden");
  DOM.docView.classList.add("show");
  DOM.backBtn.classList.add("show");
  DOM.content.innerHTML = `<div class="loading">加载中...</div>`;
  DOM.toc.innerHTML = "";

  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("文件加载失败");
    const text = await res.text();
    DOM.content.innerHTML = marked.parse(text);
    document.querySelectorAll("pre code").forEach(block => {
      try { hljs.highlightElement(block); } catch (e) {}
    });
    generateToc();
  } catch (e) {
    DOM.content.innerHTML = `<div class="empty-folder"><p style="color:#ef4444">打开失败</p></div>`;
  }
}

function generateToc() {
  const heads = document.querySelectorAll(".markdown-body h1, .markdown-body h2");
  if (!heads.length) return;
  let html = `<h3><i class="fa fa-list"></i> 目录</h3><ul class="toc-list">`;
  heads.forEach((h, i) => {
    h.id = `h_${i}`;
    html += `<li class="toc-item"><a href="#h_${i}">${h.textContent.trim()}</a></li>`;
  });
  DOM.toc.innerHTML = html + "</ul>";
}

window.addEventListener("load", () => {
  renderBreadcrumb();
  loadCurrentDir();
});
