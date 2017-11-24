/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
PDFReference - represents a reference to another object in the PDF object heirarchy
By Devon Govett
*/

const zlib = require('zlib');
const stream = require('stream');

class PDFReference extends stream.Writable {
  constructor(document, id, data) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.finalize = this.finalize.bind(this);
    this.document = document;
    this.id = id;
    if (data == null) { data = {}; }
    this.data = data;
    super({decodeStrings: false});
    this.gen = 0;
    this.deflate = null;
    this.compress = this.document.compress && !this.data.Filter;
    this.uncompressedLength = 0;
    this.chunks = [];
  }
    
  initDeflate() {
    this.data.Filter = 'FlateDecode';
    
    this.deflate = zlib.createDeflate();
    this.deflate.on('data', chunk => {
      this.chunks.push(chunk);
      return this.data.Length += chunk.length;
    });
      
    return this.deflate.on('end', this.finalize);
  }
    
  _write(chunk, encoding, callback) {
    if (!Buffer.isBuffer(chunk)) {
      chunk = new Buffer(chunk + '\n', 'binary');
    }
      
    this.uncompressedLength += chunk.length;
    if (this.data.Length == null) { this.data.Length = 0; }
    
    if (this.compress) {
      if (!this.deflate) { this.initDeflate(); }
      this.deflate.write(chunk);
    } else {
      this.chunks.push(chunk);
      this.data.Length += chunk.length;
    }
      
    return callback();
  }
    
  end(chunk) {
    super.end(...arguments);
    
    if (this.deflate) {
      return this.deflate.end();
    } else {
      return this.finalize();
    }
  }
    
  finalize() {
    this.offset = this.document._offset;
    
    this.document._write(`${this.id} ${this.gen} obj`);
    this.document._write(PDFObject.convert(this.data));
    
    if (this.chunks.length) {
      this.document._write('stream');
      for (let chunk of Array.from(this.chunks)) {
        this.document._write(chunk);
      }
        
      this.chunks.length = 0; // free up memory
      this.document._write('\nendstream');
    }
      
    this.document._write('endobj');
    return this.document._refEnd(this);
  }
    
  toString() {
    return `${this.id} ${this.gen} R`;
  }
}
      
module.exports = PDFReference;
var PDFObject = require('./object');
