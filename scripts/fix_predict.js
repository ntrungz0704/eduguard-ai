const fs = require('fs');
const path = 'client/src/pages/Predict.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the negative impact div mapping block
const searchStr = `                          {singleStudent.reasons?.filter(r => r.impact === 'negative').length > 0 ? (
                            singleStudent.reasons?.filter(r => r.impact === 'negative').map((r, i) => (
                              <div key={i} className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-xs flex items-center gap-2 text-rose-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></div>
                                <span className="font-semibold">{r.subject}: {r.score}đ</span>
                                <span className="text-[10px] bg-rose-500/10 px-1.5 py-0.5 rounded-md font-bold">r = {r.r}</span>
                              </div>
                            ))
                          ) : (`;

const replaceStr = `                          {singleStudent.reasons?.filter(r => r.impact === 'negative').length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {singleStudent.reasons?.filter(r => r.impact === 'negative').map((r, i) => (
                                <li key={i} className="text-xs text-rose-300">
                                  Chuỗi môn tiên quyết bị gãy: <span className="font-bold text-white">{r.subject}</span> ({r.score}đ)
                                </li>
                              ))}
                              {singleStudent.risk === 'high' && (
                                <li className="text-xs text-amber-300">
                                  Lịch sử học tập cho thấy dấu hiệu chuyên cần giảm sút trong các học kỳ gần đây.
                                </li>
                              )}
                            </ul>
                          ) : (`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
