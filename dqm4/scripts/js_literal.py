"""Parse JavaScript data literals without executing source code."""
import re,json
class Parser:
 def __init__(self,s):self.s=s;self.i=0
 def space(self):
  while self.i<len(self.s) and self.s[self.i].isspace():self.i+=1
 def val(self):
  self.space();c=self.s[self.i]
  if c in "'\"":
   q=c;self.i+=1;out=''
   while self.s[self.i]!=q:
    c=self.s[self.i];self.i+=1
    if c=='\\':
     c=self.s[self.i];self.i+=1
     if c=='u':c=chr(int(self.s[self.i:self.i+4],16));self.i+=4
     elif c=='x':c=chr(int(self.s[self.i:self.i+2],16));self.i+=2
     else:c={'n':'\n','r':'\r','t':'\t'}.get(c,c)
    out+=c
   self.i+=1;return out
  if c in '[{':
   self.i+=1;obj={} if c=='{' else [];end='}' if c=='{' else ']';self.space()
   while self.s[self.i]!=end:
    if c=='{':
     self.space()
     if self.s[self.i] in "'\"":k=self.val()
     else:
      m=re.match(r'[A-Za-z_$][\w$]*',self.s[self.i:]);assert m;k=m[0];self.i+=len(k)
     self.space();assert self.s[self.i]==':';self.i+=1;obj[k]=self.val()
    else:obj.append(self.val())
    self.space()
    if self.s[self.i]==',':self.i+=1;self.space()
    else:assert self.s[self.i]==end
   self.i+=1;return obj
  m=re.match(r'-?\d+(?:\.\d+)?|true|false|null',self.s[self.i:]);assert m,self.s[self.i:self.i+40];self.i+=len(m[0]);return json.loads(m[0])
