const fs = require('fs');
const path = 'client/src/pages/Predict.jsx';
let content = fs.readFileSync(path, 'utf8');

const searchStr = `          <label className="border-2 border-dashed border-purple-500/30 rounded-2xl p-8 text-center hover:bg-purple-500/5 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group-hover:border-purple-500/60">
            <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleUpload} className="hidden" />
            <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="text-purple-300" size={20}/>
            </div>
            <p className="text-slate-300 font-medium">{file ? file.name : 'Kéo thả hoặc Click chọn file Excel/CSV'}</p>
          </label>
          {uploadStatus && <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl text-sm font-medium">{uploadStatus}</div>}`;

const replaceStr = `          <label className={\`border-2 border-dashed \${uploadStatus?.includes('Đang') ? 'border-amber-500/50 bg-amber-500/5' : 'border-purple-500/30 hover:bg-purple-500/5 hover:border-purple-500/60'} rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group\`}>
            <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleUpload} className="hidden" disabled={uploadStatus?.includes('Đang')} />
            
            {uploadStatus?.includes('Đang') ? (
              <>
                <div className="w-12 h-12 mb-3 relative flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-amber-300 font-bold tracking-wide animate-pulse">{uploadStatus}</p>
              </>
            ) : (
              <>
                <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="text-purple-300" size={20}/>
                </div>
                <p className="text-slate-300 font-medium">{file ? file.name : 'Kéo thả hoặc Click chọn file Excel/CSV'}</p>
              </>
            )}
          </label>
          
          {uploadStatus && !uploadStatus.includes('Đang') && (
            <div className={\`mt-4 p-3 border rounded-xl text-sm font-bold flex items-center gap-2 \${
              uploadStatus.includes('thành công') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-300'
            }\`}>
              {uploadStatus.includes('thành công') ? <CheckCircle size={16} /> : <Info size={16} />}
              {uploadStatus}
            </div>
          )}`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(path, content, 'utf8');
console.log('Done fix upload predict!');
