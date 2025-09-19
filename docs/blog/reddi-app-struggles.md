## Building the reddi app: my struggles so far  

I wanted to document the messy journey of getting my **Reddit Fun & Games Hackathon app** running. If nothing else, it might help someone else avoid the same pitfalls (or at least get a laugh out of my debugging pain).  

### Node.js version hell  
- I had to **downgrade Node for another project**, which broke Devvit.  
- When I ran `npx devvit login`, I hit this error:  

```bash
import { parseEnv } from 'node:util';
         ^^^^^^^^
SyntaxError: The requested module 'node:util' does not provide an export named 'parseEnv'
```

- Turns out **Devvit requires Node 20.11.1**, but I was juggling different versions (Node 24 locally vs Node 20 for Cloudflare builds).  
- Fixing this meant reinstalling Node with NVM and carefully checking which project used which version.  

### Global install confusion  
- At one point, I ran:  
```bash
npm -g ls devvit @devvit/cli
```
and discovered my global Devvit install was **empty**.  
- I uninstalled and reinstalled `devvit` and `@devvit/cli`, but the CLI kept behaving strangely.  

### Playtest woes  
- I successfully pushed a build with:  
```bash
npx devvit playtest reddi_dev
```
and got the success message:  
`Installing playtest version 0.0.7.2... Success!`  
- Link: [https://www.reddit.com/r/reddi_dev/?playtest=reddi-pet](https://www.reddit.com/r/reddi_dev/?playtest=reddi-pet)  
- **But nothing showed up in Reddit** — no “Interactive Post” option, no visible app.  

### Possible causes I wrestled with  
- Was my **index.html** wrong? Did it need special hooks?  
- Did Codex generate my app files inside `/src` instead of `/dist`, so Reddit wasn’t seeing the correct bundle?  
- I even wondered if there’s some secret flag in `devvit.json` that enables interactive posts.  

### Random errors & conflicts  
- Ports already in use (`EADDRINUSE: :::5678`) when trying to run playtests locally.  
- `package-lock.json` issues: Codex kept generating new ones, breaking PRs because binary files weren’t accepted.  
- Dependency mismatches (Next.js 15.2.4 marked as invalid, forcing me to roll back).  

### The bigger picture  
Honestly, this has been a grind: bouncing between **Node mismatches, empty installs, playtest invisibility, and Devvit quirks**.  
But I’m keeping all of this in, because the hackathon isn’t just about polished apps — it’s also about showing the **behind-the-scenes struggle**.  

Hopefully, by the deadline, I’ll have something at least *playable*. And if not… well, I’ll share the story anyway.  
