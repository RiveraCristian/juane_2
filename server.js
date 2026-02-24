const express = require('express');
const path = require('path');
const { initDB } = require('./database');

const app = express();
const db = initDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ── helpers ─────────────────────────────────────────── */

function seremiData(sid) {
  const s = db.prepare('SELECT * FROM seremis WHERE id = ?').get(sid);
  if (!s) return null;
  const visitasArr      = db.prepare('SELECT * FROM visitas WHERE seremiId = ? ORDER BY fecha DESC').all(sid);
  const contactosArr    = db.prepare('SELECT * FROM contactos WHERE seremiId = ? ORDER BY fecha DESC').all(sid);
  const prensaArr       = db.prepare('SELECT * FROM prensa WHERE seremiId = ? ORDER BY fecha DESC').all(sid);
  const proyectosArr    = db.prepare('SELECT * FROM proyectos WHERE seremiId = ?').all(sid);
  const nudosArr        = db.prepare('SELECT * FROM nudos WHERE seremiId = ?').all(sid);
  const temasArr        = db.prepare('SELECT * FROM temas WHERE seremiId = ?').all(sid);
  const agendaArr       = db.prepare('SELECT * FROM agenda WHERE seremiId = ? ORDER BY fecha ASC').all(sid);
  
  // Arrays (nombres descriptivos)
  s.visitasArray = visitasArr;
  s.contactosArray = contactosArr;
  s.prensaItems  = prensaArr;
  s.descripProyectos = proyectosArr;
  s.nudos        = nudosArr;
  s.temas        = temasArr;
  s.agenda       = agendaArr;
  
  // Computed counters (compatibilidad con frontend)
  s.visitasCount   = visitasArr.length;
  s.contactosCount = visitasArr.reduce((a, v) => a + (v.personas || 0), 0)
                   + contactosArr.reduce((a, c) => a + (c.personas || 0), 0);
  s.prensaCount    = prensaArr.length;
  s.proyectosCount = proyectosArr.length;
  
  // Aliases para compatibilidad (números simples)
  s.visitas   = s.visitasCount;
  s.contactos = s.contactosCount;
  s.prensa    = s.prensaCount;
  s.proyectos = s.proyectosCount;
  
  // Unique comunas from visitas
  s.comunas = [...new Set(visitasArr.map(v => v.comuna).filter(Boolean))];
  return s;
}

/* ── Auth ─────────────────────────────────────────────── */

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });
  const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!u || u.pass !== password) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  const { pass, ...safe } = u;
  res.json(safe);
});

/* ── SEREMIs ──────────────────────────────────────────── */

app.get('/api/seremis', (req, res) => {
  const rows = db.prepare('SELECT * FROM seremis').all();
  const result = rows.map(s => {
    const d = seremiData(s.id);
    return d;
  });
  res.json(result);
});

app.get('/api/seremis/:id', (req, res) => {
  const d = seremiData(req.params.id);
  if (!d) return res.status(404).json({ error: 'SEREMI no encontrada' });
  res.json(d);
});

/* ── Records (generic create) ─────────────────────────── */

app.post('/api/visitas', (req, res) => {
  const { seremiId, fecha, comuna, lugar, personas, descripcion } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO visitas (seremiId, fecha, comuna, lugar, personas, descripcion) VALUES (?,?,?,?,?,?)')
    .run(seremiId, fecha || null, comuna || null, lugar || null, personas || 0, descripcion || null);
  res.json({ id: r.lastInsertRowid });
});

app.post('/api/contactos', (req, res) => {
  const { seremiId, nombre, fecha, lugar, personas, tipo, instituciones, descripcion } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO contactos (seremiId, nombre, fecha, lugar, personas, tipo, instituciones, descripcion) VALUES (?,?,?,?,?,?,?,?)')
    .run(seremiId, nombre || null, fecha || null, lugar || null, personas || 0, tipo || null, instituciones || null, descripcion || null);
  res.json({ id: r.lastInsertRowid });
});

app.post('/api/prensa', (req, res) => {
  const { seremiId, titular, medio, fecha, tipoMedio, tono, url, resumen } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO prensa (seremiId, titular, medio, fecha, tipoMedio, tono, url, resumen) VALUES (?,?,?,?,?,?,?,?)')
    .run(seremiId, titular || null, medio || null, fecha || null, tipoMedio || null, tono || null, url || null, resumen || null);
  res.json({ id: r.lastInsertRowid });
});

app.post('/api/proyectos', (req, res) => {
  const { seremiId, title, meta, estado, presupuesto, descripcion, comunas } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO proyectos (seremiId, title, meta, estado, presupuesto, descripcion, comunas) VALUES (?,?,?,?,?,?,?)')
    .run(seremiId, title || null, meta || null, estado || null, presupuesto || null, descripcion || null, comunas || null);
  res.json({ id: r.lastInsertRowid });
});

app.post('/api/nudos', (req, res) => {
  const { seremiId, title, desc, urgencia, solucion } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO nudos (seremiId, title, `desc`, urgencia, solucion) VALUES (?,?,?,?,?)')
    .run(seremiId, title || null, desc || null, urgencia || null, solucion || null);
  res.json({ id: r.lastInsertRowid });
});

app.post('/api/temas', (req, res) => {
  const { seremiId, tema, ambito, prioridad, descripcion } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO temas (seremiId, tema, ambito, prioridad, descripcion) VALUES (?,?,?,?,?)')
    .run(seremiId, tema || null, ambito || null, prioridad || null, descripcion || null);
  res.json({ id: r.lastInsertRowid });
});

app.post('/api/agenda', (req, res) => {
  const { seremiId, fecha, texto, cat, lugar, notas } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO agenda (seremiId, fecha, texto, cat, lugar, notas) VALUES (?,?,?,?,?,?)')
    .run(seremiId, fecha || null, texto || null, cat || null, lugar || null, notas || null);
  res.json({ id: r.lastInsertRowid });
});

/* ── Records (update) ─────────────────────────────────── */

app.put('/api/proyectos/:id', (req, res) => {
  const { title, meta, estado, presupuesto, descripcion, comunas } = req.body;
  db.prepare('UPDATE proyectos SET title=?, meta=?, estado=?, presupuesto=?, descripcion=?, comunas=? WHERE id=?')
    .run(title || null, meta || null, estado || null, presupuesto || null, descripcion || null, comunas || null, req.params.id);
  res.json({ ok: true });
});

app.put('/api/nudos/:id', (req, res) => {
  const { title, desc, urgencia, solucion } = req.body;
  db.prepare('UPDATE nudos SET title=?, `desc`=?, urgencia=?, solucion=? WHERE id=?')
    .run(title || null, desc || null, urgencia || null, solucion || null, req.params.id);
  res.json({ ok: true });
});

app.put('/api/temas/:id', (req, res) => {
  const { tema, ambito, prioridad, descripcion } = req.body;
  db.prepare('UPDATE temas SET tema=?, ambito=?, prioridad=?, descripcion=? WHERE id=?')
    .run(tema || null, ambito || null, prioridad || null, descripcion || null, req.params.id);
  res.json({ ok: true });
});

app.put('/api/agenda/:id', (req, res) => {
  const { fecha, texto, cat, lugar, notas } = req.body;
  db.prepare('UPDATE agenda SET fecha=?, texto=?, cat=?, lugar=?, notas=? WHERE id=?')
    .run(fecha || null, texto || null, cat || null, lugar || null, notas || null, req.params.id);
  res.json({ ok: true });
});

app.put('/api/prensa/:id', (req, res) => {
  const { titular, medio, fecha, tipoMedio, tono, url, resumen } = req.body;
  db.prepare('UPDATE prensa SET titular=?, medio=?, fecha=?, tipoMedio=?, tono=?, url=?, resumen=? WHERE id=?')
    .run(titular || null, medio || null, fecha || null, tipoMedio || null, tono || null, url || null, resumen || null, req.params.id);
  res.json({ ok: true });
});

/* ── Records (delete) ─────────────────────────────────── */

const DELETABLE = ['visitas', 'contactos', 'prensa', 'proyectos', 'nudos', 'temas', 'agenda'];

app.delete('/api/:table/:id', (req, res) => {
  const { table, id } = req.params;
  if (!DELETABLE.includes(table)) return res.status(400).json({ error: 'Tabla no válida' });
  db.prepare(`DELETE FROM \`${table}\` WHERE id = ?`).run(id);
  res.json({ ok: true });
});

/* ── Contrataciones ───────────────────────────────────── */

app.get('/api/contrataciones', (req, res) => {
  const { seremiId } = req.query;
  const rows = seremiId
    ? db.prepare('SELECT * FROM contrataciones WHERE seremiId = ? ORDER BY id DESC').all(seremiId)
    : db.prepare('SELECT * FROM contrataciones ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/contrataciones', (req, res) => {
  const b = req.body;
  if (!b.seremiId || !b.nombre || !b.rut || !b.cargo || !b.inicio || !b.termino || !b.monto || !b.just) {
    return res.status(400).json({ error: 'Campos obligatorios faltantes' });
  }
  const r = db.prepare(`INSERT INTO contrataciones
    (seremiId, nombre, rut, cargo, grado, tipo, esNuevo, inicio, termino, monto, financ, just, estado, vbQuien, vbFecha, creadoPor, creadoEn)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(b.seremiId, b.nombre, b.rut, b.cargo, b.grado || '', b.tipo || 'Honorarios',
      b.esNuevo || 'Nuevo',
      b.inicio, b.termino, b.monto, b.financ || '', b.just,
      'Pendiente', '', '', b.creadoPor || '', b.creadoEn || new Date().toISOString().slice(0, 10));
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/contrataciones/:id/vb', (req, res) => {
  const { vbQuien } = req.body;
  const fecha = new Date().toISOString().slice(0, 10);
  db.prepare('UPDATE contrataciones SET estado = ?, vbQuien = ?, vbFecha = ? WHERE id = ?')
    .run('Aprobada', vbQuien || 'Administrador Regional', fecha, req.params.id);
  res.json({ ok: true, vbFecha: fecha });
});

/* ── Users ────────────────────────────────────────────── */

app.get('/api/users', (req, res) => {
  const rows = db.prepare('SELECT id, username, rol, seremiId, nombre, cargo, email, tel FROM users').all();
  res.json(rows);
});

app.post('/api/users', (req, res) => {
  const b = req.body;
  if (!b.nombre || !b.username || !b.pass) return res.status(400).json({ error: 'Campos obligatorios faltantes' });
  const id = b.username + '_' + Date.now();
  try {
    db.prepare('INSERT INTO users (id, username, pass, rol, seremiId, nombre, cargo, email, tel) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, b.username, b.pass, b.rol || 'seremi', b.seremiId || null, b.nombre, b.cargo || '', b.email || '', b.tel || '');
    res.json({ id });
  } catch (e) {
    res.status(409).json({ error: 'Usuario ya existe' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const b = req.body;
  // Si se proporciona contraseña, actualizar todo; si no, mantener contraseña actual
  if (b.pass) {
    db.prepare('UPDATE users SET nombre=?, cargo=?, username=?, pass=?, email=?, tel=?, rol=?, seremiId=? WHERE id=?')
      .run(b.nombre, b.cargo || '', b.username, b.pass, b.email || '', b.tel || '', b.rol || 'seremi', b.seremiId || null, req.params.id);
  } else {
    db.prepare('UPDATE users SET nombre=?, cargo=?, username=?, email=?, tel=?, rol=?, seremiId=? WHERE id=?')
      .run(b.nombre, b.cargo || '', b.username, b.email || '', b.tel || '', b.rol || 'seremi', b.seremiId || null, req.params.id);
  }
  res.json({ ok: true });
});

app.delete('/api/users/:id', (req, res) => {
  if (req.params.id === 'admin') return res.status(403).json({ error: 'No se puede eliminar al admin' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ── Start ────────────────────────────────────────────── */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor SEREMIS Maule corriendo en http://localhost:${PORT}`);
});
