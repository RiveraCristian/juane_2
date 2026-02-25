const Database = require('better-sqlite3');
const path = require('path');

function initDB() {
  const db = new Database(path.join(__dirname, 'seremis.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  /* ── Schema ─────────────────────────────────────────────── */

  db.exec(`
    CREATE TABLE IF NOT EXISTS \`seremis\` (
      \`id\`     TEXT PRIMARY KEY,
      \`sector\` TEXT NOT NULL,
      \`nombre\` TEXT NOT NULL,
      \`c1\`     TEXT,
      \`c2\`     TEXT
    );

    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\`       TEXT PRIMARY KEY,
      \`username\` TEXT UNIQUE NOT NULL,
      \`pass\`     TEXT NOT NULL,
      \`rol\`      TEXT NOT NULL,
      \`seremiId\` TEXT,
      \`nombre\`   TEXT NOT NULL,
      \`cargo\`    TEXT,
      \`email\`    TEXT,
      \`tel\`      TEXT,
      FOREIGN KEY (\`seremiId\`) REFERENCES \`seremis\`(\`id\`)
    );

    CREATE TABLE IF NOT EXISTS \`visitas\` (
      \`id\`          INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\`    TEXT NOT NULL,
      \`fecha\`       TEXT,
      \`comuna\`      TEXT,
      \`lugar\`       TEXT,
      \`personas\`    INTEGER DEFAULT 0,
      \`descripcion\` TEXT
    );

    CREATE TABLE IF NOT EXISTS \`contactos\` (
      \`id\`            INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\`      TEXT NOT NULL,
      \`nombre\`        TEXT,
      \`fecha\`         TEXT,
      \`lugar\`         TEXT,
      \`personas\`      INTEGER DEFAULT 0,
      \`tipo\`          TEXT,
      \`instituciones\` TEXT,
      \`descripcion\`   TEXT
    );

    CREATE TABLE IF NOT EXISTS \`prensa\` (
      \`id\`        INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\`  TEXT NOT NULL,
      \`titular\`   TEXT,
      \`medio\`     TEXT,
      \`fecha\`     TEXT,
      \`tipoMedio\` TEXT,
      \`tono\`      TEXT,
      \`url\`       TEXT,
      \`resumen\`   TEXT
    );

    CREATE TABLE IF NOT EXISTS \`proyectos\` (
      \`id\`          INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\`    TEXT NOT NULL,
      \`title\`       TEXT,
      \`meta\`        TEXT,
      \`estado\`      TEXT,
      \`presupuesto\` TEXT,
      \`descripcion\` TEXT,
      \`comunas\`     TEXT
    );

    CREATE TABLE IF NOT EXISTS \`nudos\` (
      \`id\`       INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\` TEXT NOT NULL,
      \`title\`    TEXT,
      \`desc\`     TEXT,
      \`urgencia\` TEXT,
      \`solucion\` TEXT
    );

    CREATE TABLE IF NOT EXISTS \`temas\` (
      \`id\`          INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\`    TEXT NOT NULL,
      \`tema\`        TEXT,
      \`ambito\`      TEXT,
      \`prioridad\`   TEXT,
      \`descripcion\` TEXT
    );

    CREATE TABLE IF NOT EXISTS \`agenda\` (
      \`id\`       INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\` TEXT NOT NULL,
      \`fecha\`    TEXT,
      \`texto\`    TEXT,
      \`cat\`      TEXT,
      \`lugar\`    TEXT,
      \`notas\`    TEXT
    );

    CREATE TABLE IF NOT EXISTS \`contrataciones\` (
      \`id\`        INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\`  TEXT NOT NULL,
      \`nombre\`    TEXT,
      \`rut\`       TEXT,
      \`cargo\`     TEXT,
      \`grado\`     TEXT,
      \`tipo\`      TEXT,
      \`esNuevo\`   TEXT DEFAULT 'Nuevo',
      \`inicio\`    TEXT,
      \`termino\`   TEXT,
      \`monto\`     TEXT,
      \`financ\`    TEXT,
      \`just\`      TEXT,
      \`estado\`    TEXT DEFAULT 'Pendiente',
      \`vbQuien\`   TEXT,
      \`vbFecha\`   TEXT,
      \`creadoPor\` TEXT,
      \`creadoEn\`  TEXT
    );

    CREATE TABLE IF NOT EXISTS \`archivos\` (
      \`id\`           INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\`     TEXT NOT NULL,
      \`tabla\`        TEXT,
      \`registroId\`   INTEGER,
      \`nombre\`       TEXT NOT NULL,
      \`nombreDisco\`  TEXT NOT NULL,
      \`ruta\`         TEXT NOT NULL,
      \`tipo\`         TEXT,
      \`tamano\`       INTEGER,
      \`subidoPor\`    TEXT,
      \`subidoEn\`     TEXT
    );

    CREATE TABLE IF NOT EXISTS \`comentarios\` (
      \`id\`          INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\`    TEXT NOT NULL,
      \`tabla\`       TEXT NOT NULL,
      \`registroId\`  INTEGER NOT NULL,
      \`texto\`       TEXT NOT NULL,
      \`autorId\`     TEXT,
      \`autorNombre\` TEXT,
      \`fecha\`       TEXT
    );

    CREATE TABLE IF NOT EXISTS \`kpi_indicadores\` (
      \`id\`          INTEGER PRIMARY KEY AUTOINCREMENT,
      \`seremiId\`    TEXT NOT NULL,
      \`nombre\`      TEXT NOT NULL,
      \`meta\`        REAL DEFAULT 0,
      \`real\`        REAL DEFAULT 0,
      \`unidad\`      TEXT,
      \`periodo\`     TEXT,
      \`descripcion\` TEXT
    );

    CREATE TABLE IF NOT EXISTS \`audit_log\` (
      \`id\`         INTEGER PRIMARY KEY AUTOINCREMENT,
      \`userId\`     TEXT,
      \`userName\`   TEXT,
      \`accion\`     TEXT NOT NULL,
      \`tabla\`      TEXT,
      \`registroId\` TEXT,
      \`detalles\`   TEXT,
      \`fecha\`      TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_visitas_seremi    ON visitas(seremiId);
    CREATE INDEX IF NOT EXISTS idx_visitas_fecha     ON visitas(fecha);
    CREATE INDEX IF NOT EXISTS idx_contactos_seremi  ON contactos(seremiId);
    CREATE INDEX IF NOT EXISTS idx_prensa_seremi     ON prensa(seremiId);
    CREATE INDEX IF NOT EXISTS idx_prensa_fecha      ON prensa(fecha);
    CREATE INDEX IF NOT EXISTS idx_contrat_seremi    ON contrataciones(seremiId);
    CREATE INDEX IF NOT EXISTS idx_contrat_estado    ON contrataciones(estado);
    CREATE INDEX IF NOT EXISTS idx_comentarios_ref   ON comentarios(tabla, registroId);
    CREATE INDEX IF NOT EXISTS idx_archivos_ref      ON archivos(tabla, registroId);
    CREATE INDEX IF NOT EXISTS idx_kpi_seremi        ON kpi_indicadores(seremiId);
  `);

  /* ── Helpers ────────────────────────────────────────────── */

  const VALID_TABLES = new Set([
    'users','seremis','visitas','contactos','prensa',
    'proyectos','nudos','temas','agenda','contrataciones',
  ]);
  const count = (table) => {
    if (!VALID_TABLES.has(table)) throw new Error(`Invalid table: ${table}`);
    return db.prepare(`SELECT COUNT(*) AS n FROM \`${table}\``).get().n;
  };

  /* ── Seed SEREMIs ───────────────────────────────────────── */

  if (count('seremis') === 0) {
    const ins = db.prepare(
      'INSERT INTO `seremis` (`id`,`sector`,`nombre`,`c1`,`c2`) VALUES (?,?,?,?,?)'
    );
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
    tx([
      ['salud','salud','SEREMI de Salud','#e85454','#c93a3a'],
      ['educacion','educacion','SEREMI de Educación','#3a7bd5','#2a5ea8'],
      ['obras','obras','SEREMI MOP','#f59e0b','#d97706'],
      ['agricultura','agricultura','SEREMI Agricultura','#22c55e','#16a34a'],
      ['vivienda','vivienda','SEREMI Vivienda','#8b5cf6','#6d28d9'],
      ['transporte','transporte','SEREMI Transporte','#06b6d4','#0891b2'],
      ['bienes','bienes','SEREMI Bienes Nacionales','#ec4899','#db2777'],
      ['trabajo','trabajo','SEREMI Trabajo','#f97316','#ea580c'],
      ['medioambiente','medioambiente','SEREMI Medio Ambiente','#10b981','#059669'],
      ['energia','energia','SEREMI Energía','#eab308','#ca8a04'],
      ['economia','economia','SEREMI Economía','#64748b','#475569'],
      ['mineria','mineria','SEREMI Minería','#78716c','#57534e'],
      ['desarrollosocial','desarrollosocial','SEREMI Desarrollo Social','#a855f7','#9333ea'],
      ['justicia','justicia','SEREMI Justicia','#ef4444','#dc2626'],
      ['interior','interior','SEREMI Interior','#6366f1','#4f46e5'],
      ['cultura','cultura','SEREMI Cultura','#f472b6','#ec4899'],
      ['ciencia','ciencia','SEREMI Ciencia','#14b8a6','#0d9488'],
      ['deporte','deporte','SEREMI Deporte','#fb923c','#f97316'],
      ['mujer','mujer','SEREMI Mujer','#c084fc','#a855f7'],
    ]);
  }

  /* ── Seed Users ─────────────────────────────────────────── */

  if (count('users') === 0) {
    const ins = db.prepare(
      'INSERT INTO `users` (`id`,`username`,`pass`,`rol`,`seremiId`,`nombre`,`cargo`,`email`,`tel`) VALUES (?,?,?,?,?,?,?,?,?)'
    );
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
    tx([
      ['admin','admin','admin123','admin',null,'Administrador Regional','Admin','admin@gore-maule.cl',''],
      ['salud','salud','seremi123','seremi','salud','Carmen López','Dra.','clopez@minsal.cl','+56 9 1111 0001'],
      ['educacion','educacion','seremi123','seremi','educacion','Rodrigo Valdivia','Sr.','rvaldivia@mineduc.cl','+56 9 1111 0002'],
      ['obras','obras','seremi123','seremi','obras','Felipe Meza','Ing.','fmeza@mop.gov.cl','+56 9 1111 0003'],
      ['agricultura','agricultura','seremi123','seremi','agricultura','Marcela Torres','Ing.','mtorres@minagri.gob.cl','+56 9 1111 0004'],
      ['vivienda','vivienda','seremi123','seremi','vivienda','Sandra Rojas','Arq.','srojas@minvu.cl','+56 9 1111 0005'],
      ['transporte','transporte','seremi123','seremi','transporte','Pablo Ibáñez','Sr.','pibanez@mtt.gob.cl','+56 9 1111 0006'],
      ['bienes','bienes','seremi123','seremi','bienes','Antonio Fuentes','Sr.','afuentes@bienes.cl','+56 9 1111 0007'],
      ['trabajo','trabajo','seremi123','seremi','trabajo','Claudia Vera','Sra.','cvera@mintrab.gob.cl','+56 9 1111 0008'],
      ['medioambiente','medioambiente','seremi123','seremi','medioambiente','Valentina Soto','Dra.','vsoto@mma.gob.cl','+56 9 1111 0009'],
      ['energia','energia','seremi123','seremi','energia','Cristóbal Ramos','Ing.','cramos@energia.gob.cl','+56 9 1111 0010'],
      ['economia','economia','seremi123','seremi','economia','Fernanda Lagos','Mg.','flagos@economia.cl','+56 9 1111 0011'],
      ['mineria','mineria','seremi123','seremi','mineria','Jorge Espinoza','Ing.','jespinoza@minmineria.cl','+56 9 1111 0012'],
      ['desarrollosocial','desarrollosocial','seremi123','seremi','desarrollosocial','Patricia Muñoz','Sra.','pmunoz@mdsf.gob.cl','+56 9 1111 0013'],
      ['justicia','justicia','seremi123','seremi','justicia','Nelson Tapia','Abg.','ntapia@minjusticia.cl','+56 9 1111 0014'],
      ['interior','interior','seremi123','seremi','interior','Mauricio Flores','Sr.','mflores@interior.gob.cl','+56 9 1111 0015'],
      ['cultura','cultura','seremi123','seremi','cultura','Isabel Contreras','Sra.','icontreras@cultura.gob.cl','+56 9 1111 0016'],
      ['ciencia','ciencia','seremi123','seremi','ciencia','Andrés Bravo','Dr.','abravo@minciencia.gob.cl','+56 9 1111 0017'],
      ['deporte','deporte','seremi123','seremi','deporte','Lucas Herrera','Prof.','lherrera@ind.cl','+56 9 1111 0018'],
      ['mujer','mujer','seremi123','seremi','mujer','Andrea Castro','Sra.','acastro@sernameg.gob.cl','+56 9 1111 0019'],
    ]);
  }

  /* ── Seed Proyectos ─────────────────────────────────────── */

  if (count('proyectos') === 0) {
    const ins = db.prepare(
      'INSERT INTO `proyectos` (`seremiId`,`title`,`meta`,`estado`,`presupuesto`,`descripcion`,`comunas`) VALUES (?,?,?,?,?,?,?)'
    );
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
    tx([
      ['salud','Plan Salud Mental Post-Pandemia','Ago. 2025','En ejecución','','',''],
      ['salud','Red Urgencias Rurales Maule Sur','Dic. 2025','Licitación','','',''],
      ['salud','Vacunación Bivalente Adulto Mayor','Continuo','Activo','','',''],
      ['educacion','Inclusión Digital Escolar','Jun. 2025','En ejecución','','',''],
      ['educacion','Mejoramiento 12 Escuelas','Nov. 2025','En ejecución','','',''],
      ['obras','Pavimentación Ruta M-60','Jun. 2025','Licitación','','',''],
      ['obras','Plan Borde Costero Constitución','Dic. 2025','Diseño','','',''],
      ['agricultura','Apoyo Pequeños Agricultores Sequía','Jun. 2025','Activo','','',''],
      ['agricultura','Reconversión Fruticultura Secano','Dic. 2025','Formulación','','',''],
      ['vivienda','DS49 — Condominios Sociales Talca','Dic. 2025','Construcción','','',''],
      ['transporte','Plan Movilidad Urbana Talca','Jun. 2025','Diseño','','',''],
      ['bienes','Catastro Propiedades Fiscales Costeras','Sep. 2025','En ejecución','','',''],
      ['trabajo','Programa +Capaz Mujeres Maule','Jun. 2025','Activo','','',''],
      ['medioambiente','Plan Descontaminación Talca-Maule','Dic. 2025','En ejecución','','',''],
      ['energia','Techos Solares Viviendas Sociales','Sep. 2025','Licitación','','',''],
      ['economia','Fondo Apoyo PYMES Post-Sequía','Jun. 2025','Activo','','',''],
      ['mineria','Registro Faenas Mineras Artesanales','Sep. 2025','En ejecución','','',''],
      ['desarrollosocial','Actualización RSH Masiva','Jun. 2025','Activo','','',''],
      ['desarrollosocial','Programa Calle Maule','Continuo','Activo','','',''],
      ['justicia','Defensoría Penal Licitación','Jun. 2025','Licitación','','',''],
      ['justicia','Plan Reinserción Social','Dic. 2025','Diseño','','',''],
      ['interior','Programa Seguridad Barrios Críticos','Sep. 2025','En ejecución','','',''],
      ['cultura','Red Bibliotecas Rurales','Jun. 2025','Activo','','',''],
      ['ciencia','Laboratorio Regional I+D','Dic. 2025','Formulación','','',''],
      ['deporte','Centros Deportivos Integrales','Sep. 2025','Construcción','','',''],
      ['mujer','Programa Autonomía Económica','Jun. 2025','Activo','','',''],
    ]);
  }

  /* ── Seed Nudos ─────────────────────────────────────────── */

  if (count('nudos') === 0) {
    const ins = db.prepare(
      'INSERT INTO `nudos` (`seremiId`,`title`,`desc`,`urgencia`,`solucion`) VALUES (?,?,?,?,?)'
    );
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
    tx([
      ['salud','Déficit de médicos especialistas','Faltan 18 especialistas. Concursos desiertos por 3 períodos.','Alta',''],
      ['salud','Lista de espera GES crítica','Tiempo promedio oncología supera 120 días.','Alta',''],
      ['educacion','Baja matrícula comunas rurales','Riesgo cierre 4 escuelas.','Alta',''],
      ['educacion','Déficit docente Matemáticas','Concursos sin postulantes.','Media',''],
      ['obras','Retraso licitación por impugnaciones','Obras Ruta M-46. Retraso 4 meses.','Media',''],
      ['agricultura','Crisis hídrica secano costero','Déficit hídrico severo en 3 comunas.','Alta',''],
      ['agricultura','Merma productiva cereales','Pérdidas del 30-45% en trigo y maíz.','Alta',''],
      ['vivienda','Listas de espera DS49 críticas','4.200 familias en lista. Sin nuevos llamados.','Alta',''],
      ['transporte','Déficit cobertura rural','12 recorridos suspendidos.','Media',''],
      ['bienes','Ocupación ilegal en playas','Aumento en temporada estival.','Media',''],
      ['trabajo','Alta informalidad laboral temporero','38% sin contrato.','Alta',''],
      ['trabajo','Accidentes laborales agroindustria','Aumento del 18%.','Media',''],
      ['medioambiente','Superación normas PM2.5','Talca y Curicó superan norma en invierno.','Alta',''],
      ['medioambiente','Contaminación hídrica río Loncomilla','Efluentes sin tratamiento.','Media',''],
      ['energia','Cortes reiterados comunas rurales','Parral y Retiro con más de 12 cortes graves.','Alta',''],
      ['economia','Baja adopción créditos FOGAPE','Solo 23% de PYMES elegibles accedió.','Media',''],
      ['mineria','Informalidad minería artesanal','45 faenas informales sin registro.','Alta',''],
      ['desarrollosocial','Rezago RSH comunas rurales','12 municipios bajo 40% actualizados.','Alta',''],
      ['desarrollosocial','Aumento personas en calle','Incremento 22% respecto a 2023.','Alta',''],
      ['justicia','Hacinamiento CRS Talca','150% de sobrepoblación penal.','Alta',''],
      ['interior','Aumento delitos en Talca centro','Incremento 25% en últimos 6 meses.','Alta',''],
      ['cultura','Espacios culturales deteriorados','3 centros culturales requieren reparación.','Media',''],
      ['ciencia','Fuga de capital humano','Investigadores migran a Santiago.','Alta',''],
      ['deporte','Infraestructura deportiva insuficiente','Comunas rurales sin canchas.','Media',''],
      ['mujer','Aumento violencia intrafamiliar','15% más denuncias.','Alta',''],
    ]);
  }

  /* ── Seed Temas ─────────────────────────────────────────── */

  if (count('temas') === 0) {
    const ins = db.prepare(
      'INSERT INTO `temas` (`seremiId`,`tema`,`ambito`,`prioridad`,`descripcion`) VALUES (?,?,?,?,?)'
    );
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
    tx([
      ['salud','Salud mental rural','','Alta',''],
      ['salud','Telemedicina en comunas alejadas','','Media',''],
      ['educacion','Educación técnica dual','','Alta',''],
      ['educacion','Conectividad escolar rural','','Alta',''],
      ['obras','Conectividad vial costera','','Alta',''],
      ['agricultura','Seguro agrícola y cambio climático','','Alta',''],
      ['agricultura','Riego eficiente para pequeños productores','','Media',''],
      ['vivienda','Vivienda social en zonas de riesgo','','Alta',''],
      ['transporte','Electromovilidad en flotas regionales','','Media',''],
      ['bienes','Playas de uso público','','Normal',''],
      ['trabajo','Brecha salarial género agroindustria','','Alta',''],
      ['medioambiente','Calefacción alternativa y fogones','','Alta',''],
      ['energia','Energías renovables para agricultores','','Alta',''],
      ['economia','Turismo rural como motor económico','','Media',''],
      ['mineria','Formalización minería artesanal','','Alta',''],
      ['desarrollosocial','Pobreza rural multidimensional','','Alta',''],
      ['desarrollosocial','Adultos mayores vulnerables solos','','Alta',''],
      ['justicia','Reinserción social laboral','','Alta',''],
      ['interior','Prevención comunitaria del delito','','Alta',''],
      ['cultura','Identidad cultural maulina','','Media',''],
      ['ciencia','Transferencia tecnológica agrícola','','Alta',''],
      ['deporte','Deporte inclusivo rural','','Media',''],
      ['mujer','Autonomía económica mujeres rurales','','Alta',''],
    ]);
  }

  /* ── Seed Agenda ────────────────────────────────────────── */

  if (count('agenda') === 0) {
    const ins = db.prepare(
      'INSERT INTO `agenda` (`seremiId`,`fecha`,`texto`,`cat`,`lugar`,`notas`) VALUES (?,?,?,?,?,?)'
    );
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
    tx([
      ['salud','2026-03-15','Lanzamiento Centro Salud Mental','Inauguración','Talca',''],
      ['salud','2026-04-10','Campaña vacunación invierno','Campaña','',''],
      ['educacion','2026-03-03','Inicio año escolar — operativo matrícula tardía','Operativo','',''],
      ['educacion','2026-05-20','Feria vocacional EMTP','Evento','Curicó',''],
      ['obras','2026-04-01','Inicio obras pavimentación M-60','Inicio Obras','',''],
      ['obras','2026-06-15','Inauguración paso bajo nivel Linares','Inauguración','Linares',''],
      ['agricultura','2026-03-20','Entrega kits de riego INDAP','Entrega','',''],
      ['agricultura','2026-05-15','Feria Agrícola Regional','Evento','Talca',''],
      ['vivienda','2026-04-10','Entrega 80 viviendas DS49','Entrega Viviendas','Curicó',''],
      ['transporte','2026-06-01','Licitación transporte público Talca','Licitación','Talca',''],
      ['bienes','2026-05-10','Entrega escrituras Comunidades Pehuenche','Entrega Títulos','',''],
      ['trabajo','2026-03-10','Operativo fiscalización packing Curicó','Fiscalización','Curicó',''],
      ['trabajo','2026-06-20','Graduación +Capaz','Ceremonia','Talca',''],
      ['medioambiente','2026-04-01','Inicio restricción vehicular Talca','Regulación','Talca',''],
      ['medioambiente','2026-06-01','Campaña recambio calefactores','Campaña','',''],
      ['energia','2026-05-15','Lanzamiento techos solares, 200 familias','Lanzamiento','',''],
      ['economia','2026-04-20','Rueda de negocios PYMES Maule','Evento','',''],
      ['mineria','2026-06-15','Operativo fiscalización faenas artesanales','Fiscalización','',''],
      ['desarrollosocial','2026-03-10','Operativo actualización RSH — 6 comunas','Operativo','',''],
      ['desarrollosocial','2026-06-30','Entrega resultados Casen 2024 región','Presentación','',''],
      ['justicia','2026-04-15','Inauguración oficina Defensoría Penal','Inauguración','',''],
      ['interior','2026-03-25','Operativo seguridad barrios críticos','Operativo','',''],
      ['cultura','2026-05-20','Festival Cultural del Maule','Evento','',''],
      ['ciencia','2026-06-10','Simposio regional de investigación','Evento','',''],
      ['deporte','2026-04-05','Inauguración centro deportivo Linares','Inauguración','Linares',''],
      ['mujer','2026-03-08','Conmemoración Día Internacional de la Mujer','Conmemoración','',''],
    ]);
  }

  /* ── Seed Prensa ────────────────────────────────────────── */

  if (count('prensa') === 0) {
    const ins = db.prepare(
      'INSERT INTO `prensa` (`seremiId`,`titular`,`medio`,`fecha`,`tipoMedio`,`tono`,`url`,`resumen`) VALUES (?,?,?,?,?,?,?,?)'
    );
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
    tx([
      ['salud','SEREMI Salud anuncia nuevo CESFAM en Curepto','El Centro','2026-02-05','','pos','',''],
      ['salud','Alertan por aumento de casos respiratorios','La Prensa Austral','2026-01-28','','neu','',''],
      ['educacion','Nuevo equipamiento tecnológico para 40 escuelas rurales','Maule Noticias','2026-02-12','','pos','',''],
      ['educacion','Critican burocracia en subvenciones','El Radar','2026-01-30','','neg','',''],
      ['obras','MOP acelera trabajos en rutas afectadas por lluvias','La Prensa Austral','2026-02-01','','pos','',''],
      ['agricultura','Gobierno entrega bonos de emergencia a agricultores','AgriMaule','2026-02-10','','pos','',''],
      ['agricultura','Pequeños productores denuncian trabas INDAP','El Centro','2026-01-27','','neg','',''],
      ['vivienda','SEREMI Vivienda anuncia 200 soluciones habitacionales','Maule Noticias','2026-02-08','','pos','',''],
      ['transporte','Se estudia nuevo corredor de transporte en Talca','El Centro','2026-01-29','','neu','',''],
      ['bienes','Bienes Nacionales inicia catastro litoral del Maule','El Radar','2026-01-25','','neu','',''],
      ['trabajo','SEREMI Trabajo intensifica fiscalizaciones en temporada agrícola','La Prensa Austral','2026-02-15','','pos','',''],
      ['trabajo','Denuncian incumplimientos laborales en packing','Maule Noticias','2026-01-26','','neg','',''],
      ['medioambiente','SEREMI Medio Ambiente alerta por contaminación en invierno','El Centro','2026-02-10','','neg','',''],
      ['medioambiente','Plan de descontaminación avanza','Maule Noticias','2026-01-29','','pos','',''],
      ['energia','Gobierno avanza en paneles solares en viviendas del Maule','AgriMaule','2026-02-08','','pos','',''],
      ['energia','Vecinos de Parral denuncian cortes de luz reiterados','La Prensa Austral','2026-01-28','','neg','',''],
      ['economia','SEREMI Economía presenta plan de reactivación PYMES','Maule Noticias','2026-02-05','','pos','',''],
      ['mineria','SEREMI Minería llama a regularizar faenas en el Maule','El Radar','2026-01-27','','neu','',''],
      ['desarrollosocial','SEREMI Desarrollo Social presenta programa para familias vulnerables','El Centro','2026-02-12','','pos','',''],
      ['desarrollosocial','Reportan aumento de personas en situación de calle en Talca','Maule Noticias','2026-02-01','','neg','',''],
      ['justicia','Justicia refuerza defensoría penal en el Maule','El Centro','2026-02-06','','pos','',''],
      ['interior','Interior lanza plan de seguridad para Talca','Maule Noticias','2026-02-14','','pos','',''],
      ['cultura','Festival cultural del Maule anuncia programa 2026','El Radar','2026-02-03','','pos','',''],
      ['ciencia','Maule busca atraer investigadores con nuevo laboratorio','Maule Noticias','2026-02-09','','pos','',''],
      ['deporte','Inauguran centro deportivo en Linares','La Prensa Austral','2026-02-11','','pos','',''],
      ['mujer','SEREMI Mujer lanza programa de autonomía económica','El Centro','2026-02-07','','pos','',''],
    ]);
  }

  /* ── Seed Visitas ───────────────────────────────────────── */

  if (count('visitas') === 0) {
    const ins = db.prepare(
      'INSERT INTO `visitas` (`seremiId`,`fecha`,`comuna`,`lugar`,`personas`,`descripcion`) VALUES (?,?,?,?,?,?)'
    );
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
    tx([
      // salud — 8 visitas
      ['salud','2026-01-07','Talca','Hospital Regional','8','Reunión con autoridades locales'],
      ['salud','2026-01-14','Curicó','CESFAM Curicó','6','Supervisión atención primaria'],
      ['salud','2026-01-21','Linares','Hospital Linares','7','Revisión lista de espera GES'],
      ['salud','2026-01-28','Molina','Posta Molina','5','Visita terreno infraestructura sanitaria'],
      ['salud','2026-02-04','Cauquenes','CESFAM Cauquenes','6','Evaluación programa salud mental'],
      ['salud','2026-02-11','Talca','SEREMI Salud','8','Coordinación campaña vacunación'],
      ['salud','2026-02-18','Curicó','Centro Comunitario','7','Operativo salud preventiva'],
      ['salud','2026-02-25','Linares','Consultorio Linares','5','Reunión equipo epidemiológico'],
      // educacion — 11 visitas
      ['educacion','2026-01-06','Talca','Liceo Abate Molina','6','Revisión infraestructura escolar'],
      ['educacion','2026-01-10','Curicó','Escuela Básica Curicó','5','Entrega equipamiento tecnológico'],
      ['educacion','2026-01-15','Linares','Liceo Linares','7','Reunión con directores'],
      ['educacion','2026-01-20','Parral','Escuela Rural Parral','4','Visita terreno escuela rural'],
      ['educacion','2026-01-24','San Clemente','Escuela San Clemente','5','Evaluación matrícula rural'],
      ['educacion','2026-01-29','Talca','DEPROV Talca','8','Coordinación inicio año escolar'],
      ['educacion','2026-02-03','Curicó','Liceo Técnico Curicó','6','Supervisión programa EMTP'],
      ['educacion','2026-02-07','Linares','Escuela Básica Linares','5','Revisión programa inclusión digital'],
      ['educacion','2026-02-12','Parral','Escuela Rural El Carmen','4','Diagnóstico conectividad escolar'],
      ['educacion','2026-02-17','San Clemente','Escuela Rural San Clemente','5','Evaluación docente rural'],
      ['educacion','2026-02-21','Talca','SEREMI Educación','9','Reunión planificación semestral'],
      // obras — 6 visitas
      ['obras','2026-01-08','Talca','Oficina MOP','7','Revisión avance proyectos viales'],
      ['obras','2026-01-18','Linares','Ruta M-60','5','Inspección terreno pavimentación'],
      ['obras','2026-01-28','Constitución','Borde costero','6','Evaluación plan borde costero'],
      ['obras','2026-02-05','Retiro','Puente Río Claro','4','Supervisión obras puente'],
      ['obras','2026-02-14','Colbún','Camino rural Colbún','5','Visita terreno camino secundario'],
      ['obras','2026-02-22','Talca','MOP Regional','8','Reunión coordinación licitaciones'],
      // agricultura — 9 visitas
      ['agricultura','2026-01-06','Talca','SEREMI Agricultura','7','Coordinación plan sequía'],
      ['agricultura','2026-01-12','San Javier','Cooperativa agrícola','5','Reunión con pequeños agricultores'],
      ['agricultura','2026-01-18','Constitución','Zona secano','6','Visita terreno sequía costera'],
      ['agricultura','2026-01-24','Maule','Parcelas INDAP','4','Evaluación programa riego'],
      ['agricultura','2026-01-30','Curepto','Zona rural Curepto','5','Diagnóstico daño hídrico'],
      ['agricultura','2026-02-05','Talca','Feria agrícola','10','Reunión con gremios agrícolas'],
      ['agricultura','2026-02-12','San Javier','Viñedos San Javier','6','Supervisión reconversión frutícola'],
      ['agricultura','2026-02-19','Constitución','Comunidad rural','5','Entrega bonos de emergencia'],
      ['agricultura','2026-02-26','Maule','Centro acopio','8','Coordinación logística semillas'],
      // vivienda — 5 visitas
      ['vivienda','2026-01-10','Talca','Condominio DS49','7','Supervisión obras vivienda social'],
      ['vivienda','2026-01-22','Curicó','Proyecto habitacional','6','Revisión avance construcción'],
      ['vivienda','2026-02-03','Linares','Terreno fiscal','5','Evaluación terreno para viviendas'],
      ['vivienda','2026-02-14','Maule','Villa nueva Maule','8','Entrega viviendas familias'],
      ['vivienda','2026-02-25','Talca','SEREMI Vivienda','6','Reunión planificación DS19'],
      // transporte — 4 visitas
      ['transporte','2026-01-12','Talca','Terminal buses','6','Evaluación transporte público'],
      ['transporte','2026-01-26','Curicó','Estación intermodal','5','Revisión infraestructura vial'],
      ['transporte','2026-02-09','Linares','Paraderos rurales','4','Diagnóstico cobertura rural'],
      ['transporte','2026-02-23','Talca','SEREMI Transporte','7','Reunión plan movilidad urbana'],
      // bienes — 3 visitas
      ['bienes','2026-01-15','Talca','Oficina Bienes Nacionales','5','Coordinación catastro fiscal'],
      ['bienes','2026-02-01','San Javier','Propiedad fiscal','6','Inspección terreno fiscal costero'],
      ['bienes','2026-02-18','Constitución','Playa pública','8','Fiscalización uso playa pública'],
      // trabajo — 7 visitas
      ['trabajo','2026-01-08','Talca','Inspección del Trabajo','6','Reunión equipo fiscalización'],
      ['trabajo','2026-01-15','Curicó','Packing agrícola','5','Fiscalización condiciones laborales'],
      ['trabajo','2026-01-22','Linares','Zona agroindustrial','7','Operativo fiscalización temporeros'],
      ['trabajo','2026-01-29','Parral','Empresa forestal','4','Inspección seguridad laboral'],
      ['trabajo','2026-02-05','Talca','Centro +Capaz','8','Supervisión programa +Capaz'],
      ['trabajo','2026-02-14','Curicó','Planta procesadora','6','Fiscalización cumplimiento laboral'],
      ['trabajo','2026-02-22','Linares','OMIL Linares','5','Coordinación empleo local'],
      // medioambiente — 5 visitas
      ['medioambiente','2026-01-10','Talca','Estación monitoreo','7','Revisión datos calidad del aire'],
      ['medioambiente','2026-01-24','Constitución','Río Maule','5','Inspección calidad hídrica'],
      ['medioambiente','2026-02-05','Empedrado','Zona rural','4','Evaluación impacto ambiental'],
      ['medioambiente','2026-02-15','San Javier','Río Loncomilla','6','Fiscalización efluentes industriales'],
      ['medioambiente','2026-02-26','Talca','SEREMI Medio Ambiente','8','Reunión plan descontaminación'],
      // energia — 4 visitas
      ['energia','2026-01-12','Talca','Oficina SEREMI Energía','6','Coordinación techos solares'],
      ['energia','2026-01-28','Linares','Zona rural Linares','5','Diagnóstico cortes eléctricos'],
      ['energia','2026-02-10','Parral','Subestación eléctrica','4','Inspección infraestructura eléctrica'],
      ['energia','2026-02-24','Curicó','Proyecto solar','7','Visita terreno energía renovable'],
      // economia — 6 visitas
      ['economia','2026-01-08','Talca','Cámara Comercio','8','Reunión gremios PYMES'],
      ['economia','2026-01-18','Curicó','Feria PYMES','6','Supervisión fondo FOGAPE'],
      ['economia','2026-01-28','Linares','Centro empresarial','5','Diagnóstico económico local'],
      ['economia','2026-02-06','Constitución','Zona comercial','4','Evaluación reactivación comercio'],
      ['economia','2026-02-16','Talca','SERCOTEC','7','Coordinación apoyo PYMES'],
      ['economia','2026-02-25','Curicó','Mercado municipal','6','Reunión con comerciantes locales'],
      // mineria — 2 visitas
      ['mineria','2026-01-20','Talca','SEREMI Minería','5','Revisión registro faenas'],
      ['mineria','2026-02-12','Linares','Faena artesanal','4','Fiscalización minería artesanal'],
      // desarrollosocial — 10 visitas
      ['desarrollosocial','2026-01-06','Talca','Oficina RSH','7','Operativo actualización RSH'],
      ['desarrollosocial','2026-01-12','Curicó','Municipalidad','6','Coordinación RSH comunal'],
      ['desarrollosocial','2026-01-18','Linares','Centro comunitario','5','Atención familias vulnerables'],
      ['desarrollosocial','2026-01-24','Parral','DIDECO Parral','4','Diagnóstico pobreza rural'],
      ['desarrollosocial','2026-01-30','Cauquenes','Municipalidad','6','Evaluación programa Calle'],
      ['desarrollosocial','2026-02-04','Molina','Centro social','5','Operativo RSH Molina'],
      ['desarrollosocial','2026-02-10','Talca','Albergue municipal','8','Supervisión programa personas en calle'],
      ['desarrollosocial','2026-02-15','Curicó','Oficina social','7','Reunión equipo territorial'],
      ['desarrollosocial','2026-02-20','Linares','Sede vecinal','5','Operativo social Linares'],
      ['desarrollosocial','2026-02-26','Parral','Centro comunitario','6','Entrega resultados Casen comunal'],
      // justicia — 4 visitas
      ['justicia','2026-01-14','Talca','CRS Talca','6','Inspección centro penitenciario'],
      ['justicia','2026-01-28','Linares','Tribunal Linares','5','Reunión con autoridades judiciales'],
      ['justicia','2026-02-10','Curicó','Defensoría Penal','4','Evaluación defensoría penal'],
      ['justicia','2026-02-24','Talca','SEREMI Justicia','7','Coordinación plan reinserción'],
      // interior — 5 visitas
      ['interior','2026-01-10','Talca','Gobernación','8','Reunión seguridad pública'],
      ['interior','2026-01-22','Curicó','Comisaría Curicó','6','Coordinación plan barrios'],
      ['interior','2026-02-03','Linares','Municipalidad','5','Evaluación seguridad comunal'],
      ['interior','2026-02-14','Talca','Barrio crítico','7','Operativo seguridad barrial'],
      ['interior','2026-02-25','Curicó','Centro comunitario','6','Reunión prevención del delito'],
      // cultura — 4 visitas
      ['cultura','2026-01-12','Talca','Centro cultural','6','Evaluación infraestructura cultural'],
      ['cultura','2026-01-26','Constitución','Biblioteca pública','5','Visita red bibliotecas rurales'],
      ['cultura','2026-02-09','Linares','Casa de la cultura','4','Diagnóstico espacios culturales'],
      ['cultura','2026-02-23','Talca','SEREMI Cultura','7','Planificación festival cultural'],
      // ciencia — 3 visitas
      ['ciencia','2026-01-16','Talca','Universidad de Talca','6','Reunión investigadores regionales'],
      ['ciencia','2026-02-06','Curicó','Centro I+D','5','Evaluación laboratorio regional'],
      ['ciencia','2026-02-20','Talca','SEREMI Ciencia','7','Coordinación transferencia tecnológica'],
      // deporte — 5 visitas
      ['deporte','2026-01-10','Talca','Estadio fiscal','6','Inspección infraestructura deportiva'],
      ['deporte','2026-01-22','Linares','Polideportivo','5','Evaluación centro deportivo'],
      ['deporte','2026-02-03','Curicó','Gimnasio municipal','4','Visita terreno proyecto deportivo'],
      ['deporte','2026-02-14','Parral','Cancha municipal','5','Diagnóstico infraestructura rural'],
      ['deporte','2026-02-25','Talca','IND Regional','8','Reunión planificación deportiva'],
      // mujer — 6 visitas
      ['mujer','2026-01-08','Talca','Centro de la Mujer','7','Coordinación programa autonomía'],
      ['mujer','2026-01-18','Curicó','Oficina SernamEG','5','Evaluación atención VIF'],
      ['mujer','2026-01-28','Linares','Casa acogida','6','Supervisión casa de acogida'],
      ['mujer','2026-02-07','Cauquenes','Municipalidad','4','Operativo atención mujeres rurales'],
      ['mujer','2026-02-17','Talca','SEREMI Mujer','8','Reunión equipo regional'],
      ['mujer','2026-02-27','Curicó','Centro comunitario','6','Taller autonomía económica'],
    ]);
  }

  /* ── Seed Contrataciones ────────────────────────────────── */

  if (count('contrataciones') === 0) {
    const ins = db.prepare(
      'INSERT INTO `contrataciones` (`seremiId`,`nombre`,`rut`,`cargo`,`grado`,`tipo`,`inicio`,`termino`,`monto`,`financ`,`just`,`estado`,`vbQuien`,`vbFecha`,`creadoPor`,`creadoEn`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
    tx([
      ['salud','María José Contreras','15.234.567-8','Profesional Sectorial','Grado 10','Honorarios','2026-03-01','2026-12-31','1850000','Presupuesto SEREMI','Refuerzo equipo epidemiológico para campaña invierno regional.','Pendiente','','','salud','2026-02-18'],
      ['educacion','Carlos Fuentes Riquelme','12.876.543-2','Analista de Datos','Grado 12','Contrata','2026-03-15','2026-12-31','1450000','Programa sectorial','Apoyo al Sistema de Información Escolar regional (SIGE).','Aprobada','Administrador Regional','2026-02-17','educacion','2026-02-10'],
      ['obras','Sofía Espinoza Vera','16.123.456-7','Ingeniero Vial','Grado 9','Honorarios','2026-04-01','2026-10-31','2100000','Transferencia GORE','Supervisión obras puente Río Claro sector Talca.','Aprobada','Administrador Regional','2026-02-20','obras','2026-02-14'],
      ['vivienda','Lorena Tapia Muñoz','14.987.654-3','Arquitecta Revisora','Grado 8','Contrata','2026-03-01','2027-02-28','1720000','Presupuesto SEREMI','Revisión permisos y proyectos DS19 para sector rural.','Pendiente','','','vivienda','2026-02-21'],
      ['medioambiente','Rodrigo Castro Ibáñez','17.345.678-4','Inspector Ambiental','Grado 11','Honorarios','2026-03-15','2026-09-15','1350000','Presupuesto SEREMI','Fiscalización norma SO2 cuenca Río Maule.','Pendiente','','','medioambiente','2026-02-22'],
      ['agricultura','Camila Rojas Figueroa','13.654.321-K','Técnico Agrícola','Nivel 2','Honorarios','2026-03-01','2026-06-30','980000','Programa sectorial','Apoyo programa emergencia hídrica zona secana interior.','Aprobada','Administrador Regional','2026-02-19','agricultura','2026-02-12'],
    ]);
  }

  return db;
}

module.exports = { initDB };
