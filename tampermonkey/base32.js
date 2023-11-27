const base32Decode = encoded => {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const base32Lookup = {};
  for (let i = 0; i < base32Chars.length; i++) {
    base32Lookup[base32Chars[i]] = i;
  }

  const base32String = encoded.replace(/=+$/, '').toUpperCase();
  const bitsPerChar = 5;
  const bitsPerByte = 8;

  let binaryString = '';
  for (let i = 0; i < base32String.length; i++) {
    const char = base32String[i];
    if (base32Lookup[char] === undefined) {
      throw new Error(`Invalid character in Base32 string: ${char}`);
    }
    const binaryValue = base32Lookup[char].toString(2).padStart(bitsPerChar, '0');
    binaryString += binaryValue;
  }

  // Pad the binary string to a multiple of 8
  const paddedBinaryString = binaryString.padEnd(Math.ceil(binaryString.length / bitsPerByte) * bitsPerByte, '0');

  // Split the binary string into 8-bit chunks
  const chunks = paddedBinaryString.match(/.{1,8}/g);

  // Create a Buffer from the 8-bit chunks
  if (typeof Uint8Array === 'undefined') {
    return Buffer.from(chunks.map(chunk => parseInt(chunk, 2)));
  }

  return new Uint8Array(chunks.map(chunk => parseInt(chunk, 2)));
}

// Example usage
const logger = console;
const base32String = 'MFRGGZA=';
const decodedBuffer = base32Decode(base32String);
logger.info(Array.from(decodedBuffer));
