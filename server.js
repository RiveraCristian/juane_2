const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const multer   = require('multer');
const { initDB } = require('./database');

const app = express();
const db  = initDB();

const JWT_SECRET  = process.env.JWT_SECRET  || 'seremis_maule_jwt_secret_2026';
const SALT_ROUNDS = 10;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

/* ── Migración de contraseñas a bcrypt ──────────────────── */
(function migratePasswords() {
  const users = db.prepare('SELECT id, pass FROM users').all();
  const upd   = db.prepare('UPDATE users SET pass = ? WHERE id = ?');
  const tx    = db.transaction(() => {
    for (const u of users) {
      if (!u.pass.startsWith('$2')) {
        upd.run(bcrypt.hashSync(u.pass, SALT_ROUNDS), u.id);
      }
    }
  });
  tx();
  console.log('✓ Contraseñas migradas a bcrypt');
})();

/* ── Multer (archivos) ──────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sid = req.body.seremiId || req.query.seremiId || 'general';
    const dir = path.join(UPLOADS_DIR, sid);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf','.doc','.docx','.xls','.xlsx','.jpg','.jpeg','.png','.gif','.webp'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

/* ── Audit log ──────────────────────────────────────────── */
function audit(userId, userName, accion, tabla, registroId, detalles) {
  try {
    db.prepare(`INSERT INTO audit_log (userId,userName,accion,tabla,registroId,detalles,fecha)
                VALUES (?,?,?,?,?,?,?)`)
      .run(userId||null, userName||null, accion, tabla||null,
           registroId ? String(registroId) : null,
           detalles ? JSON.stringify(detalles) : null,
           new Date().toISOString().slice(0,19).replace('T',' '));
  } catch(e) { /* silencioso */ }
}

/* ── JWT middleware ─────────────────────────────────────── */
function authRequired(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.jwtUser = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/* ── helpers ─────────────────────────────────────────────── */
function seremiData(sid) {
  const s = db.prepare('SELECT * FROM seremis WHERE id = ?').get(sid);
  if (!s) return null;
  const visitasArr   = db.prepare('SELECT * FROM visitas WHERE seremiId = ? ORDER BY fecha DESC').all(sid);
  const contactosArr = db.prepare('SELECT * FROM contactos WHERE seremiId = ? ORDER BY fecha DESC').all(sid);
  const prensaArr    = db.prepare('SELECT * FROM prensa WHERE seremiId = ? ORDER BY fecha DESC').all(sid);
  const proyectosArr = db.prepare('SELECT * FROM proyectos WHERE seremiId = ?').all(sid);
  const nudosArr     = db.prepare('SELECT * FROM nudos WHERE seremiId = ?').all(sid);
  const temasArr     = db.prepare('SELECT * FROM temas WHERE seremiId = ?').all(sid);
  const agendaArr    = db.prepare('SELECT * FROM agenda WHERE seremiId = ? ORDER BY fecha ASC').all(sid);

  s.visitasArray    = visitasArr;
  s.contactosArray  = contactosArr;
  s.prensaItems     = prensaArr;
  s.descripProyectos = proyectosArr;
  s.nudos           = nudosArr;
  s.temas           = temasArr;
  s.agenda          = agendaArr;

  s.visitasCount   = visitasArr.length;
  s.contactosCount = visitasArr.reduce((a,v) => a + (v.personas||0), 0)
                   + contactosArr.reduce((a,c) => a + (c.personas||0), 0);
  s.prensaCount    = prensaArr.length;
  s.proyectosCount = proyectosArr.length;

  s.visitas   = s.visitasCount;
  s.contactos = s.contactosCount;
  s.prensa    = s.prensaCount;
  s.proyectos = s.proyectosCount;
  s.comunas   = [...new Set(visitasArr.map(v => v.comuna).filter(Boolean))];
  return s;
}

/* ═══════════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════════ */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });

  const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!u) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  const valid = u.pass.startsWith('$2')
    ? bcrypt.compareSync(password, u.pass)
    : u.pass === password;
  if (!valid) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  const { pass, ...safe } = u;
  const token = jwt.sign({ id: u.id, username: u.username, rol: u.rol }, JWT_SECRET, { expiresIn: '8h' });
  audit(u.id, u.nombre, 'LOGIN', 'users', u.id, null);
  res.json({ ...safe, token });
});

/* ═══════════════════════════════════════════════════════════
   SEREMIs
═══════════════════════════════════════════════════════════ */
app.get('/api/seremis', authRequired, (req, res) => {
  const rows   = db.prepare('SELECT * FROM seremis').all();
  const result = rows.map(s => seremiData(s.id));
  res.json(result);
});

app.get('/api/seremis/:id', authRequired, (req, res) => {
  const d = seremiData(req.params.id);
  if (!d) return res.status(404).json({ error: 'SEREMI no encontrada' });
  res.json(d);
});

/* ═══════════════════════════════════════════════════════════
   VISITAS
═══════════════════════════════════════════════════════════ */
app.get('/api/visitas', authRequired, (req, res) => {
  const { seremiId, page, limit } = req.query;
  const lim = parseInt(limit) || 200;
  const off = ((parseInt(page)||1) - 1) * lim;
  const rows = seremiId
    ? db.prepare('SELECT * FROM visitas WHERE seremiId = ? ORDER BY fecha DESC LIMIT ? OFFSET ?').all(seremiId, lim, off)
    : db.prepare('SELECT * FROM visitas ORDER BY fecha DESC LIMIT ? OFFSET ?').all(lim, off);
  res.json(rows);
});

app.get('/api/visitas/:id', authRequired, (req, res) => {
  const row = db.prepare('SELECT * FROM visitas WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No encontrado' });
  res.json(row);
});

app.post('/api/visitas', authRequired, (req, res) => {
  const { seremiId, fecha, comuna, lugar, personas, descripcion } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO visitas (seremiId,fecha,comuna,lugar,personas,descripcion) VALUES (?,?,?,?,?,?)')
    .run(seremiId, fecha||null, comuna||null, lugar||null, personas||0, descripcion||null);
  audit(req.jwtUser.id, req.jwtUser.username, 'CREATE', 'visitas', r.lastInsertRowid, { seremiId, comuna });
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/visitas/:id', authRequired, (req, res) => {
  const { fecha, comuna, lugar, personas, descripcion } = req.body;
  db.prepare('UPDATE visitas SET fecha=?,comuna=?,lugar=?,personas=?,descripcion=? WHERE id=?')
    .run(fecha||null, comuna||null, lugar||null, personas||0, descripcion||null, req.params.id);
  audit(req.jwtUser.id, req.jwtUser.username, 'UPDATE', 'visitas', req.params.id, { comuna });
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   CONTACTOS
═══════════════════════════════════════════════════════════ */
app.get('/api/contactos', authRequired, (req, res) => {
  const { seremiId, page, limit } = req.query;
  const lim = parseInt(limit) || 200;
  const off = ((parseInt(page)||1) - 1) * lim;
  const rows = seremiId
    ? db.prepare('SELECT * FROM contactos WHERE seremiId = ? ORDER BY fecha DESC LIMIT ? OFFSET ?').all(seremiId, lim, off)
    : db.prepare('SELECT * FROM contactos ORDER BY fecha DESC LIMIT ? OFFSET ?').all(lim, off);
  res.json(rows);
});

app.get('/api/contactos/:id', authRequired, (req, res) => {
  const row = db.prepare('SELECT * FROM contactos WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No encontrado' });
  res.json(row);
});

app.post('/api/contactos', authRequired, (req, res) => {
  const { seremiId, nombre, fecha, lugar, personas, tipo, instituciones, descripcion } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO contactos (seremiId,nombre,fecha,lugar,personas,tipo,instituciones,descripcion) VALUES (?,?,?,?,?,?,?,?)')
    .run(seremiId, nombre||null, fecha||null, lugar||null, personas||0, tipo||null, instituciones||null, descripcion||null);
  audit(req.jwtUser.id, req.jwtUser.username, 'CREATE', 'contactos', r.lastInsertRowid, { seremiId });
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/contactos/:id', authRequired, (req, res) => {
  const { nombre, fecha, lugar, personas, tipo, instituciones, descripcion } = req.body;
  db.prepare('UPDATE contactos SET nombre=?,fecha=?,lugar=?,personas=?,tipo=?,instituciones=?,descripcion=? WHERE id=?')
    .run(nombre||null, fecha||null, lugar||null, personas||0, tipo||null, instituciones||null, descripcion||null, req.params.id);
  audit(req.jwtUser.id, req.jwtUser.username, 'UPDATE', 'contactos', req.params.id, null);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   PRENSA
═══════════════════════════════════════════════════════════ */
app.get('/api/prensa', authRequired, (req, res) => {
  const { seremiId, page, limit } = req.query;
  const lim = parseInt(limit) || 200;
  const off = ((parseInt(page)||1) - 1) * lim;
  const rows = seremiId
    ? db.prepare('SELECT * FROM prensa WHERE seremiId = ? ORDER BY fecha DESC LIMIT ? OFFSET ?').all(seremiId, lim, off)
    : db.prepare('SELECT * FROM prensa ORDER BY fecha DESC LIMIT ? OFFSET ?').all(lim, off);
  res.json(rows);
});

app.post('/api/prensa', authRequired, (req, res) => {
  const { seremiId, titular, medio, fecha, tipoMedio, tono, url, resumen } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO prensa (seremiId,titular,medio,fecha,tipoMedio,tono,url,resumen) VALUES (?,?,?,?,?,?,?,?)')
    .run(seremiId, titular||null, medio||null, fecha||null, tipoMedio||null, tono||null, url||null, resumen||null);
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/prensa/:id', authRequired, (req, res) => {
  const { titular, medio, fecha, tipoMedio, tono, url, resumen } = req.body;
  db.prepare('UPDATE prensa SET titular=?,medio=?,fecha=?,tipoMedio=?,tono=?,url=?,resumen=? WHERE id=?')
    .run(titular||null, medio||null, fecha||null, tipoMedio||null, tono||null, url||null, resumen||null, req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   PROYECTOS
═══════════════════════════════════════════════════════════ */
app.get('/api/proyectos', authRequired, (req, res) => {
  const { seremiId } = req.query;
  const rows = seremiId
    ? db.prepare('SELECT * FROM proyectos WHERE seremiId = ? ORDER BY id DESC').all(seremiId)
    : db.prepare('SELECT * FROM proyectos ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/proyectos', authRequired, (req, res) => {
  const { seremiId, title, meta, estado, presupuesto, descripcion, comunas } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO proyectos (seremiId,title,meta,estado,presupuesto,descripcion,comunas) VALUES (?,?,?,?,?,?,?)')
    .run(seremiId, title||null, meta||null, estado||null, presupuesto||null, descripcion||null, comunas||null);
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/proyectos/:id', authRequired, (req, res) => {
  const { title, meta, estado, presupuesto, descripcion, comunas } = req.body;
  db.prepare('UPDATE proyectos SET title=?,meta=?,estado=?,presupuesto=?,descripcion=?,comunas=? WHERE id=?')
    .run(title||null, meta||null, estado||null, presupuesto||null, descripcion||null, comunas||null, req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   NUDOS
═══════════════════════════════════════════════════════════ */
app.get('/api/nudos', authRequired, (req, res) => {
  const { seremiId } = req.query;
  const rows = seremiId
    ? db.prepare('SELECT * FROM nudos WHERE seremiId = ? ORDER BY id DESC').all(seremiId)
    : db.prepare('SELECT * FROM nudos ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/nudos', authRequired, (req, res) => {
  const { seremiId, title, desc, urgencia, solucion } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO nudos (seremiId,title,`desc`,urgencia,solucion) VALUES (?,?,?,?,?)')
    .run(seremiId, title||null, desc||null, urgencia||null, solucion||null);
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/nudos/:id', authRequired, (req, res) => {
  const { title, desc, urgencia, solucion } = req.body;
  db.prepare('UPDATE nudos SET title=?,`desc`=?,urgencia=?,solucion=? WHERE id=?')
    .run(title||null, desc||null, urgencia||null, solucion||null, req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   TEMAS
═══════════════════════════════════════════════════════════ */
app.get('/api/temas', authRequired, (req, res) => {
  const { seremiId } = req.query;
  const rows = seremiId
    ? db.prepare('SELECT * FROM temas WHERE seremiId = ? ORDER BY id DESC').all(seremiId)
    : db.prepare('SELECT * FROM temas ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/temas', authRequired, (req, res) => {
  const { seremiId, tema, ambito, prioridad, descripcion } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO temas (seremiId,tema,ambito,prioridad,descripcion) VALUES (?,?,?,?,?)')
    .run(seremiId, tema||null, ambito||null, prioridad||null, descripcion||null);
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/temas/:id', authRequired, (req, res) => {
  const { tema, ambito, prioridad, descripcion } = req.body;
  db.prepare('UPDATE temas SET tema=?,ambito=?,prioridad=?,descripcion=? WHERE id=?')
    .run(tema||null, ambito||null, prioridad||null, descripcion||null, req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   AGENDA
═══════════════════════════════════════════════════════════ */
app.get('/api/agenda', authRequired, (req, res) => {
  const { seremiId } = req.query;
  const rows = seremiId
    ? db.prepare('SELECT * FROM agenda WHERE seremiId = ? ORDER BY id DESC').all(seremiId)
    : db.prepare('SELECT * FROM agenda ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/agenda', authRequired, (req, res) => {
  const { seremiId, fecha, texto, cat, lugar, notas } = req.body;
  if (!seremiId) return res.status(400).json({ error: 'seremiId requerido' });
  const r = db.prepare('INSERT INTO agenda (seremiId,fecha,texto,cat,lugar,notas) VALUES (?,?,?,?,?,?)')
    .run(seremiId, fecha||null, texto||null, cat||null, lugar||null, notas||null);
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/agenda/:id', authRequired, (req, res) => {
  const { fecha, texto, cat, lugar, notas } = req.body;
  db.prepare('UPDATE agenda SET fecha=?,texto=?,cat=?,lugar=?,notas=? WHERE id=?')
    .run(fecha||null, texto||null, cat||null, lugar||null, notas||null, req.params.id);
  res.json({ ok: true });
});

/* ── Delete genérico ─────────────────────────────────────── */
const DELETABLE = ['visitas','contactos','prensa','proyectos','nudos','temas','agenda'];

app.delete('/api/:table/:id', authRequired, (req, res) => {
  const { table, id } = req.params;
  if (!DELETABLE.includes(table)) return res.status(400).json({ error: 'Tabla no válida' });
  db.prepare(`DELETE FROM \`${table}\` WHERE id = ?`).run(id);
  audit(req.jwtUser.id, req.jwtUser.username, 'DELETE', table, id, null);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   CONTRATACIONES
═══════════════════════════════════════════════════════════ */
app.get('/api/contrataciones', authRequired, (req, res) => {
  const { seremiId, page, limit } = req.query;
  const lim = parseInt(limit) || 200;
  const off = ((parseInt(page)||1) - 1) * lim;
  let rows;
  if (seremiId) {
    rows = db.prepare('SELECT * FROM contrataciones WHERE seremiId = ? ORDER BY id DESC LIMIT ? OFFSET ?').all(seremiId, lim, off);
  } else {
    rows = db.prepare('SELECT * FROM contrataciones ORDER BY id DESC LIMIT ? OFFSET ?').all(lim, off);
  }
  res.json(rows);
});

app.post('/api/contrataciones', authRequired, (req, res) => {
  const b = req.body;
  if (!b.seremiId || !b.nombre || !b.rut || !b.cargo || !b.inicio || !b.termino || !b.monto || !b.just)
    return res.status(400).json({ error: 'Campos obligatorios faltantes' });
  const r = db.prepare(`INSERT INTO contrataciones
    (seremiId,nombre,rut,cargo,grado,tipo,esNuevo,inicio,termino,monto,financ,just,estado,vbQuien,vbFecha,creadoPor,creadoEn)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(b.seremiId, b.nombre, b.rut, b.cargo, b.grado||'', b.tipo||'Honorarios',
         b.esNuevo||'Nuevo', b.inicio, b.termino, b.monto, b.financ||'', b.just,
         'Pendiente', '', '', b.creadoPor||'', b.creadoEn||new Date().toISOString().slice(0,10));
  audit(req.jwtUser.id, req.jwtUser.username, 'CREATE', 'contrataciones', r.lastInsertRowid, { nombre: b.nombre });
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/contrataciones/:id', authRequired, (req, res) => {
  const b = req.body;
  db.prepare(`UPDATE contrataciones SET
    nombre=?,rut=?,cargo=?,grado=?,tipo=?,esNuevo=?,inicio=?,termino=?,monto=?,financ=?,just=?
    WHERE id=?`)
    .run(b.nombre||null, b.rut||null, b.cargo||null, b.grado||null, b.tipo||null,
         b.esNuevo||null, b.inicio||null, b.termino||null, b.monto||null, b.financ||null,
         b.just||null, req.params.id);
  audit(req.jwtUser.id, req.jwtUser.username, 'UPDATE', 'contrataciones', req.params.id, null);
  res.json({ ok: true });
});

app.put('/api/contrataciones/:id/vb', authRequired, (req, res) => {
  const { vbQuien } = req.body;
  const fecha = new Date().toISOString().slice(0,10);
  db.prepare('UPDATE contrataciones SET estado=?,vbQuien=?,vbFecha=? WHERE id=?')
    .run('Aprobada', vbQuien||'Administrador Regional', fecha, req.params.id);
  audit(req.jwtUser.id, req.jwtUser.username, 'APPROVE', 'contrataciones', req.params.id, { vbQuien });
  res.json({ ok: true, vbFecha: fecha });
});

app.delete('/api/contrataciones/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM contrataciones WHERE id = ?').run(req.params.id);
  audit(req.jwtUser.id, req.jwtUser.username, 'DELETE', 'contrataciones', req.params.id, null);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   ARCHIVOS — Mejora 3
═══════════════════════════════════════════════════════════ */
app.post('/api/archivos', authRequired, (req, res, next) => {
  upload.single('archivo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
    const { seremiId, tabla, registroId } = req.body;
    const rutaRel = `/uploads/${seremiId||'general'}/${req.file.filename}`;
    const r = db.prepare(`INSERT INTO archivos
      (seremiId,tabla,registroId,nombre,nombreDisco,ruta,tipo,tamano,subidoPor,subidoEn)
      VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(seremiId||null, tabla||null, registroId||null,
           req.file.originalname, req.file.filename, rutaRel,
           req.file.mimetype, req.file.size,
           req.jwtUser.username,
           new Date().toISOString().slice(0,10));
    audit(req.jwtUser.id, req.jwtUser.username, 'UPLOAD', 'archivos', r.lastInsertRowid, { nombre: req.file.originalname });
    res.json({ id: r.lastInsertRowid, ruta: rutaRel, nombre: req.file.originalname, tipo: req.file.mimetype, tamano: req.file.size });
  });
});

app.get('/api/archivos', authRequired, (req, res) => {
  const { seremiId, tabla, registroId } = req.query;
  let q = 'SELECT * FROM archivos WHERE 1=1';
  const params = [];
  if (seremiId)   { q += ' AND seremiId = ?';   params.push(seremiId); }
  if (tabla)      { q += ' AND tabla = ?';       params.push(tabla); }
  if (registroId) { q += ' AND registroId = ?';  params.push(registroId); }
  q += ' ORDER BY id DESC';
  res.json(db.prepare(q).all(...params));
});

app.delete('/api/archivos/:id', authRequired, (req, res) => {
  const f = db.prepare('SELECT * FROM archivos WHERE id = ?').get(req.params.id);
  if (!f) return res.status(404).json({ error: 'Archivo no encontrado' });
  const fullPath = path.join(__dirname, f.ruta.replace(/^\//, ''));
  try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch(e) {}
  db.prepare('DELETE FROM archivos WHERE id = ?').run(req.params.id);
  audit(req.jwtUser.id, req.jwtUser.username, 'DELETE', 'archivos', req.params.id, { nombre: f.nombre });
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   COMENTARIOS — Mejora 7
═══════════════════════════════════════════════════════════ */
app.get('/api/comentarios', authRequired, (req, res) => {
  const { seremiId, tabla, registroId } = req.query;
  const rows = db.prepare('SELECT * FROM comentarios WHERE seremiId=? AND tabla=? AND registroId=? ORDER BY id ASC')
    .all(seremiId||'', tabla||'', parseInt(registroId)||0);
  res.json(rows);
});

app.post('/api/comentarios', authRequired, (req, res) => {
  const { seremiId, tabla, registroId, texto } = req.body;
  if (!texto?.trim()) return res.status(400).json({ error: 'Texto requerido' });
  const r = db.prepare('INSERT INTO comentarios (seremiId,tabla,registroId,texto,autorId,autorNombre,fecha) VALUES (?,?,?,?,?,?,?)')
    .run(seremiId||null, tabla||null, registroId||null, texto.trim(),
         req.jwtUser.id, req.jwtUser.username,
         new Date().toISOString().slice(0,16).replace('T',' '));
  res.json({ id: r.lastInsertRowid });
});

app.delete('/api/comentarios/:id', authRequired, (req, res) => {
  const c = db.prepare('SELECT * FROM comentarios WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Comentario no encontrado' });
  if (c.autorId !== req.jwtUser.id && req.jwtUser.rol !== 'admin')
    return res.status(403).json({ error: 'Sin permiso' });
  db.prepare('DELETE FROM comentarios WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   KPIs — Mejora 12
═══════════════════════════════════════════════════════════ */
app.get('/api/kpis', authRequired, (req, res) => {
  const { seremiId } = req.query;
  const rows = seremiId
    ? db.prepare('SELECT * FROM kpi_indicadores WHERE seremiId = ? ORDER BY id').all(seremiId)
    : db.prepare('SELECT * FROM kpi_indicadores ORDER BY seremiId, id').all();
  res.json(rows);
});

app.post('/api/kpis', authRequired, (req, res) => {
  const { seremiId, nombre, meta, real, unidad, periodo, descripcion } = req.body;
  if (!seremiId || !nombre) return res.status(400).json({ error: 'seremiId y nombre requeridos' });
  const r = db.prepare('INSERT INTO kpi_indicadores (seremiId,nombre,meta,real,unidad,periodo,descripcion) VALUES (?,?,?,?,?,?,?)')
    .run(seremiId, nombre, meta||0, real||0, unidad||null, periodo||null, descripcion||null);
  audit(req.jwtUser.id, req.jwtUser.username, 'CREATE', 'kpis', r.lastInsertRowid, { seremiId, nombre });
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/kpis/:id', authRequired, (req, res) => {
  const { nombre, meta, real, unidad, periodo, descripcion } = req.body;
  db.prepare('UPDATE kpi_indicadores SET nombre=?,meta=?,real=?,unidad=?,periodo=?,descripcion=? WHERE id=?')
    .run(nombre||null, meta||0, real||0, unidad||null, periodo||null, descripcion||null, req.params.id);
  audit(req.jwtUser.id, req.jwtUser.username, 'UPDATE', 'kpis', req.params.id, null);
  res.json({ ok: true });
});

app.delete('/api/kpis/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM kpi_indicadores WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   USERS
═══════════════════════════════════════════════════════════ */
app.get('/api/users', authRequired, (req, res) => {
  const rows = db.prepare('SELECT id,username,rol,seremiId,nombre,cargo,email,tel FROM users').all();
  res.json(rows);
});

app.post('/api/users', authRequired, (req, res) => {
  const b = req.body;
  if (!b.nombre || !b.username || !b.pass) return res.status(400).json({ error: 'Campos obligatorios faltantes' });
  const hashed = bcrypt.hashSync(b.pass, SALT_ROUNDS);
  const id = b.username + '_' + Date.now();
  try {
    db.prepare('INSERT INTO users (id,username,pass,rol,seremiId,nombre,cargo,email,tel) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, b.username, hashed, b.rol||'seremi', b.seremiId||null, b.nombre, b.cargo||'', b.email||'', b.tel||'');
    audit(req.jwtUser.id, req.jwtUser.username, 'CREATE_USER', 'users', id, { username: b.username });
    res.json({ id });
  } catch {
    res.status(409).json({ error: 'Usuario ya existe' });
  }
});

app.put('/api/users/:id', authRequired, (req, res) => {
  const b = req.body;
  if (b.pass) {
    const hashed = bcrypt.hashSync(b.pass, SALT_ROUNDS);
    db.prepare('UPDATE users SET nombre=?,cargo=?,username=?,pass=?,email=?,tel=?,rol=?,seremiId=? WHERE id=?')
      .run(b.nombre, b.cargo||'', b.username, hashed, b.email||'', b.tel||'', b.rol||'seremi', b.seremiId||null, req.params.id);
  } else {
    db.prepare('UPDATE users SET nombre=?,cargo=?,username=?,email=?,tel=?,rol=?,seremiId=? WHERE id=?')
      .run(b.nombre, b.cargo||'', b.username, b.email||'', b.tel||'', b.rol||'seremi', b.seremiId||null, req.params.id);
  }
  audit(req.jwtUser.id, req.jwtUser.username, 'UPDATE_USER', 'users', req.params.id, null);
  res.json({ ok: true });
});

app.delete('/api/users/:id', authRequired, (req, res) => {
  if (req.params.id === 'admin') return res.status(403).json({ error: 'No se puede eliminar al admin' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ── Audit por registro (cualquier rol) ────────────────── */
app.get('/api/audit/:tabla/:id', authRequired, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM audit_log WHERE tabla = ? AND registroId = ? ORDER BY id DESC LIMIT 100'
  ).all(req.params.tabla, req.params.id);
  res.json(rows);
});

/* ── Audit global (solo admin) ────────────────────────── */
app.get('/api/audit', authRequired, (req, res) => {
  if (req.jwtUser.rol !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 200').all();
  res.json(rows);
});

/* ── Start ─────────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor SEREMIS Maule corriendo en http://localhost:${PORT}`);
});
