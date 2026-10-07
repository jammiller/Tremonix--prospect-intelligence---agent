import {test} from 'node:test';import assert from 'node:assert/strict';import {score,parseCSV,summary} from '../scoring.js';
test('scores and clamps buying signals',()=>{assert.equal(score({fit:true,budget:true,growth:true,engaged:true,signals:9}).total,100);assert.equal(score({signals:-5}).total,0);});
test('priority thresholds',()=>{assert.equal(score({fit:true,budget:true,signals:3}).status,'Hot');assert.equal(score({fit:true,signals:3}).status,'Warm');assert.equal(score({fit:true,signals:1}).status,'Nurture');assert.equal(score({}).status,'Low Priority');});
test('CSV handles quotes commas multiline CRLF and BOM',()=>{assert.deepEqual(parseCSV('\uFEFFcompanyName,industry\r\n"A, B","Training\nservices"\r\n"Say ""hi""",Retail'),[{companyName:'A, B',industry:'Training\nservices'},{companyName:'Say "hi"',industry:'Retail'}]);});
test('CSV rejects missing headers and unmatched quotes',()=>{assert.throws(()=>parseCSV('name\nTest'));assert.throws(()=>parseCSV('companyName\n"Test'));});
test('summary does not invent growth or employee facts',()=>{const s=summary({companyName:'Test'});assert.ok(s.includes('not yet confirmed'));assert.ok(!s.includes('Growth has been reported'));});
