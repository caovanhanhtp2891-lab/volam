import test from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { CHARACTER_ATLAS_SIZE, CHARACTER_SECTS, characterFrame, characterPortraitCrop, defaultCharacterSex } from "../src/character-art.ts";

test("each sect and gender uses its own complete painted character tile", () => {
  const frames = [];
  for (const id of CHARACTER_SECTS) for (const sex of ["male", "female"]) {
    const [x, y, width, height] = characterFrame(id, sex);
    assert.ok(x >= 0 && y >= 0 && x + width <= 1 && y + height <= 1);
    frames.push(`${x},${y}`);
  }
  assert.equal(frames.length, 20); assert.equal(new Set(frames).size, 20);
  assert.deepEqual(CHARACTER_ATLAS_SIZE, { width: 1223, height: 1286 });
  assert.ok(statSync(new URL("../src/assets/sect-characters.webp", import.meta.url)).size < 768 * 1024);
});
test("avatars crop the same sect and gender tile as the full character", () => {
  for (const id of CHARACTER_SECTS) for (const sex of ["male", "female"]) {
    const [x, y, w, h] = characterFrame(id, sex), [cx, cy, cw, ch] = characterPortraitCrop(id, sex);
    assert.ok(cx >= x * CHARACTER_ATLAS_SIZE.width && cy >= y * CHARACTER_ATLAS_SIZE.height);
    assert.ok(cx + cw <= (x + w) * CHARACTER_ATLAS_SIZE.width);
    assert.ok(cy + ch <= (y + h) * CHARACTER_ATLAS_SIZE.height);
  }
  assert.equal(defaultCharacterSex("nga-mi"), "female");
  assert.equal(defaultCharacterSex("thuy-yen"), "female");
});
