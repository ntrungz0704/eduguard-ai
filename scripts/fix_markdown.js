const fs = require('fs');
const path = 'client/src/pages/AIChat.jsx';
let content = fs.readFileSync(path, 'utf8');

const searchStr = `      // 3. Regular text paragraph
      if (line === '') {
        continue;
      }
      
      const parsedContent = parseInlineStyles(line);
      elements.push(
        <p key={\`p-\${i}\`} className="mb-3 text-slate-300 leading-relaxed text-sm font-medium">
          {parsedContent}
        </p>
      );`;

const replaceStr = `      // 3. Headers
      if (line.startsWith('### ')) {
        const text = line.replace('### ', '');
        elements.push(
          <h4 key={\`h4-\${i}\`} className="text-lg font-bold text-white mt-4 mb-2">
            {parseInlineStyles(text)}
          </h4>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        const text = line.replace('## ', '');
        elements.push(
          <h3 key={\`h3-\${i}\`} className="text-xl font-bold text-white mt-5 mb-3 border-b border-white/10 pb-2">
            {parseInlineStyles(text)}
          </h3>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        const text = line.replace('# ', '');
        elements.push(
          <h2 key={\`h2-\${i}\`} className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mt-6 mb-4">
            {parseInlineStyles(text)}
          </h2>
        );
        continue;
      }
      
      // 4. Regular text paragraph
      if (line === '') {
        continue;
      }
      
      const parsedContent = parseInlineStyles(line);
      elements.push(
        <p key={\`p-\${i}\`} className="mb-3 text-slate-300 leading-relaxed text-sm font-medium">
          {parsedContent}
        </p>
      );`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(path, content, 'utf8');
console.log('Done fix markdown!');
