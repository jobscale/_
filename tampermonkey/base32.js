const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

class Base32 {
  encode(buffer) {
    // Convert ArrayBuffer or Uint8Array to binary string
    const binaryString = Array.from(
      typeof Uint8Array === 'undefined' ? Buffer.from(buffer) : new Uint8Array(buffer),
    )
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('');

    const bitsPerChar = 5;

    // Pad the binary string to a multiple of 5
    const length = Math.ceil(binaryString.length / bitsPerChar);
    const padding = [1, 2, 3].includes(binaryString.length % bitsPerChar) ? '=' : '';
    const paddedBinaryString = binaryString.padEnd(length * bitsPerChar, '0');

    // Split the binary string into 5-bit chunks
    const chunks = paddedBinaryString.match(/.{1,5}/g);

    // Create the Base32 string
    const strArr = chunks.map(chunk => base32Chars[parseInt(chunk, 2)]);
    if (padding) {
      strArr.push(padding);
    }
    return strArr.join('');
  }

  decode(encoded) {
    const base32Lookup = {};
    for (let i = 0; i < base32Chars.length; i++) {
      base32Lookup[base32Chars[i]] = i;
    }

    const base32String = encoded.replace(/=+$/, '').toUpperCase();
    const bitsPerChar = 5;

    let binaryString = '';
    for (let i = 0; i < base32String.length; i++) {
      const char = base32String[i];
      if (base32Lookup[char] === undefined) {
        throw new Error(`Invalid character in Base32 string: ${char}`);
      }
      const binaryValue = base32Lookup[char].toString(2).padStart(bitsPerChar, '0');
      binaryString += binaryValue;
    }

    // Split the binary string into 8-bit chunks
    const chunks = binaryString.match(/.{1,8}/g).filter(v => v.length === 8);

    // Create a Buffer from the 8-bit chunks
    if (typeof Uint8Array === 'undefined') {
      return Buffer.from(chunks.map(chunk => parseInt(chunk, 2)));
    }

    return new Uint8Array(chunks.map(chunk => parseInt(chunk, 2)));
  }
}

// Example usage
const list = [
  [1],
  [1, 2],
  [1, 2, 3],
  [1, 2, 3, 4],
  [1, 2, 3, 4, 5],
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6, 7],
  [1, 2, 3, 4, 5, 6, 7, 8],
];
const logger = console;
const base32 = new Base32();
for (const data of list) {
  const encoded = base32.encode(data);
  const decodedBuffer = base32.decode(encoded);
  logger.info(encoded, JSON.stringify(Array.from(decodedBuffer)));
}
