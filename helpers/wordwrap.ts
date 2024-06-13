


function trimEnd(str) {
    let lastCharPos = str.length - 1;
    let lastChar = str[lastCharPos];
    while(lastChar === ' ' || lastChar === '\t') {
      lastChar = str[--lastCharPos];
    }
    return str.substring(0, lastCharPos + 1);
  }
  
  function trimTabAndSpaces(str) {
    const lines = str.split('\n');
    const trimmedLines = lines.map((line) => trimEnd(line));
    return trimmedLines.join('\n');
  }
  
  // stolen from here https://github.com/jonschlinkert/word-wrap/blob/master/index.js
  export function wordWrap(str:string, options:{width?:number, indent?:string, newline?:string, escape?:Function, cut?:boolean, trim?:boolean}) {
    options = options || {};
  
    let width = options.width || 50;
    let indent = options.indent || '';
  
    let newline = options.newline || '\n' + indent;
    let escape = options.escape || identity
  
    let regexString = '.{1,' + width + '}';
    if (options.cut !== true) {
      regexString += '([\\s\u200B]+|$)|[^\\s\u200B]+?([\\s\u200B]+|$)';
    }
  
    let re = new RegExp(regexString, 'g');
    let lines = str.match(re) || [];
    let result = indent + lines.map((line) => {
      if (line.slice(-1) === '\n') {
        line = line.slice(0, line.length - 1);
      }
      return escape(line);
    }).join(newline);
  
    if (options.trim === true) {
      result = trimTabAndSpaces(result);
    }
    return result;
  }
  
  function identity(str:string) {
    return str;
  }