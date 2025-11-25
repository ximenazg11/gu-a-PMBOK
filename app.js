// Basic PMBOK editor with persistence (diagrams and documents saved as base64 in localStorage)
// Uses mermaid.js for diagram rendering and pdf.js for viewing PDFs.

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

// PDF.js worker
if (window['pdfjsLib']) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
}

// ---------- App state ----------
let appState = {
  chapters: [],
  currentChapter: null,
  currentSubchapter: null,
};

// ---------- Helpers ----------
function generateId() {
  return "id-" + Math.random().toString(36).slice(2, 10);
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString();
}

function saveAppState() {
  localStorage.setItem("pmbokEditor", JSON.stringify(appState));
}

function loadAppState() {
  const saved = localStorage.getItem("pmbokEditor");
  if (saved) {
    try {
      appState = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
}

// ---------- Elements ----------
const chaptersList = document.getElementById("chaptersList");
const addChapterBtn = document.getElementById("addChapterBtn");
const expandAllBtn = document.getElementById("expandAllBtn");
const collapseAllBtn = document.getElementById("collapseAllBtn");

const editorTitle = document.getElementById("editorTitle");
const chapterEditor = document.getElementById("chapterEditor");
const editorSectionTitle = document.getElementById("editorSectionTitle");
const addSubchapterBtn = document.getElementById("addSubchapterBtn");
const addDiagramBtn = document.getElementById("addDiagramBtn");
const addDocumentBtn = document.getElementById("addDocumentBtn");
const chapterTitle = document.getElementById("chapterTitle");
const chapterDescription = document.getElementById("chapterDescription");

const diagramEditor = document.getElementById("diagramEditor");
const diagramTitle = document.getElementById("diagramTitle");
const diagramDescription = document.getElementById("diagramDescription");
const diagramCode = document.getElementById("diagramCode");
const diagramImage = document.getElementById("diagramImage");
const diagramFileName = document.getElementById("diagramFileName");
const mermaidInputGroup = document.getElementById("mermaidInputGroup");
const imageInputGroup = document.getElementById("imageInputGroup");
const diagramPreview = document.getElementById("diagramPreview");
const saveDiagramBtn = document.getElementById("saveDiagramBtn");
const cancelDiagramBtn = document.getElementById("cancelDiagramBtn");

const documentEditor = document.getElementById("documentEditor");
const documentTitle = document.getElementById("documentTitle");
const documentDescription = document.getElementById("documentDescription");
const documentDate = document.getElementById("documentDate");
const documentFile = document.getElementById("documentFile");
const documentFileName = document.getElementById("documentFileName");
const saveDocumentBtn = document.getElementById("saveDocumentBtn");
const cancelDocumentBtn = document.getElementById("cancelDocumentBtn");

const diagramsList = document.getElementById("diagramsList");
const documentsList = document.getElementById("documentsList");

const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const resetBtn = document.getElementById("resetBtn");

const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

// ---------- Init ----------
function init() {
  loadAppState();

  if (!appState.chapters || appState.chapters.length === 0)
    createInitialChapters();

  renderChapters();

  if (appState.currentChapter) selectChapter(appState.currentChapter);

  setupEventListeners();

  documentDate.valueAsDate = new Date();
}

function createInitialChapters() {
  appState.chapters = [
    {
      id: generateId(),
      title: "Capítulo 1: Introducción",
      description: "Conceptos ...",
      expanded: true,
      subchapters: [],
      diagrams: [],
      documents: [],
    },
    {
      id: generateId(),
      title: "Capítulo 2: Entorno",
      description: "Factores organizacionales",
      expanded: false,
      subchapters: [],
      diagrams: [],
      documents: [],
    },
  ];
  appState.currentChapter = appState.chapters[0].id;
  saveAppState();
}

// ---------- Event listeners ----------
function setupEventListeners() {
  addChapterBtn.addEventListener("click", addNewChapter);

  expandAllBtn.addEventListener("click", () => {
    appState.chapters.forEach((c) => (c.expanded = true));
    renderChapters();
    saveAppState();
  });

  collapseAllBtn.addEventListener("click", () => {
    appState.chapters.forEach((c) => (c.expanded = false));
    renderChapters();
    saveAppState();
  });

  addSubchapterBtn.addEventListener("click", addNewSubchapter);
  addDiagramBtn.addEventListener("click", showDiagramEditor);
  addDocumentBtn.addEventListener("click", showDocumentEditor);

  chapterTitle.addEventListener("input", saveCurrentChapter);
  chapterDescription.addEventListener("input", saveCurrentChapter);

  document.querySelectorAll(".type-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".type-option")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (btn.dataset.type === "mermaid") {
        mermaidInputGroup.classList.remove("hidden");
        imageInputGroup.classList.add("hidden");
      } else {
        mermaidInputGroup.classList.add("hidden");
        imageInputGroup.classList.remove("hidden");
      }

      updateDiagramPreview();
    });
  });

  diagramImage.addEventListener("change", () => {
    diagramFileName.textContent = diagramImage.files.length
      ? diagramImage.files[0].name
      : "Ningún archivo seleccionado";
    updateDiagramPreview();
  });

  diagramCode.addEventListener("input", updateDiagramPreview);
  diagramTitle.addEventListener("input", updateDiagramPreview);
  diagramDescription.addEventListener("input", updateDiagramPreview);

  saveDiagramBtn.addEventListener("click", saveDiagram);
  cancelDiagramBtn.addEventListener("click", () =>
    diagramEditor.classList.add("hidden")
  );

  document.querySelectorAll(".doc-type-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".doc-type-option")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (btn.dataset.type === "pdf") documentFile.accept = ".pdf";
      else documentFile.accept = ".ppt,.pptx";

      documentFile.value = "";
      documentFileName.textContent = "Ningún archivo seleccionado";
    });
  });

  documentFile.addEventListener("change", () => {
    documentFileName.textContent = documentFile.files.length
      ? documentFile.files[0].name
      : "Ningún archivo seleccionado";
  });

  saveDocumentBtn.addEventListener("click", saveDocument);
  cancelDocumentBtn.addEventListener("click", () =>
    documentEditor.classList.add("hidden")
  );

  saveBtn.addEventListener("click", () => {
    saveAppState();
    alert("Proyecto guardado en localStorage");
  });

  loadBtn.addEventListener("click", () => {
    loadAppState();
    renderChapters();
    if (appState.chapters.length) selectChapter(appState.chapters[0].id);
    alert("Proyecto cargado");
  });

  resetBtn.addEventListener("click", () => {
    if (confirm("¿Crear nuevo proyecto?")) {
      localStorage.removeItem("pmbokEditor");
      appState = { chapters: [], currentChapter: null };
      createInitialChapters();
      renderChapters();
    }
  });

  modalClose.addEventListener("click", closeModal);
}

// ---------- Chapters ----------
function renderChapters() {
  chaptersList.innerHTML = "";

  appState.chapters.forEach((chap) => {
    const li = document.createElement("li");
    li.className = "chapter-item" + (chap.expanded ? " expanded" : "");

    li.innerHTML = `
      <div class="chapter-header ${
        appState.currentChapter === chap.id ? "active" : ""
      }" data-id="${chap.id}">
        <span>${chap.title}</span>
        <div>
          <button class="edit">✎</button>
          <button class="delete">×</button>
        </div>
      </div>

      <ul class="subchapters-list">
        ${chap.subchapters
          .map(
            (s) =>
              `<li class="subchapter-item" data-id="${s.id}">
                <span>${s.title}</span>
              </li>`
          )
          .join("")}
      </ul>
    `;

    chaptersList.appendChild(li);

    li.querySelector(".chapter-header").addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      toggleChapterExpansion(id);
      selectChapter(id);
    });

    li.querySelector(".edit").addEventListener("click", (e) => {
      e.stopPropagation();
      selectChapter(chap.id);
    });

    li.querySelector(".delete").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("¿Eliminar capítulo?")) {
        appState.chapters = appState.chapters.filter((c) => c.id !== chap.id);
        appState.currentChapter = null;
        renderChapters();
        saveAppState();
      }
    });

    li.querySelectorAll(".subchapter-item").forEach((item) => {
      item.addEventListener("click", () => {
        selectSubchapter(item.dataset.id);
      });
    });
  });
}

function addNewChapter() {
  const newC = {
    id: generateId(),
    title: "Nuevo Capítulo",
    description: "",
    expanded: true,
    subchapters: [],
    diagrams: [],
    documents: [],
  };

  appState.chapters.push(newC);
  selectChapter(newC.id);
  renderChapters();
  saveAppState();
}

function addNewSubchapter() {
  if (!appState.currentChapter)
    return alert("Selecciona un capítulo primero");

  const ch = appState.chapters.find((c) => c.id === appState.currentChapter);

  const sub = {
    id: generateId(),
    title: "Nuevo Subcapítulo",
    description: "",
    diagrams: [],
    documents: [],
  };

  ch.subchapters.push(sub);
  ch.expanded = true;
  saveAppState();
  renderChapters();
  selectSubchapter(sub.id);
}

function toggleChapterExpansion(id) {
  const ch = appState.chapters.find((c) => c.id === id);
  if (!ch) return;
  ch.expanded = !ch.expanded;
  renderChapters();
  saveAppState();
}

function selectChapter(id) {
  appState.currentChapter = id;
  appState.currentSubchapter = null;

  const ch = appState.chapters.find((c) => c.id === id);
  if (!ch) return;

  editorTitle.textContent = "Editor: " + ch.title;
  editorSectionTitle.textContent = "Editar Capítulo";

  chapterTitle.value = ch.title;
  chapterDescription.value = ch.description;

  chapterEditor.classList.remove("hidden");

  renderCurrentDiagrams();
  renderCurrentDocuments();
  renderChapters();
}

function selectSubchapter(subId) {
  if (!appState.currentChapter) return;

  const ch = appState.chapters.find((c) => c.id === appState.currentChapter);
  const sub = ch.subchapters.find((s) => s.id === subId);

  appState.currentSubchapter = subId;

  editorTitle.textContent = "Editor: " + sub.title;
  editorSectionTitle.textContent = "Editar Subcapítulo";

  chapterTitle.value = sub.title;
  chapterDescription.value = sub.description;

  renderCurrentDiagrams();
  renderCurrentDocuments();
  renderChapters();
}

function saveCurrentChapter() {
  if (appState.currentSubchapter) {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);
    const sub = ch.subchapters.find(
      (s) => s.id === appState.currentSubchapter
    );

    sub.title = chapterTitle.value;
    sub.description = chapterDescription.value;
  } else if (appState.currentChapter) {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);

    ch.title = chapterTitle.value;
    ch.description = chapterDescription.value;
  }

  renderChapters();
  saveAppState();
}

// ---------- Diagrams ----------
let editingDiagramId = null;

function showDiagramEditor() {
  if (!appState.currentChapter)
    return alert("Selecciona un capítulo o subcapítulo");

  diagramEditor.classList.remove("hidden");
  documentEditor.classList.add("hidden");

  editingDiagramId = null;

  diagramTitle.value = "";
  diagramDescription.value = "";
  diagramCode.value = "";
  diagramImage.value = "";
  diagramFileName.textContent = "Ningún archivo seleccionado";

  mermaidInputGroup.classList.remove("hidden");
  imageInputGroup.classList.add("hidden");

  updateDiagramPreview();
}

function updateDiagramPreview() {
  const title = diagramTitle.value || "Sin título";
  const desc = diagramDescription.value || "";
  const type = document.querySelector(".type-option.active").dataset.type;

  if (type === "mermaid") {
    const code = diagramCode.value.trim();

    if (code) {
      diagramPreview.innerHTML = `
        <div>
          <strong>${title}</strong>
          <div>${desc}</div>
          <div class="mermaid">${code}</div>
        </div>
      `;
      try {
        mermaid.init(
          undefined,
          diagramPreview.querySelectorAll(".mermaid")
        );
      } catch (e) {}
    } else {
      diagramPreview.innerHTML = `
        <div>
          <strong>${title}</strong>
          <div>${desc}</div>
          <div>Ingresa código Mermaid</div>
        </div>
      `;
    }
  } else {
    if (diagramImage.files && diagramImage.files.length) {
      const file = diagramImage.files[0];
      const url = URL.createObjectURL(file);

      diagramPreview.innerHTML = `
        <div>
          <strong>${title}</strong>
          <div>${desc}</div>
          <img src="${url}" style="max-width:100%;height:auto;border-radius:6px" />
        </div>
      `;
    } else {
      diagramPreview.innerHTML = `
        <div>
          <strong>${title}</strong>
          <div>${desc}</div>
          <div>Selecciona una imagen</div>
        </div>
      `;
    }
  }
}

function saveDiagram() {
  const title = diagramTitle.value.trim();
  const desc = diagramDescription.value.trim();
  const type = document.querySelector(".type-option.active").dataset.type;

  if (!title) return alert("Ingresa título");

  if (type === "mermaid") {
    const content = diagramCode.value.trim();
    if (!content) return alert("Ingresa código Mermaid");

    finishSavingDiagram({ title, description: desc, type, content });
  } else {
    if (!diagramImage.files.length)
      return alert("Selecciona una imagen");

    const file = diagramImage.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const base64 = e.target.result;

      finishSavingDiagram({
        title,
        description: desc,
        type: "image",
        content: base64,
      });
    };

    reader.readAsDataURL(file);
  }
}

function finishSavingDiagram(diagram) {
  diagram.id = editingDiagramId || generateId();

  if (appState.currentSubchapter) {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);
    const sub = ch.subchapters.find(
      (s) => s.id === appState.currentSubchapter
    );

    if (!sub.diagrams) sub.diagrams = [];

    if (editingDiagramId) {
      const idx = sub.diagrams.findIndex((d) => d.id === diagram.id);
      if (idx >= 0) sub.diagrams[idx] = diagram;
    } else {
      sub.diagrams.push(diagram);
    }
  } else {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);

    if (!ch.diagrams) ch.diagrams = [];

    if (editingDiagramId) {
      const idx = ch.diagrams.findIndex((d) => d.id === diagram.id);
      if (idx >= 0) ch.diagrams[idx] = diagram;
    } else {
      ch.diagrams.push(diagram);
    }
  }

  diagramEditor.classList.add("hidden");
  renderCurrentDiagrams();
  saveAppState();
}

function renderCurrentDiagrams() {
  let diagrams = [];

  if (appState.currentSubchapter) {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);
    const sub = ch.subchapters.find(
      (s) => s.id === appState.currentSubchapter
    );

    diagrams = sub?.diagrams || [];
  } else if (appState.currentChapter) {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);
    diagrams = ch?.diagrams || [];
  }

  renderDiagrams(diagrams);
}

function renderDiagrams(diagrams) {
  if (!diagrams || diagrams.length === 0) {
    diagramsList.innerHTML = `<div class="card">No hay diagramas</div>`;
    return;
  }

  diagramsList.innerHTML = "";

  diagrams.forEach((d) => {
    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <div class="title">${d.title}</div>
      <div class="meta">${d.description || ""}</div>
    `;

    if (d.type === "mermaid") {
      const cont = document.createElement("div");
      cont.className = "mermaid";
      cont.textContent = d.content;
      el.appendChild(cont);

      setTimeout(() => {
        try {
          mermaid.init(undefined, el.querySelectorAll(".mermaid"));
        } catch (e) {}
      }, 10);
    } else {
      const img = document.createElement("img");
      img.src = d.content;
      img.style.maxWidth = "100%";
      el.appendChild(img);
    }

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";

    const btnView = document.createElement("button");
    btnView.textContent = "Abrir";
    btnView.onclick = () => openModalForDiagram(d);

    const btnDel = document.createElement("button");
    btnDel.textContent = "Eliminar";
    btnDel.onclick = () => {
      if (confirm("¿Eliminar diagrama?")) deleteDiagramById(d.id);
    };

    actions.appendChild(btnView);
    actions.appendChild(btnDel);
    el.appendChild(actions);

    diagramsList.appendChild(el);
  });
}

function openModalForDiagram(d) {
  if (d.type === "mermaid") {
    modalContent.innerHTML = `<div class="mermaid">${d.content}</div>`;

    try {
      mermaid.init(undefined, modalContent.querySelectorAll(".mermaid"));
    } catch (e) {}
  } else {
    modalContent.innerHTML = `
      <img src="${d.content}" style="max-width:100%;height:auto" />
    `;
  }

  modal.classList.remove("hidden");
}

function deleteDiagramById(id) {
  if (appState.currentSubchapter) {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);
    const sub = ch.subchapters.find(
      (s) => s.id === appState.currentSubchapter
    );

    sub.diagrams = sub.diagrams.filter((x) => x.id !== id);
    saveAppState();
    renderCurrentDiagrams();
  } else {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);

    ch.diagrams = ch.diagrams.filter((x) => x.id !== id);
    saveAppState();
    renderCurrentDiagrams();
  }
}

// ---------- Documents ----------
let editingDocId = null;

function showDocumentEditor() {
  if (!appState.currentChapter)
    return alert("Selecciona un capítulo o subcapítulo");

  documentEditor.classList.remove("hidden");
  diagramEditor.classList.add("hidden");

  editingDocId = null;

  documentTitle.value = "";
  documentDescription.value = "";
  documentDate.valueAsDate = new Date();
  documentFile.value = "";
  documentFileName.textContent = "Ningún archivo seleccionado";
}

function saveDocument() {
  const title = documentTitle.value.trim();
  if (!title) return alert("Ingresa título");

  const desc = documentDescription.value.trim();
  const date = documentDate.value;

  if (!documentFile.files.length) return alert("Selecciona un archivo");

  const file = documentFile.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const base64 = e.target.result;

    const doc = {
      id: editingDocId || generateId(),
      title,
      description: desc,
      date,
      type: file.type || "application/octet-stream",
      file: base64,
    };

    if (appState.currentSubchapter) {
      const ch = appState.chapters.find(
        (c) => c.id === appState.currentChapter
      );
      const sub = ch.subchapters.find(
        (s) => s.id === appState.currentSubchapter
      );

      if (!sub.documents) sub.documents = [];

      if (editingDocId) {
        const idx = sub.documents.findIndex((x) => x.id === editingDocId);
        if (idx >= 0) sub.documents[idx] = doc;
      } else {
        sub.documents.push(doc);
      }
    } else {
      const ch = appState.chapters.find(
        (c) => c.id === appState.currentChapter
      );

      if (!ch.documents) ch.documents = [];

      if (editingDocId) {
        const idx = ch.documents.findIndex((x) => x.id === editingDocId);
        if (idx >= 0) ch.documents[idx] = doc;
      } else {
        ch.documents.push(doc);
      }
    }

    documentEditor.classList.add("hidden");
    renderCurrentDocuments();
    saveAppState();
  };

  reader.readAsDataURL(file);
}

function renderCurrentDocuments() {
  let documents = [];

  if (appState.currentSubchapter) {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);
    const sub = ch.subchapters.find(
      (s) => s.id === appState.currentSubchapter
    );
    documents = sub?.documents || [];
  } else if (appState.currentChapter) {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);
    documents = ch?.documents || [];
  }

  renderDocuments(documents);
}

function renderDocuments(docs) {
  if (!docs || docs.length === 0) {
    documentsList.innerHTML = `<div class="card">No hay documentos</div>`;
    return;
  }

  documentsList.innerHTML = "";

  docs.forEach((d) => {
    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <div class="title">${d.title}</div>
      <div class="meta">${formatDate(d.date)} – ${d.type}</div>
      <div>${d.description || ""}</div>
    `;

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";

    const btnOpen = document.createElement("button");
    btnOpen.textContent = "Abrir";
    btnOpen.onclick = () => openDocument(d);

    const btnDownload = document.createElement("button");
    btnDownload.textContent = "Descargar";
    btnDownload.onclick = () => downloadDocument(d);

    const btnDel = document.createElement("button");
    btnDel.textContent = "Eliminar";
    btnDel.onclick = () => {
      if (confirm("¿Eliminar documento?")) deleteDocument(d.id);
    };

    actions.appendChild(btnOpen);
    actions.appendChild(btnDownload);
    actions.appendChild(btnDel);

    el.appendChild(actions);

    documentsList.appendChild(el);
  });
}

function openDocument(d) {
  if (d.type === "application/pdf" || d.file.startsWith("data:application/pdf")) {
    openModalWithPDF(d.file);
  } else {
    modalContent.innerHTML = `
      <h3>${d.title}</h3>
      <p>${d.description || ""}</p>
      <p>Tipo: ${d.type}</p>
      <button id="modalDownloadBtn">Descargar</button>
    `;

    modal.classList.remove("hidden");

    document
      .getElementById("modalDownloadBtn")
      .addEventListener("click", () => downloadDocument(d));
  }
}

function downloadDocument(d) {
  const a = document.createElement("a");
  a.href = d.file;

  let ext = "bin";
  if (d.type.includes("pdf")) ext = "pdf";
  else if (d.type.includes("presentation") || d.type.includes("ppt"))
    ext = "pptx";

  a.download = `${d.title}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function deleteDocument(id) {
  if (appState.currentSubchapter) {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);
    const sub = ch.subchapters.find(
      (s) => s.id === appState.currentSubchapter
    );

    sub.documents = sub.documents.filter((x) => x.id !== id);
    saveAppState();
    renderCurrentDocuments();
  } else {
    const ch = appState.chapters.find((c) => c.id === appState.currentChapter);

    ch.documents = ch.documents.filter((x) => x.id !== id);
    saveAppState();
    renderCurrentDocuments();
  }
}

// ---------- PDF VIEWER ----------
function base64ToUint8Array(base64) {
  const raw = atob(base64);
  const uint8 = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    uint8[i] = raw.charCodeAt(i);
  }

  return uint8;
}

function openModalWithPDF(dataUrl) {
  modalContent.innerHTML = `
    <div id="pdfContainer">
      <canvas id="pdfCanvas" style="max-width:100%;border:1px solid #ddd"></canvas>
    </div>
    <button id="closePdfBtn">Cerrar</button>
  `;

  modal.classList.remove("hidden");

  const canvas = document.getElementById("pdfCanvas");
  const ctx = canvas.getContext("2d");

  const base64 = dataUrl.split(",")[1];
  const pdfBytes = base64ToUint8Array(base64);

  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });

  loadingTask.promise
    .then((pdf) => {
      pdf.getPage(1).then((page) => {
        const scale = 1.2;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderCtx = { canvasContext: ctx, viewport };
        page.render(renderCtx);
      });
    })
    .catch((err) => {
      modalContent.innerHTML = `<p>Error al cargar el PDF</p>`;
      console.error(err);
    });

  document
    .getElementById("closePdfBtn")
    .addEventListener("click", closeModal);
}

function closeModal() {
  modal.classList.add("hidden");
  modalContent.innerHTML = "";
}

// ---------- Start ----------
init();
