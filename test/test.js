import fs from 'fs';
import md2cleanjson from '../src/md2cleanjson.js';
import json2md from '../src/json2md.js';
import json2cleanjson from '../src/json2cleanjson.js';
import cleanjson2md from '../src/cleanjson2md.js';
import data from '../test/json.json' assert { type: 'json' };
import cleanData from '../test/clean_json.json' assert { type: 'json' };

// Initialize markdown variable
let markdown;

/////// Test md2json
// Read the mock markdown file
const markdownContent = fs.readFileSync(new URL('../test/markdown_text.md', import.meta.url), 'utf-8');
// Test converter on markdown text
const result = md2cleanjson(markdownContent);
// Log the output for visual inspection
console.log(result);

/////// Test json2md
markdown = json2md(data);
console.log(markdown);

/////// Test json2cleanjson
const cleanJSON = json2cleanjson(data);
console.log(cleanJSON);

/////// Test cleanjson2md
markdown = cleanjson2md(cleanData);
console.log(markdown);
