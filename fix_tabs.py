import re, sys
p = 'tabs-header.js'
s = open(p, encoding='utf-8').read()

old = """        if (t.symbol && t.tf) {
          var tf = document.createElement('span');
          tf.className = 'ici-tf'; tf.textContent = TFL[t.tf] || t.tf;
          d.appendChild(tf);
        }
"""
if old not in s:
    sys.exit('ERROR: tf block nahi mila, kuch change nahi kiya')
s = s.replace(old, "")

marker = "    document.head.appendChild(css);\n"
if marker not in s:
    sys.exit('ERROR: css marker nahi mila')
extra = marker + """    var cssSmall = document.createElement('style');
    cssSmall.textContent = '@media (max-width:600px){'
      + '#iciTabsList{gap:2px !important}'
      + '.ici-tab{padding:0 5px !important;gap:3px !important;min-width:0 !important}'
      + '.ici-txt{font-size:10px !important;max-width:64px !important}'
      + '.ici-dot{width:5px !important;height:5px !important}'
      + '.ici-x{width:14px !important;height:14px !important;font-size:11px !important;margin-left:0 !important}'
      + '#iciTabsAdd{width:20px !important}'
      + '}';
    document.head.appendChild(cssSmall);
"""
s = s.replace(marker, extra, 1)
open(p, 'w', encoding='utf-8').write(s)
print('OK')
