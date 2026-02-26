const fs=require('fs'); const path='app/(public)/login/page.tsx'; const lines=fs.readFileSync(path,'utf8').split('\n'); lines.slice(30,60).forEach((line,i)=>console.log(${i+31}: ));
