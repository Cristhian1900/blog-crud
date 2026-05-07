// ── Image Upload Preview ──────────────────────────────────
(function () {
  const uploadZone = document.getElementById('uploadZone');
  const uploadInput = document.getElementById('imagen');
  const uploadContent = document.getElementById('uploadContent');
  const uploadPreview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');
  const removeImg = document.getElementById('removeImg');

  if (!uploadZone || !uploadInput) return;

  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showPreview(file);
  });

  // Drag & drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      // Transferir al input
      const dt = new DataTransfer();
      dt.items.add(file);
      uploadInput.files = dt.files;
      showPreview(file);
    }
  });

  function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadContent.style.display = 'none';
      uploadPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  if (removeImg) {
    removeImg.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadInput.value = '';
      previewImg.src = '';
      uploadContent.style.display = 'block';
      uploadPreview.style.display = 'none';
    });
  }
})();

// ── Character Counter ─────────────────────────────────────
(function () {
  const textarea = document.getElementById('contenido');
  const counter = document.getElementById('charCount');
  if (!textarea || !counter) return;

  function update() {
    counter.textContent = textarea.value.length.toLocaleString();
  }
  textarea.addEventListener('input', update);
  update();
})();

// ── Delete Confirmation ───────────────────────────────────
document.querySelectorAll('.delete-form').forEach((form) => {
  form.addEventListener('submit', (e) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este blog? Esta acción no se puede deshacer.')) {
      e.preventDefault();
    }
  });
});

document.querySelectorAll('.delete-comment-form').forEach((form) => {
  form.addEventListener('submit', (e) => {
    if (!confirm('¿Eliminar este comentario?')) {
      e.preventDefault();
    }
  });
});

// ── Password Toggle ───────────────────────────────────────
(function () {
  const toggle = document.getElementById('togglePassword');
  const input = document.getElementById('password');
  const icon = document.getElementById('toggleIcon');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    icon.className = isPass ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill';
  });
})();

// ── Auto-dismiss flash alerts ─────────────────────────────
document.querySelectorAll('.flash-alert').forEach((alert) => {
  setTimeout(() => {
    const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
    bsAlert.close();
  }, 4000);
});
