'use strict';
asset('truck_body', TK.W, TK.H, ctx => drawTruckBody(ctx), { meta: { ppm: TK.P, ax: TK.ax, ay: TK.ay, geo: GEO } });
asset('truck_interior', TK.W, TK.H, ctx => drawTruckInterior(ctx), { meta: { ppm: TK.P, ax: TK.ax, ay: TK.ay } });
asset('wheel', 256, 256, ctx => drawWheel(ctx, 256, false), { meta: { r: 125 } });
asset('wheel_chrome', 256, 256, ctx => drawWheel(ctx, 256, true), { meta: { r: 125 } });
asset('door', 150, 276, (ctx, w, h) => drawBackDoor(ctx, w, h), { meta: { ppm: TK.P } });
['norm', 'happy', 'scared', 'dizzy', 'cool'].forEach(m => asset('serega_' + m, 240, 240, ctx => drawSerega(ctx, 240, m), { meta: { size: 240 } }));
