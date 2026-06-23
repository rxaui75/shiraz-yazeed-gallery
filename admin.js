const SUPABASE_URL = 'https://opxkinvphkuejyrepukl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NrD4J5jmAluCMES4CRxtTg_4Bsk5PPc';
const BUCKET = 'wedding-memories';
const TABLE = 'memories';
const ADMIN_PASSWORD = 'rand2026';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let memories = [];
function loginAdmin(){
  if(document.getElementById('password').value === ADMIN_PASSWORD){
    sessionStorage.setItem('memoryAdmin','yes');
    document.getElementById('login').classList.add('hidden');
    document.getElementById('adminPage').classList.remove('hidden');
    loadAdmin();
  } else document.getElementById('loginMsg').textContent = 'Wrong password';
}
if(sessionStorage.getItem('memoryAdmin') === 'yes') loginAdmin();
async function loadAdmin(){
  const {data, error} = await supabaseClient.from(TABLE).select('*').order('created_at',{ascending:false});
  if(error){ alert(error.message); return; }
  memories = data || [];
  document.getElementById('adminList').innerHTML = memories.map(m => {
    const video = (m.media_kind === 'video') || (m.file_type || '').startsWith('video/');
    return `<div class="admin-card">
      ${video ? `<video src="${m.file_url}" controls></video>` : `<img src="${m.file_url}" alt="memory">`}
      <div><h4>${m.guest_name || 'Wedding Guest'}</h4><p>${m.message || ''}</p><p>${new Date(m.created_at).toLocaleString()}</p><a class="btn" href="${m.file_url}" target="_blank">Open</a> <button class="btn danger" onclick="deleteMemory('${m.id}','${m.file_path || ''}')">Delete</button></div>
    </div>`;
  }).join('') || '<p class="empty">No memories yet.</p>';
}
async function deleteMemory(id, path){
  if(!confirm('Delete this memory?')) return;
  if(path) await supabaseClient.storage.from(BUCKET).remove([path]);
  const {error} = await supabaseClient.from(TABLE).delete().eq('id', id);
  if(error) alert('Delete failed: ' + error.message);
  loadAdmin();
}
function downloadCSV(){
  const rows = [['guest_name','message','file_url','file_type','created_at'], ...memories.map(m => [m.guest_name||'', m.message||'', m.file_url||'', m.file_type||'', m.created_at||''])];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = 'shiraz-yazeed-memories.csv'; a.click();
}
