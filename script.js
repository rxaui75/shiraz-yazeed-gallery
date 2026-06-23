const SUPABASE_URL = 'https://opxkinvphkuejyrepukl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NrD4J5jmAluCMES4CRxtTg_4Bsk5PPc';
const BUCKET = 'wedding-memories';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const selectedFiles = document.getElementById('selectedFiles');
const statusEl = document.getElementById('status');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('emptyState');
const memoryCount = document.getElementById('memoryCount');

function openUploader(){ document.getElementById('upload').scrollIntoView({behavior:'smooth'}); }

fileInput.addEventListener('change', () => {
  const files = [...fileInput.files];
  selectedFiles.innerHTML = files.length ? files.map(f => `♡ ${f.name}`).join('<br>') : '';
});

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const files = [...fileInput.files];
  if(!files.length){ showToast('Please choose photos or videos first 🤍'); return; }

  const guestName = document.getElementById('guestName').value.trim();
  const message = document.getElementById('message').value.trim();
  progress.hidden = false;
  progressBar.style.width = '0%';
  statusEl.textContent = 'Uploading memories...';

  let uploaded = 0;
  for(const file of files){
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

    const { error: uploadError } = await client.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if(uploadError){ console.error(uploadError); showToast('Upload failed. Check Supabase policies.'); continue; }

    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    const fileType = file.type.startsWith('video') ? 'video' : 'image';

    const { error: dbError } = await client.from('memories').insert({
      file_url: data.publicUrl,
      file_type: fileType,
      guest_name: guestName || null,
      message: message || null
    });
    if(dbError){ console.error(dbError); showToast('Saved file, but database insert failed.'); }

    uploaded++;
    progressBar.style.width = `${Math.round((uploaded / files.length) * 100)}%`;
  }

  statusEl.textContent = 'Thank you for becoming part of our memories 🤍';
  showToast('Memories shared successfully 🤍');
  uploadForm.reset();
  selectedFiles.innerHTML = '';
  setTimeout(() => { progress.hidden = true; progressBar.style.width = '0%'; }, 1200);
  await loadMemories();
  document.getElementById('wall').scrollIntoView({behavior:'smooth'});
});

async function loadMemories(){
  const { data, error } = await client.from('memories').select('*').order('created_at', { ascending:false });
  if(error){ console.error(error); gallery.innerHTML = ''; emptyState.textContent = 'Could not load memories. Check Supabase table policies.'; return; }

  memoryCount.textContent = data.length;
  emptyState.style.display = data.length ? 'none' : 'block';
  gallery.innerHTML = data.map(item => memoryCard(item)).join('');
}

function memoryCard(item){
  const name = item.guest_name ? escapeHtml(item.guest_name) : 'A lovely guest';
  const msg = item.message ? `<p>${escapeHtml(item.message)}</p>` : '';
  const date = item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) : '';
  const media = item.file_type === 'video'
    ? `<video src="${item.file_url}" muted playsinline preload="metadata" onclick="openLightbox('${item.file_url}','video')"></video><span class="badge">🎥 Video</span>`
    : `<img src="${item.file_url}" loading="lazy" onclick="openLightbox('${item.file_url}','image')" alt="Wedding memory"><span class="badge">📷 Photo</span>`;

  return `<article class="memory">
    <div class="media-wrap">${media}</div>
    <div class="memory-info">
      <strong>♡ ${name}</strong>
      ${msg}
      <small>${date}</small>
    </div>
  </article>`;
}

function openLightbox(url, type){
  const box = document.getElementById('lightbox');
  const content = document.getElementById('lightboxContent');
  content.innerHTML = type === 'video'
    ? `<video src="${url}" controls autoplay playsinline></video>`
    : `<img src="${url}" alt="Wedding memory">`;
  box.classList.add('show');
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('show');
  document.getElementById('lightboxContent').innerHTML = '';
}
function showToast(text){
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(), 2600);
}
function escapeHtml(text){
  return text.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

loadMemories();
