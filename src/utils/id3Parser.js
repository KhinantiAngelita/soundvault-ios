// Parser ID3v2.3 & ID3v2.4 ringan murni JavaScript (tanpa dependensi native)
// Membaca Judul (TIT2), Artist (TPE1), Album (TALB), Tahun (TYER/TDRC), Genre (TCON),
// Lirik (USLT), dan Cover Album tertanam (APIC) langsung dari file MP3.

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

export const base64ToBytes = (base64) => {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const byteLength = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(Math.max(0, byteLength));
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const a = BASE64_LOOKUP[clean.charCodeAt(i)];
    const b = BASE64_LOOKUP[clean.charCodeAt(i + 1)] || 0;
    const c = BASE64_LOOKUP[clean.charCodeAt(i + 2)] || 0;
    const d = BASE64_LOOKUP[clean.charCodeAt(i + 3)] || 0;

    if (p < byteLength) bytes[p++] = (a << 2) | (b >> 4);
    if (p < byteLength) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < byteLength) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes;
};

export const bytesToBase64 = (bytes) => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += BASE64_CHARS[b1 >> 2];
    out += BASE64_CHARS[((b1 & 3) << 4) | (b2 >> 4)];
    out += i + 1 < bytes.length ? BASE64_CHARS[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    out += i + 2 < bytes.length ? BASE64_CHARS[b3 & 63] : '=';
  }
  return out;
};

const readSynchsafeInt = (bytes, offset) =>
  ((bytes[offset] & 0x7f) << 21) |
  ((bytes[offset + 1] & 0x7f) << 14) |
  ((bytes[offset + 2] & 0x7f) << 7) |
  (bytes[offset + 3] & 0x7f);

const readUint32BE = (bytes, offset) =>
  ((bytes[offset] << 24) >>> 0) +
  (bytes[offset + 1] << 16) +
  (bytes[offset + 2] << 8) +
  bytes[offset + 3];

const decodeText = (bytes, start, end, encoding) => {
  if (start >= end) return '';

  // UTF-16 with BOM (1) or UTF-16BE (2)
  if (encoding === 1 || encoding === 2) {
    let pos = start;
    let littleEndian = false;
    if (encoding === 1 && pos + 1 < end) {
      if (bytes[pos] === 0xff && bytes[pos + 1] === 0xfe) {
        littleEndian = true;
        pos += 2;
      } else if (bytes[pos] === 0xfe && bytes[pos + 1] === 0xff) {
        littleEndian = false;
        pos += 2;
      }
    }
    let str = '';
    for (let i = pos; i + 1 < end; i += 2) {
      const code = littleEndian
        ? bytes[i] | (bytes[i + 1] << 8)
        : (bytes[i] << 8) | bytes[i + 1];
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str.trim();
  }

  // UTF-8 (3)
  if (encoding === 3) {
    let str = '';
    let i = start;
    while (i < end) {
      const b = bytes[i++];
      if (b === 0) break;
      if (b < 0x80) {
        str += String.fromCharCode(b);
      } else if ((b & 0xe0) === 0xc0 && i < end) {
        const b2 = bytes[i++];
        str += String.fromCharCode(((b & 0x1f) << 6) | (b2 & 0x3f));
      } else if ((b & 0xf0) === 0xe0 && i + 1 < end) {
        const b2 = bytes[i++];
        const b3 = bytes[i++];
        str += String.fromCharCode(
          ((b & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f)
        );
      } else if ((b & 0xf8) === 0xf0 && i + 2 < end) {
        const b2 = bytes[i++];
        const b3 = bytes[i++];
        const b4 = bytes[i++];
        const cp =
          (((b & 0x07) << 18) |
            ((b2 & 0x3f) << 12) |
            ((b3 & 0x3f) << 6) |
            (b4 & 0x3f)) -
          0x10000;
        str += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
      }
    }
    return str.trim();
  }

  // ISO-8859-1 (0)
  let str = '';
  for (let i = start; i < end; i++) {
    if (bytes[i] === 0) break;
    str += String.fromCharCode(bytes[i]);
  }
  return str.trim();
};

const parseAPICFrame = (bytes, start, end) => {
  if (start + 4 >= end) return null;
  const encoding = bytes[start];
  let pos = start + 1;

  // MIME type (null-terminated ASCII)
  let mime = '';
  while (pos < end && bytes[pos] !== 0) {
    mime += String.fromCharCode(bytes[pos++]);
  }
  pos++; // skip null
  if (pos >= end) return null;

  pos++; // skip picture type byte

  // Description (null-terminated according to encoding)
  if (encoding === 1 || encoding === 2) {
    while (pos + 1 < end && !(bytes[pos] === 0 && bytes[pos + 1] === 0)) {
      pos += 2;
    }
    pos += 2;
  } else {
    while (pos < end && bytes[pos] !== 0) {
      pos++;
    }
    pos += 1;
  }

  if (pos >= end) return null;
  const imgBytes = bytes.slice(pos, end);
  if (imgBytes.length < 100) return null;

  const normalizedMime = mime.toLowerCase().includes('png')
    ? 'image/png'
    : 'image/jpeg';

  return {
    mime: normalizedMime,
    ext: normalizedMime === 'image/png' ? 'png' : 'jpg',
    base64: bytesToBase64(imgBytes),
  };
};

const parseUSLTFrame = (bytes, start, end) => {
  if (start + 5 >= end) return '';
  const encoding = bytes[start];
  let pos = start + 4; // skip encoding (1) + language (3)

  // Skip content descriptor
  if (encoding === 1 || encoding === 2) {
    while (pos + 1 < end && !(bytes[pos] === 0 && bytes[pos + 1] === 0)) {
      pos += 2;
    }
    pos += 2;
  } else {
    while (pos < end && bytes[pos] !== 0) {
      pos++;
    }
    pos += 1;
  }

  return decodeText(bytes, pos, end, encoding);
};

export const parseID3TagsFromBytes = (bytes) => {
  const result = {
    title: null,
    artist: null,
    album: null,
    year: null,
    genre: null,
    lyrics: null,
    cover: null,
  };

  try {
    if (!bytes || bytes.length < 10) return result;
    // Check "ID3" header
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
      return result;
    }

    const version = bytes[3]; // 3 = ID3v2.3, 4 = ID3v2.4
    if (version !== 3 && version !== 4) return result;

    const flags = bytes[5];
    const tagSize = readSynchsafeInt(bytes, 6);
    const maxOffset = Math.min(bytes.length, 10 + tagSize);

    let offset = 10;
    // Skip extended header if present
    if ((flags & 0x40) !== 0 && offset + 4 <= maxOffset) {
      const extSize =
        version === 4
          ? readSynchsafeInt(bytes, offset)
          : readUint32BE(bytes, offset);
      offset += version === 4 ? extSize : extSize + 4;
    }

    while (offset + 10 <= maxOffset) {
      const frameId = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );

      if (frameId === '\0\0\0\0' || !/^[A-Z0-9]{4}$/.test(frameId)) {
        break;
      }

      const frameSize =
        version === 4
          ? readSynchsafeInt(bytes, offset + 4)
          : readUint32BE(bytes, offset + 4);

      const frameStart = offset + 10;
      const frameEnd = frameStart + frameSize;

      if (frameSize <= 0 || frameEnd > bytes.length) {
        break;
      }

      if (frameId === 'TIT2' && !result.title) {
        result.title = decodeText(bytes, frameStart + 1, frameEnd, bytes[frameStart]);
      } else if (frameId === 'TPE1' && !result.artist) {
        result.artist = decodeText(bytes, frameStart + 1, frameEnd, bytes[frameStart]);
      } else if (frameId === 'TALB' && !result.album) {
        result.album = decodeText(bytes, frameStart + 1, frameEnd, bytes[frameStart]);
      } else if ((frameId === 'TYER' || frameId === 'TDRC') && !result.year) {
        const y = decodeText(bytes, frameStart + 1, frameEnd, bytes[frameStart]);
        const match = y.match(/\d{4}/);
        if (match) result.year = match[0];
      } else if (frameId === 'TCON' && !result.genre) {
        const rawGenre = decodeText(bytes, frameStart + 1, frameEnd, bytes[frameStart]);
        // Bersihkan kode genre numerik seperti "(17)Rock" -> "Rock"
        const cleaned = rawGenre.replace(/^\(\d+\)/, '').trim();
        if (cleaned) result.genre = cleaned;
      } else if (frameId === 'USLT' && !result.lyrics) {
        const lyr = parseUSLTFrame(bytes, frameStart, frameEnd);
        if (lyr) result.lyrics = lyr;
      } else if (frameId === 'APIC' && !result.cover) {
        result.cover = parseAPICFrame(bytes, frameStart, frameEnd);
      }

      offset = frameEnd;
    }
  } catch (e) {
    // Kembalikan apa pun yang sempat terbaca
  }

  return result;
};
