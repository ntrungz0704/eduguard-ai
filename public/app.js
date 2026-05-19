// ============================================================
// EduGuard AI – Frontend Logic
// ============================================================
const API = 'http://localhost:3000/api';
let allPredictions = [];
let allStudents = [];
let allSubjects = [];

// ============================================================
// NAVIGATION
// ============================================================
const pageTitles = { dashboard: 'Tổng quan', import: 'Nhập dữ liệu', predict: 'Dự đoán điểm AI', students: 'Danh sách sinh viên', chat: 'Trợ lý AI' };

function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.getElementById(`nav-${name}`)?.classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[name] || name;
  if (name === 'dashboard') loadDashboard();
  if (name === 'students') loadStudentsData().then(loadStudents);
}

document.querySelectorAll('.nav-item').forEach(n => {
  n.addEventListener('click', e => { e.preventDefault(); switchPage(n.dataset.page); });
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ============================================================
// SAMPLE DATA LOADER (inline XLSX-like CSV)
// ============================================================
function loadSampleData() {
  // Build sample data matching FPT Polytechnic CNTT subjects
  const subjects = ['Tin học ứng dụng','Nhập môn lập trình','Xây dựng trang Web','Cơ sở dữ liệu','JavaScript cơ bản','Lập trình PHP 1'];
  const names = ['Nguyễn Văn An','Trần Thị Bình','Lê Minh Châu','Phạm Quốc Dũng','Hoàng Thị Lan','Vũ Văn Minh','Đỗ Thị Ngọc','Bùi Hoàng Phúc','Ngô Thị Quỳnh','Lý Văn Sơn',
    'Mai Thị Thúy','Đinh Văn Uy','Hồ Thị Vân','Phan Văn Xuân','Lưu Thị Yến','Trương Văn Zung','Kiều Thị Ánh','Đặng Văn Bảo','Tô Thị Cẩm','Nghiêm Văn Duy',
    'Vương Thị Én','Cao Văn Phong','Nguyễn Thị Giang','Trần Văn Hùng','Lê Thị Ích','Phạm Văn Kiên','Đỗ Thị Lụa','Bùi Văn Mạnh','Hoàng Thị Nhung','Vũ Văn Ổn'];
  
  const rows = [['MSSV','Họ và tên',...subjects]];
  names.forEach((name, i) => {
    const mssv = `PH${(50001+i)}`;
    const base = 4 + Math.random() * 5;
    const row = [mssv, name];
    subjects.forEach((sub, j) => {
      if (sub === 'Lập trình PHP 1' && Math.random() < 0.35) { row.push(''); } // ~35% chưa học PHP1
      else {
        const score = Math.min(10, Math.max(0, base + (Math.random()-0.5)*3 + j*0.1));
        row.push(Math.round(score * 10) / 10);
      }
    });
    rows.push(row);
  });

  // Convert to CSV blob with UTF-8 BOM for Vietnamese
  const csv = rows.map(r => r.join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const file = new File([blob], 'sample_scores.csv', { type: 'text/csv' });
  
  // Set to file input
  const dt = new DataTransfer();
  dt.items.add(file);
  document.getElementById('fileInput').files = dt.files;
  showStatus('import-status', 'success', '✅ Đã tải dữ liệu mẫu 30 sinh viên – nhấn "Nhập dữ liệu" để tiếp tục');
}

// ============================================================
// FILE UPLOAD
// ============================================================
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f) { const dt = new DataTransfer(); dt.items.add(f); fileInput.files = dt.files; showStatus('import-status', 'success', `📄 Đã chọn: ${f.name}`); }
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) showStatus('import-status', 'success', `📄 Đã chọn: ${fileInput.files[0].name}`); });

async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) { showStatus('import-status', 'error', '⚠️ Vui lòng chọn file trước'); return; }
  showStatus('import-status', 'success', '⏳ Đang xử lý...');
  try {
    const form = new FormData(); form.append('file', file);
    const res = await fetch(`${API}/upload-predict`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    allSubjects = data.predictableSubjects || data.uploadedSubjects;
    showStatus('import-status', 'success', `✅ Nhập thành công: ${data.studentsCount} sinh viên`);
    document.getElementById('dataBadge').textContent = `${data.studentsCount} SV | Mới tải lên`;
    document.getElementById('dataBadge').style.color = 'var(--success)';
    updateSubjectSelect(allSubjects);
    await loadStudentsData();
    showPreview();
  } catch (e) { showStatus('import-status', 'error', `❌ Lỗi: ${e.message}`); }
}

function showStatus(id, type, msg) {
  const el = document.getElementById(id);
  el.className = `import-status ${type}`; el.textContent = msg; el.classList.remove('hidden');
}

async function showPreview() {
  const res = await fetch(`${API}/students`);
  const data = await res.json();
  if (!data.students?.length) return;
  const card = document.getElementById('previewCard'); card.style.display = 'block';
  const subs = data.subjects.slice(0, 5);
  let html = '<table><thead><tr><th>MSSV</th><th>Họ tên</th>';
  subs.forEach(s => html += `<th>${s}</th>`);
  html += '</tr></thead><tbody>';
  data.students.slice(0, 8).forEach(s => {
    html += `<tr><td>${s.id}</td><td>${s.name}</td>`;
    subs.forEach(sub => {
      const v = s.scores[sub];
      html += `<td>${v === null || v === undefined ? '<span style="color:var(--text2)">–</span>' : v}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('previewTable').innerHTML = html;
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
  const res = await fetch(`${API}/training-info`);
  const data = await res.json();
  if (data.empty) return;
  
  if (!allSubjects.length) {
    allSubjects = data.stats.map(s => s.subject);
    updateSubjectSelect(allSubjects);
    document.getElementById('dataBadge').textContent = `${data.totalStudents} SV (Pre-trained)`;
    document.getElementById('dataBadge').style.color = 'var(--primary)';
  }

  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `
    <div class="stat-card"><div class="stat-num">${data.totalStudents}</div><div class="stat-label">Tổng sinh viên (Train)</div></div>
    <div class="stat-card"><div class="stat-num">${data.totalSubjects}</div><div class="stat-label">Số môn học</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--warn)">${data.source.includes('FPT') ? 'FPT' : 'Custom'}</div><div class="stat-label">Nguồn dữ liệu</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--danger)">${data.stats.reduce((s,r)=>s+r.atRisk,0)}</div><div class="stat-label">Tổng lượt &lt;5</div></div>
  `;
  const cards = document.getElementById('subjectCards');
  cards.classList.remove('hidden');
  cards.innerHTML = data.stats.map(s => `
    <div class="subject-card">
      <div class="subject-card-title" title="${s.subject}">${s.subject}</div>
      <div class="subject-bar"><div class="subject-bar-fill" style="width:${s.avg*10}%"></div></div>
      <div class="subject-meta">
        <span>TB: <b style="color:var(--primary)">${s.avg}</b></span>
        <span>Có điểm: ${s.scored}/${s.total}</span>
        <span style="color:var(--danger)">⚠️ ${s.atRisk}</span>
      </div>
    </div>
  `).join('');
}

// ============================================================
// PREDICT
// ============================================================
function updateSubjectSelect(subjects) {
  const sel = document.getElementById('subjectSelect');
  sel.innerHTML = '<option value="">-- Chọn môn học --</option>';
  subjects.forEach(s => sel.innerHTML += `<option value="${s}">${s}</option>`);
}

async function runPrediction() {
  const sub = document.getElementById('subjectSelect').value;
  if (!sub) { alert('Vui lòng chọn môn học'); return; }
  try {
    const res = await fetch(`${API}/predict/${encodeURIComponent(sub)}`);
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    allPredictions = data.predictions;
    const el = document.getElementById('predictResult'); el.classList.remove('hidden');

    const hi = data.predictions.filter(p => p.risk === 'high').length;
    const me = data.predictions.filter(p => p.risk === 'medium').length;
    const lo = data.predictions.filter(p => p.risk === 'low').length;

    // Hiển thị Model Explanation & Validation
    const val = data.validation;
    const f = data.formula;
    let valHtml = `
      <div style="padding:15px; border-bottom:1px solid var(--border);">
        <h4 style="margin:0 0 10px 0; color:var(--primary);">🧠 Kiến trúc Thuật toán (Explainable AI)</h4>
        <p style="font-size:13px; color:var(--text2); margin:0 0 10px 0;"><b>Thuật toán:</b> ${f.name}<br><b>Công thức:</b> <code>${f.expression}</code><br><b>Chi tiết:</b> ${f.explanation}</p>
      </div>
    `;

    if (val && val.mae !== null) {
      valHtml += `
      <div style="padding:15px; display:flex; gap:20px;">
        <div><b>Validation (Train/Test Split 80/20):</b></div>
        <div><span style="color:var(--primary)">Train:</span> ${val.trainSize} SV</div>
        <div><span style="color:var(--warn)">Test:</span> ${val.testSize} SV</div>
        <div><span style="color:var(--danger)">MAE:</span> ${val.mae}</div>
        <div><span style="color:var(--danger)">RMSE:</span> ${val.rmse}</div>
        <div><span style="color:var(--success)">Accuracy:</span> ${val.accuracy}%</div>
      </div>`;
    } else {
      valHtml += `<div style="padding:15px; color:var(--warn)">⚠️ Không đủ dữ liệu để train/test validation cho môn này.</div>`;
    }

    document.getElementById('modelExplanation').innerHTML = valHtml;

    document.getElementById('resultStats').innerHTML = `
      <div class="result-stat"><div class="result-stat-num blue">${data.trainCount}</div><div class="result-stat-label">SV có điểm (train)</div></div>
      <div class="result-stat"><div class="result-stat-num blue">${data.predictions.length}</div><div class="result-stat-label">SV cần dự đoán</div></div>
      <div class="result-stat"><div class="result-stat-num red">${hi}</div><div class="result-stat-label">🔴 Nguy cơ cao (&lt;5)</div></div>
      <div class="result-stat"><div class="result-stat-num yellow">${me}</div><div class="result-stat-label">🟡 Trung bình (5-6.4)</div></div>
      <div class="result-stat"><div class="result-stat-num green">${lo}</div><div class="result-stat-label">🟢 Tốt (≥6.5)</div></div>
      <div class="result-stat"><div class="result-stat-num blue">${data.avg}</div><div class="result-stat-label">Điểm TB môn</div></div>
    `;
    if (data.topFeatures?.length) {
      document.getElementById('resultStats').innerHTML += `
        <div class="result-stat" style="grid-column:1/-1;text-align:left;padding:16px">
          <div style="font-size:13px;color:var(--text2);margin-bottom:8px">🔬 Các môn ảnh hưởng nhất đến <b style="color:var(--primary)">${sub}</b> (Pearson Correlation):</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${data.topFeatures.map(feat => `<span class="badge badge-low">${feat.subject} <b>r=${feat.r}</b></span>`).join('')}
          </div>
        </div>`;
    }
    renderPredictTable(allPredictions);
  } catch (e) { alert('Lỗi: ' + e.message); }
}

function renderPredictTable(list) {
  if (!list.length) { document.getElementById('predictTable').innerHTML = '<p style="color:var(--text2);padding:20px">Không có sinh viên nào cần dự đoán</p>'; return; }
  let html = '<table><thead><tr><th>MSSV</th><th>Họ và tên</th><th>Điểm dự đoán</th><th>Mức độ</th><th>Giải thích AI (XAI)</th></tr></thead><tbody>';
  list.forEach(p => {
    const cls = p.predicted >= 6.5 ? 'score-high' : p.predicted >= 5 ? 'score-mid' : 'score-low';
    const badge = p.risk === 'high' ? 'badge-high' : p.risk === 'medium' ? 'badge-medium' : 'badge-low';
    const label = p.risk === 'high' ? '🔴 Nguy cơ cao' : p.risk === 'medium' ? '🟡 Trung bình' : '🟢 Tốt';
    
    // Explainable AI text
    let explainText = '';
    if (p.reasons && p.reasons.length > 0) {
      explainText = p.reasons.map(r => {
        const color = r.impact === 'negative' ? 'var(--danger)' : r.impact === 'positive' ? 'var(--success)' : 'var(--text2)';
        return `<div style="font-size:12px"><span style="color:${color}">•</span> ${r.explanation}</div>`;
      }).join('');
    } else {
      explainText = '<span style="color:var(--text2);font-size:12px">Không đủ dữ liệu môn liên quan</span>';
    }

    html += `<tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td class="score-cell ${cls}">${p.predicted}</td>
      <td><span class="badge ${badge}">${label}</span></td>
      <td>${explainText}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('predictTable').innerHTML = html;
}

function filterRisk(risk, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = risk === 'all' ? allPredictions : allPredictions.filter(p => p.risk === risk);
  renderPredictTable(filtered);
}

// ============================================================
// STUDENTS TABLE
// ============================================================
async function loadStudentsData() {
  const res = await fetch(`${API}/students`);
  const data = await res.json();
  allStudents = data.students; allSubjects = data.subjects;
}

function loadStudents() {
  if (!allStudents.length) { document.getElementById('studentsTable').innerHTML = '<p style="color:var(--text2);padding:20px">Chưa có dữ liệu – vui lòng nhập file trước</p>'; return; }
  renderStudentsTable(allStudents);
}

function renderStudentsTable(list) {
  const subs = allSubjects.slice(0, 6);
  let html = '<table><thead><tr><th>MSSV</th><th>Họ và tên</th>';
  subs.forEach(s => html += `<th title="${s}">${s.length > 14 ? s.slice(0,14)+'…' : s}</th>`);
  html += '</tr></thead><tbody>';
  list.forEach(s => {
    html += `<tr><td>${s.id}</td><td>${s.name}</td>`;
    subs.forEach(sub => {
      const v = s.scores[sub];
      const cls = v === null || v === undefined ? '' : v < 5 ? 'score-low' : v < 6.5 ? 'score-mid' : 'score-high';
      html += `<td class="${cls}">${v === null || v === undefined ? '–' : v}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('studentsTable').innerHTML = html;
}

function filterStudents() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allStudents.filter(s => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  renderStudentsTable(filtered);
}

// ============================================================
// CHATBOT
// ============================================================
async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  appendBubble('user', msg);
  const typingId = appendTyping();
  try {
    const res = await fetch(`${API}/chat`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({message: msg}) });
    const data = await res.json();
    removeTyping(typingId);
    appendBubble('bot', data.reply || 'Không nhận được phản hồi');
  } catch (e) {
    removeTyping(typingId);
    appendBubble('bot', `Lỗi kết nối server: ${e.message}`);
  }
}

function quickChat(msg) { document.getElementById('chatInput').value = msg; sendChat(); }

function appendBubble(role, text) {
  const el = document.createElement('div');
  el.className = `chat-bubble ${role}`;
  el.innerHTML = `<div class="bubble-avatar">${role === 'bot' ? '🤖' : '👨‍🏫'}</div><div class="bubble-text">${text.replace(/\n/g,'<br>')}</div>`;
  document.getElementById('chatMessages').appendChild(el);
  el.scrollIntoView({ behavior: 'smooth' });
  return el;
}

function appendTyping() {
  const id = 'typing-' + Date.now();
  const el = document.createElement('div');
  el.id = id; el.className = 'chat-bubble bot';
  el.innerHTML = `<div class="bubble-avatar">🤖</div><div class="bubble-text"><div class="typing"><span></span><span></span><span></span></div></div>`;
  document.getElementById('chatMessages').appendChild(el);
  el.scrollIntoView({ behavior: 'smooth' });
  return id;
}

function removeTyping(id) { document.getElementById(id)?.remove(); }

// Init
loadDashboard();
