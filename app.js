const CONFIG = {
  base: window.location.pathname.split('/')[1] ? `/${window.location.pathname.split('/')[1]}/` : '/',
  get docRoot() { return this.base + 'docs/'; }
};

const FILE_TREE = {
  "": [
    { type: "file", name: "openppl.md", path: "openppl.md" },
    { type: "folder", name: "算法笔记", path: "算法笔记/" }
  ],
  "算法笔记/": [
    { type: "file", name: "机器学习基础.md", path: "算法笔记/机器学习基础.md" }
  ]
};

let currentPathKey = "";
let pathStack = [{ name: "文档", pathKey: "" }];

const DOM = {
  grid: document.getElementById("grid"),
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
  currentPathKey = pathStack[index].pathKey;
  renderBreadcrumb();
  renderDir();
}

function enterDir(name, pathKey) {
  currentPathKey = pathKey;
  pathStack.push({ name, pathKey });
  renderBreadcrumb();
  renderDir();
}

// 🔥 不 fetch 目录，直接读 FILE_TREE（GitHub Pages 唯一可靠方式）
function renderDir() {
  DOM.grid.innerHTML = "";
  const list = FILE_TREE[currentPathKey] || [];
  if (list.length === 0) {
    DOM.grid.innerHTML = `
      <div class="empty-folder">
        <div class="empty-icon"><i class="fa fa-folder-o"></i></div>
        <p class="empty-text">暂无文件</p>
      </div>`;
    return;
  }
  list.forEach(item => {
    const fullPath = CONFIG.docRoot + item.path;
    const card = createCard(
      item.type,
      formatName(item.name),
      item.type === "folder" ? "文件夹" : item.name,
      fullPath
    );
    card.onclick = () => {
      item.type === "folder"
        ? enterDir(formatName(item.name), item.path)
        : openFile(fullPath);
    };
    DOM.grid.appendChild(card);
  });
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
    if (!res.ok) throw new Error(`404: ${path}`);
    const text = await res.text();
    DOM.content.innerHTML = marked.parse(text);
    document.querySelectorAll("pre code").forEach(block => hljs.highlightElement(block));
    generateToc();
    MathJax.typesetPromise([DOM.content]);
  } catch (e) {
    DOM.content.innerHTML = `<div class="empty-folder"><p style="color:red">打开失败：${e.message}</p></div>`;
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
  renderDir();
});
