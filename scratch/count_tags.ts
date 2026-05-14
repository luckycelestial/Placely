
import fs from 'fs';

const content = fs.readFileSync('c:/Users/Pavithran/Placely/src/app/admin/reports/page.tsx', 'utf8');
const lines = content.split('\n');

let openTags = 0;
let closingTags = 0;

lines.forEach((line, index) => {
  const openMatches = line.match(/<div/g);
  const closingMatches = line.match(/<\/div>/g);
  const selfClosingMatches = line.match(/<div[^>]*\/>/g);

  if (openMatches) openTags += openMatches.length;
  if (closingMatches) closingTags += closingMatches.length;
  if (selfClosingMatches) {
    openTags -= selfClosingMatches.length;
    // self closing counts as both, so effectively they cancel out or we don't count them
  }
});

console.log('Open divs:', openTags);
console.log('Closing divs:', closingTags);
