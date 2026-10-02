'use strict';
Object.keys(THEMES).forEach(k => {
  const T = THEMES[k];
  asset('bg_' + k + '_far', BGW, 768, (ctx, w, h) => T.far(ctx, w, h), { fmt: 'jpg', q: 0.86, meta: { horizon: 0.72 } });
  asset('bg_' + k + '_mid', BGW, 512, (ctx, w, h) => T.mid(ctx, w, h));
  asset('bg_' + k + '_near', BGW, 320, (ctx, w, h) => T.near(ctx, w, h));
  asset('thumb_' + k, 400, 225, (ctx, w, h) => {
    const mk = (W, H, f) => { const c = document.createElement('canvas'); c.width = W; c.height = H; f(c.getContext('2d'), W, H); return c; };
    const far = mk(BGW, 768, T.far), mid = mk(BGW, 512, T.mid), near = mk(BGW, 320, T.near);
    const sw = 900;
    ctx.drawImage(far, 300, 768 - sw * h / w - 20, sw, sw * h / w, 0, 0, w, h);
    ctx.drawImage(mid, 300, 0, sw, 512, 0, h - 512 * w / sw * 0.75, w, 512 * w / sw * 0.75);
    ctx.drawImage(near, 600, 0, sw, 320, 0, h - 320 * w / sw * 0.8, w, 320 * w / sw * 0.8);
    ctx.fillStyle = lg(ctx, 0, h * 0.6, 0, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']]); ctx.fillRect(0, 0, w, h);
  }, { fmt: 'jpg', q: 0.85 });
});
Object.keys(TEX).forEach(k => asset('tex_' + k, 512, 512, (ctx, w) => texture(ctx, w, TEX[k].base, TEX[k].dark, TEX[k].light, TEX[k]), { fmt: 'jpg', q: 0.85 }));
