import re

with open(r'C:\Users\ntrun\.gemini\antigravity\brain\1140bbe6-a3da-4ad8-8efb-bcaa46d079f9\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.findall(r'Showing lines \d+ to \d+\\nThe following code has been modified.*?([1-9]\d*: .*?)(\\n\\nThe above content|\\\"\})', content, re.DOTALL)
if matches:
    # Get the last match
    code = matches[-1][0]
    lines = code.split(r'\n')
    clean_lines = []
    for line in lines:
        line = re.sub(r'^\d+: ', '', line)
        clean_lines.append(line)
    
    with open('e:/my-project/eduguard-ai/server/src/modules/graph/service_recovered.js', 'w', encoding='utf-8') as out:
        out.write('\n'.join(clean_lines))
    print('Recovered last view!')
else:
    print('No matches found.')
