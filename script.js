const SUPABASE_URL = 'https://opxkinvphkuejyrepukl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NrD4J5jmAluCMES4CRxtTg_4Bsk5PPc';
const BUCKET = 'wedding-memories';
const TABLE = 'memories';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const fileInput = document.getElementById('fileInput');
const selectedFiles = document.getElementById('selectedFiles');
const uploadForm = document.getElementById('uploadForm');
const statusEl = document.getElementById('status');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('emptyState');
const memoryCount = document.getElementById('memoryCount');

function openUploader(){ document.getElementById('upload').scrollIntoView({behavior:'smooth'}); }
function cleanText(value){ return (value || '').trim().slice(0, 160); }
function isVideo(type){ return type && type.startsWith('video/'); }
function formatDate(date){ return new Date(date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}); }

fileInput?.addEventListener('change', () => {
  selectedFiles.innerHTML = '';
  [...fileInput.files].forEach(file => {
    const item = document.createElement('div');
    item.textContent = `${isVideo(file.type) ? '🎥' : '📷'} ${file.name}`;
    selectedFiles.appendChild(item);
  });
});

uploadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const files = [...fileInput.files];
  if(!files.length){ statusEl.textContent = 'Please choose at least one photo or video 🤍'; return; }
  const guestName = cleanText(document.getElementById('guestName').value);
  const message = cleanText(document.getElementById('message').value);
  progress.hidden = false; progressBar.style.width = '0%'; statusEl.textContent = 'Uploading memories...';
  let uploaded = 0;
  try{
    for(const file of files){
      if(file.size > 80 * 1024 * 1024){ throw new Error(`${file.name} is too large. Keep each file under 80MB.`); }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
      const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabaseClient.storage.from(BUCKET).upload(path, file, { cacheControl:'3600', upsert:false, contentType:file.type });
      if(uploadError) throw uploadError;
      const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
      const { error: insertError } = await supabaseClient.from(TABLE).insert({
        file_url: data.publicUrl,
        file_path: path,
        file_type: file.type,
        media_kind: isVideo(file.type) ? 'video' : 'image',
        guest_name: guestName || null,
        message: message || null
      });
      if(insertError) throw insertError;
      uploaded++;
      progressBar.style.width = `${Math.round((uploaded / files.length) * 100)}%`;
    }
    statusEl.textContent = 'Thank you 🤍 Your memories have been shared successfully.';
    uploadForm.reset(); selectedFiles.innerHTML = '';
    await loadMemories();
    document.getElementById('wall').scrollIntoView({behavior:'smooth'});
  }catch(err){
    console.error(err);
    statusEl.textContent = `Upload failed: ${err.message || err}`;
  }
});

async function loadMemories(){
  const { data, error } = await supabaseClient.from(TABLE).select('*').order('created_at', { ascending:false });
  if(error){ console.error(error); gallery.innerHTML = ''; emptyState.textContent = 'Could not load memories. Check Supabase policies.'; emptyState.style.display='block'; return; }
  renderMemories(data || []);
}

function renderMemories(memories){
  memoryCount.textContent = memories.length;
  gallery.innerHTML = '';
  emptyState.style.display = memories.length ? 'none' : 'block';
  memories.forEach((memory, index) => {
    const card = document.createElement('article');
    card.className = 'memory';
    card.style.animationDelay = `${Math.min(index * 0.04, .5)}s`;
    const video = (memory.media_kind === 'video') || (memory.file_type || '').startsWith('video/');
    card.innerHTML = `
      <div class="media-wrap" onclick='openLightbox(${JSON.stringify(memory).replace(/'/g,"&#39;")})'>
        ${video ? `<video src="${memory.file_url}" muted playsinline preload="metadata"></video><span class="badge">🎥 Video</span>` : `<img src="${memory.file_url}" alt="Wedding memory" loading="lazy"><span class="badge">📷 Photo</span>`}
      </div>
      <div class="memory-body">
        <div class="guest">${memory.guest_name ? `🤍 ${escapeHtml(memory.guest_name)}` : '🤍 Wedding Guest'}</div>
        ${memory.message ? `<div class="msg">${escapeHtml(memory.message)}</div>` : ''}
        <div class="date">${formatDate(memory.created_at || new Date())}</div>
      </div>`;
    gallery.appendChild(card);
  });
}

function openLightbox(memory){
  const box = document.getElementById('lightbox');
  const content = document.getElementById('lightboxContent');
  const video = (memory.media_kind === 'video') || (memory.file_type || '').startsWith('video/');
  content.innerHTML = `${video ? `<video src="${memory.file_url}" controls autoplay playsinline></video>` : `<img src="${memory.file_url}" alt="Wedding memory">`}
    <div class="lightbox-caption">
      <strong>${memory.guest_name ? escapeHtml(memory.guest_name) : 'Wedding Guest'}</strong>
      ${memory.message ? `<div>${escapeHtml(memory.message)}</div>` : ''}
    </div>`;
  box.classList.add('show');
}
function closeLightbox(){ document.getElementById('lightbox').classList.remove('show'); }
function openRandSheet(){ document.getElementById('randSheet').classList.add('show'); }
function closeRandSheet(){ document.getElementById('randSheet').classList.remove('show'); }
function escapeHtml(str){ return String(str).replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])); }

const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('show'); }), {threshold:.12});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

loadMemories();
try{
  supabaseClient.channel('memories-live')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:TABLE }, () => loadMemories())
    .subscribe();
}catch(e){ console.warn('Realtime unavailable', e); }
