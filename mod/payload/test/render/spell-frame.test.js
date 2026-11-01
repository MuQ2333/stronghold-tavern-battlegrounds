import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakePixi, fakeViewCtx } from './fakepixi.js';

test('native spell icons fit whole while downloaded illustrations crop to fill', async () => {
  const fake = installFakePixi();
  try {
    const draws = [], clips = [];
    const create = document.createElement.bind(document);
    document.createElement = tag => {
      const element = create(tag);
      if (tag === 'canvas') {
        const ctx = element.getContext('2d');
        ctx.drawImage = (...args) => draws.push(args);
        ctx.clip = () => clips.push(true);
      }
      return element;
    };
    const { itemTexture } = await import('../../public/js/render/textures.js');
    itemTexture('native-wide-regression', { width: 200, height: 100, src: '/assets/items/identity.png' }, 0xad7ce5, true);
    const [, x, y, w, h] = draws.at(-1);
    assert.equal(w, 88); assert.equal(h, 44);
    assert.ok(x >= 20 && y >= 20 && x + w <= 108 && y + h <= 108);
    assert.equal(clips.length, 0, 'native icon is not clipped');
    itemTexture('support-shield-regression', { width: 128, height: 128, src: '/assets/spells/hoshiguma_shield.png' }, 0xad7ce5, true);
    assert.equal(clips.length, 0, 'the original Hoshiguma shield also fits without clipping');
    itemTexture('illustration-wide-regression', { width: 200, height: 100, src: '/assets/spells/example.png' }, 0xad7ce5, true);
    assert.ok(draws.at(-1)[3] >= 88 && draws.at(-1)[4] >= 88);
    assert.equal(clips.length, 1, 'illustration overflow is clipped inside its frame');
  } finally { fake.restore(); }
});

test('WebGL item plates keep distinct equipment/spell frames after the icon loads', async () => {
  const fake = installFakePixi();
  try {
    const { ItemView } = await import('../../public/js/render/units.js');
    const { itemTexture } = await import('../../public/js/render/textures.js');
    const image = { width: 64, height: 64 };
    const ctx = fakeViewCtx(globalThis.PIXI, { assets: { image: async () => image } });
    const info = { id: 9000, uid: 9000, defId: 'spell-frame-test', icon: '/test-icon.png', color: 0xad7ce5 };
    const equipment = new ItemView(ctx, info);
    const spell = new ItemView(ctx, { ...info, id: 9001, uid: 9001, spell: true });
    assert.notEqual(equipment.plate.texture, spell.plate.texture);
    await Promise.resolve();
    assert.equal(equipment.plate.texture, itemTexture(info.icon, image, info.color));
    assert.equal(spell.plate.texture, itemTexture(info.icon, image, info.color, true));
    assert.notEqual(equipment.plate.texture, spell.plate.texture, 'loading the same icon keeps each frame');
    equipment.destroy(); spell.destroy();
  } finally { fake.restore(); }
});
