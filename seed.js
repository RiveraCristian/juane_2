/**
 * seed.js — Poblar tablas nuevas con datos de ejemplo
 * Ejecutar: node seed.js
 */
const { initDB } = require('./database');
const db = initDB();

// ── Helpers ──────────────────────────────────────────────────────────────────
const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM \`${t}\``).get().n;
const seremis = db.prepare('SELECT id FROM seremis').all().map(r => r.id);

console.log(`\n📦 SEREMIS encontradas: ${seremis.join(', ')}\n`);

// ═════════════════════════════════════════════════════════════════════════════
//  CONTACTOS
// ═════════════════════════════════════════════════════════════════════════════
if (count('contactos') === 0) {
  const ins = db.prepare(`
    INSERT INTO contactos (seremiId, nombre, fecha, lugar, personas, tipo, instituciones, descripcion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });

  tx([
    // salud
    ['salud','Mesa Interministerial Salud','2026-01-10','Talca Centro', 45,'Reunión','Municipalidades Maule','Coordinación plan invierno y epidemiología regional'],
    ['salud','Lanzamiento Campaña IST','2026-01-22','CESFAM Curicó', 60,'Evento','MINSAL, Municipalidad Curicó','Campaña IST con foco en jóvenes y adultos mayores'],
    ['salud','Taller Salud Mental Rural','2026-02-04','Linares', 28,'Taller','OPS, Psicólogos comunitarios','Refuerzo red de salud mental comunas rurales Maule Sur'],
    ['salud','Operativo Vacunación Pehuenche','2026-02-18','San Javier', 120,'Evento','CONADI, Municipalidad San Javier','Vacunación en comunidades indígenas del secano'],
    // educacion
    ['educacion','Consejo Regional de Educación','2026-01-09','Talca', 32,'Reunión','DEP, DEPROV Maule','Planificación semestral matrícula y EMTP'],
    ['educacion','Feria Vocacional EMTP Curicó','2026-01-28','Curicó', 380,'Evento','Liceos técnicos, Empresas regionales','Orientación vocacional para estudiantes de 4° medio'],
    ['educacion','Entrega Tablets Escuelas Rurales','2026-02-10','Parral', 90,'Evento','STIC MINEDUC','Entrega 150 tablets digitales a 8 escuelas rurales'],
    ['educacion','Reunión Directores Rurales','2026-02-23','San Clemente', 24,'Reunión','DEPROV delegados','Análisis baja matrícula comunas precordillera'],
    // obras
    ['obras','Reunión Mesa Vialidad','2026-01-15','Talca', 18,'Reunión','MOP, GORE, Municipalidades','Priorización proyectos viales 2026 región'],
    ['obras','Inauguración Puente Caminero','2026-01-30','Retiro', 250,'Evento','MOP central, municipios afectados','Inauguración puente sobre Río Claro sector Retiro'],
    ['obras','Jornada Técnica Infraestructura','2026-02-14','Linares', 40,'Taller','Ingenieros MOP región','Revisión técnica obras en etapa de ejecución'],
    // agricultura
    ['agricultura','Mesa Sequía Zona Secana','2026-01-08','Constitución', 35,'Reunión','INDAP, CNR, Municipios costeros','Plan de acción para déficit hídrico severo'],
    ['agricultura','Entrega Bonos Emergencia Sequía','2026-01-25','San Javier', 180,'Evento','INDAP, GORE','Entrega beneficios a 180 agricultores afectados'],
    ['agricultura','Feria Agrícola Regional Maule','2026-02-08','Talca', 600,'Evento','Gremios agrícolas, MINAGRI','Muestra de innovación tecnológica en el agro regional'],
    ['agricultura','Taller Riego Eficiente','2026-02-22','Cauquenes', 55,'Taller','CNR, Técnicos agricultores','Capacitación riego por goteo para pequeños productores'],
    // vivienda
    ['vivienda','Entrega 80 Viviendas DS49','2026-01-18','Curicó', 400,'Evento','MINVU central, familias beneficiarias','Entrega viviendas sociales programa DS49 Curicó'],
    ['vivienda','Catastro Social Familias Campamento','2026-02-06','Talca', 22,'Reunión','IEF, Municipalidad Talca','Diagnóstico 3 campamentos para solución habitacional'],
    ['vivienda','Reunión Constructoras Regionales','2026-02-20','Talca', 30,'Reunión','Cámara Chilena de la Construcción','Coordinación licitaciones DS19 y DS49 2026'],
    // transporte
    ['transporte','Licitación Transporte Público Talca','2026-01-14','Talca', 22,'Reunión','Empresas transporte, MTT','Apertura proceso licitación corredor Talca'],
    ['transporte','Jornada Electromovilidad','2026-02-03','Curicó', 65,'Capacitación','ANAC, Ministerio Energía','Capacitación operadores transporte en electromovilidad'],
    ['transporte','Mesa Rural Conectividad','2026-02-18','Parral', 18,'Reunión','Municipios, GPS','Análisis recorridos suspendidos 12 comunas rurales'],
    // bienes
    ['bienes','Entrega Títulos Comunidad Pehuenche','2026-01-20','Pelarco', 85,'Evento','CONADI, Bienes Nacionales central','Regularización propiedad 85 familias comunidad indígena'],
    ['bienes','Fiscalización Playas Temporada Estival','2026-02-14','Constitución', 12,'Reunión','Armada de Chile, Carabineros','Coordinación acceso y seguridad playas públicas'],
    // trabajo
    ['trabajo','Operativo +Capaz Mujeres','2026-01-12','Talca', 90,'Evento','SENCE, OMIL comunales','Inicio capacitación laboral 90 mujeres jefa de hogar'],
    ['trabajo','Mesa Accidentes Laborales Agroindustria','2026-01-27','Linares', 25,'Reunión','Mutuales, empresas agroindustria','Plan de acción accidentabilidad temporada agrícola'],
    ['trabajo','Fiscalización Masiva Packign Curicó','2026-02-11','Curicó', 14,'Reunión','Inspectores del Trabajo, FOSIS','Evaluación resultados fiscalización 45 packings'],
    ['trabajo','Graduación Mujeres +Capaz','2026-02-25','Talca', 210,'Evento','SENCE, empresas empleadoras','Ceremonia graduación programa +Capaz primera cohorte 2026'],
    // medioambiente
    ['medioambiente','Mesa Plan Descontaminación','2026-01-13','Talca', 28,'Reunión','MMA central, Municipios Talca-Maule','Revisión avance plan descontaminación atmosférica'],
    ['medioambiente','Campaña Recambio Calefactores','2026-02-02','Curicó', 350,'Evento','MMA, SEREMI Vivienda','Operativo recambio 150 calefactores contaminantes'],
    ['medioambiente','Jornada Monitoreo Hídrico','2026-02-16','San Javier', 20,'Taller','DARH, equipos técnicos','Capacitación monitoreo calidad agua río Loncomilla'],
    // energia
    ['energia','Lanzamiento Techos Solares','2026-01-16','Talca', 300,'Evento','MINENERGIA, familias beneficiarias','Lanzamiento instalación 200 sistemas fotovoltaicos'],
    ['energia','Mesa Cortes Rurales','2026-01-30','Parral', 20,'Reunión','Distribuidoras eléctricas, CNSE','Plan de acción cortes reiterados comunas rurales'],
    ['energia','Taller Eficiencia Energética','2026-02-13','Linares', 45,'Capacitación','Agencia SE, técnicos municipales','Capacitación en eficiencia energética municipal'],
    // economia
    ['economia','Rueda de Negocios PYMES','2026-01-14','Talca', 180,'Evento','CORFO, SERCOTEC, empresas','Rueda de negocios con 60 PYMES regionales y compradores'],
    ['economia','Mesa FOGAPE Maule','2026-01-29','Curicó', 22,'Reunión','Bancos, FOGAPE, PYMES','Evaluación baja adopción créditos FOGAPE zona rural'],
    ['economia','Seminario Turismo Rural','2026-02-18','Constitución', 75,'Evento','SERNATUR, Municipios costeros','Seminario posicionamiento turismo rural litoral maulino'],
    // mineria
    ['mineria','Operativo Formalización Minería','2026-01-22','Linares', 18,'Reunión','SERNAGEOMIN, mineros artesanales','Plan formalización 45 faenas artesanales en la región'],
    ['mineria','Capacitación Seguridad Minera','2026-02-15','Talca', 35,'Capacitación','SERNAGEOMIN, Mutual de Seguridad','Capacitación normas seguridad para pequeña minería'],
    // desarrollosocial
    ['desarrollosocial','Operativo RSH Masivo','2026-01-07','Curicó', 85,'Evento','IEF, Municipalidades','Operativo actualización RSH en 8 comunas simultáneas'],
    ['desarrollosocial','Mesa Personas en Calle','2026-01-21','Talca', 30,'Reunión','MINSAL, MIDESO, Municipios','Coordinación estrategia integral personas en situación de calle'],
    ['desarrollosocial','Entrega Casen 2024 Comunal','2026-02-05','Linares', 55,'Evento','INE, Municipios, GORE','Presentación resultados pobreza regional y análisis comunal'],
    ['desarrollosocial','Taller Pobreza Rural Multidimensional','2026-02-19','Parral', 40,'Taller','Equipos sociales municipales','Análisis resultados y diseño intervenciones rurales'],
    // justicia
    ['justicia','Inauguración Defensoría Penal Rural','2026-01-17','Linares', 120,'Evento','Ministerio de Justicia central','Apertura nueva oficina defensoría penal pública Linares'],
    ['justicia','Mesa Hacinamiento CRS Talca','2026-02-04','Talca', 18,'Reunión','Gendarmería, Ministerio Justicia','Plan de contingencia hacinamiento centro de reclusión'],
    ['justicia','Taller Reinserción Social Laboral','2026-02-25','Talca', 45,'Taller','Empresas, Gendarmería, SENCE','Programa piloto inserción laboral egresados CRS Talca'],
    // interior
    ['interior','Consejo Seguridad Pública Regional','2026-01-11','Talca', 35,'Reunión','FFEE, Fiscalía, municipios','Análisis estadísticas delictivas y plan acción'],
    ['interior','Operativo Barrios Críticos','2026-01-26','Talca', 60,'Evento','Carabineros, PDI, municipios','Inicio operativo seguridad barrios Talca Norte'],
    ['interior','Reunión Prevención Comunitaria','2026-02-09','Curicó', 42,'Reunión','Juntas de vecinos, Carabineros','Lanzamiento red de prevención comunitaria del delito'],
    ['interior','Mesa Migración y Convivencia','2026-02-23','Linares', 28,'Reunión','SERMIG, municipios','Coordinación política local de migración ordenada'],
    // cultura
    ['cultura','Lanzamiento Festival Cultural Maule','2026-01-13','Talca', 200,'Evento','Artistas regionales, GORE','Presentación programación Festival Cultural del Maule 2026'],
    ['cultura','Inauguración Biblioteca Rural','2026-01-27','Constitución', 80,'Evento','DIBAM, Municipalidad','Apertura biblioteca pública en zona costera rural'],
    ['cultura','Red Gestores Culturales Regionales','2026-02-10','Curicó', 45,'Reunión','Directores casas de cultura','Formación red gestores culturales provincia Curicó'],
    // ciencia
    ['ciencia','Simposio Regional I+D','2026-01-15','Talca', 90,'Evento','Universidades, MINCIENCIA','Presentación investigaciones en vinculación con el medio'],
    ['ciencia','Mesa Laboratorio Regional','2026-02-03','Talca', 22,'Reunión','U. de Talca, CONICYT','Avance proyecto laboratorio regional ciencia aplicada'],
    ['ciencia','Taller Transferencia Tecnológica Agrícola','2026-02-21','Curicó', 55,'Taller','INIA, Agricultores, Utalca','Transferencia tecnología en viticultura y fruticultura'],
    // deporte
    ['deporte','Inauguración Centro Deportivo Linares','2026-01-12','Linares', 550,'Evento','IND, Municipalidad Linares','Inauguración polideportivo con 12 disciplinas'],
    ['deporte','Jornada Deporte Inclusivo','2026-01-27','Talca', 80,'Evento','IND, Senadis, clubes','Encuentro deportivo personas con discapacidad región'],
    ['deporte','Mesa Infraestructura Deportiva Rural','2026-02-12','Parral', 20,'Reunión','Municipios, IND','Diagnóstico y priorización mejoras canchas rurales'],
    // mujer
    ['mujer','Conmemoración 8 de Marzo','2026-01-08','Talca', 800,'Evento','SernamEG, organizaciones mujeres','Organización acto regional Día Internacional de la Mujer'],
    ['mujer','Mesa Violencia Intrafamiliar','2026-01-22','Curicó', 25,'Reunión','Carabineros, Fiscalía, Municipios','Plan interinstitucional reducción VIF en la región'],
    ['mujer','Taller Autonomía Económica','2026-02-05','Linares', 65,'Taller','SENCE, FOSIS, INDAP','Capacitación en emprendimiento y empleabilidad mujeres rurales'],
    ['mujer','Feria Emprendimiento Mujeres','2026-02-22','Talca', 300,'Evento','SERCOTEC, SernamEG','Feria comercialización emprendimientos mujeres Maule'],
  ]);
  console.log(`✅ contactos: ${count('contactos')} registros insertados`);
} else {
  console.log(`ℹ️  contactos: ya tiene ${count('contactos')} registros`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  KPI INDICADORES
// ═════════════════════════════════════════════════════════════════════════════
if (count('kpi_indicadores') === 0) {
  const ins = db.prepare(`
    INSERT INTO kpi_indicadores (seremiId, nombre, meta, real, unidad, periodo, descripcion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });

  tx([
    // salud
    ['salud', 'Visitas a terreno realizadas',             24,   22,  'visitas',    '2026-T1', 'Visitas supervisión equipos de salud comunales'],
    ['salud', 'Cobertura vacunación adulto mayor',        95,   87,  '%',          '2026-T1', 'Meta nacional 95% cobertura bivalente AM'],
    ['salud', 'Lista de espera GES reducida',              30,   12,  '%reducción', '2026-T1', 'Reducción tiempo espera oncología'],
    ['salud', 'Nuevos CESFAM habilitados',                  2,    1,  'CESFAM',     '2026',    'Apertura nuevos centros APS rurales'],
    ['salud', 'Personas capacitadas salud mental',        500,  430,  'personas',   '2026-T1', 'Capacitaciones en comunas rurales'],
    // educacion
    ['educacion', 'Escuelas con equipamiento TIC',         40,   38,  'escuelas',   '2026-T1', 'Meta entrega tablets y conectividad'],
    ['educacion', 'Matrícula escolar total',            92000, 91250,  'alumnos',    '2026',    'Meta nacional matrícula escolar Maule'],
    ['educacion', 'Docentes capacitados EMTP',            120,  105,  'docentes',   '2026-T1', 'Programa dual empresa-liceo'],
    ['educacion', 'Escuelas rurales visitadas',            24,   21,  'escuelas',   '2026-T1', 'Visitas supervisión pedagógica'],
    // obras
    ['obras', 'Km de vías pavimentadas',                   35,   22,  'km',         '2026',    'Meta anual pavimentación rutas'],
    ['obras', 'Proyectos en ejecución',                    18,   14,  'proyectos',  '2026-T1', 'Obras viales activas en la región'],
    ['obras', 'Licitaciones publicadas',                    8,    5,  'licitaciones','2026-T1','Meta semestral licitaciones MOP'],
    // agricultura
    ['agricultura', 'Agricultores beneficiados sequía',  800,  762,  'agricultores','2026-T1', 'Bonos emergencia hídrica entregados'],
    ['agricultura', 'Hectáreas con riego tecnificado',   3500, 2890,  'hectáreas',  '2026',    'Meta reconversión riego eficiente'],
    ['agricultura', 'Talleres de capacitación realizados',  16,   14,  'talleres',   '2026-T1', 'Formación técnica agricultores'],
    // vivienda
    ['vivienda', 'Viviendas entregadas DS49',             200,  180,  'viviendas',  '2026',    'Meta anual entrega viviendas sociales'],
    ['vivienda', 'Familias en lista de espera atendidas', 400,  280,  'familias',   '2026-T1', 'Atención lista espera DS49'],
    ['vivienda', 'Permisos de obra revisados',            120,   98,  'permisos',   '2026-T1', 'Revisión técnica proyectos habitacionales'],
    // transporte
    ['transporte', 'Recorridos rurales activos',           68,   56,  'recorridos', '2026-T1', 'Meta cobertura transporte interurbano rural'],
    ['transporte', 'Fiscalizaciones realizadas',           40,   35,  'fiscalizaciones','2026-T1','Control operadores transporte público'],
    // bienes
    ['bienes', 'Títulos de dominio entregados',           150,  142,  'títulos',    '2026-T1', 'Regularización propiedades fiscales'],
    ['bienes', 'Catastro predios costeros',               200,  187,  'predios',    '2026-T1', 'Levantamiento litoral maulino'],
    // trabajo
    ['trabajo', 'Fiscalizaciones laborales',              180,  164,  'fiscalizaciones','2026-T1','Meta inspecciones laborales'],
    ['trabajo', 'Personas capacitadas +Capaz',            300,  290,  'personas',   '2026-T1', 'Mujeres jefa de hogar capacitadas'],
    ['trabajo', 'Empresas sancionadas',                    15,   18,  'empresas',   '2026-T1', 'Multas por incumplimiento laboral'],
    ['trabajo', 'Tasa accidentabilidad reducida',          10,    8,  '%reducción', '2026-T1', 'Meta reducción accidentes laborales'],
    // medioambiente
    ['medioambiente', 'Calefactores recambiados',         500,  380,  'unidades',   '2026-T1', 'Programa recambio calefactores contaminantes'],
    ['medioambiente', 'Días con norma PM2.5 superada',     20,   28,  'días',       '2026-T1', 'Meta reducción superaciones norma aire'],
    ['medioambiente', 'Fiscalizaciones ambientales',       60,   54,  'fiscalizaciones','2026-T1','Inspecciones empresas con componente ambiental'],
    // energia
    ['energia', 'Sistemas solares instalados',            200,  145,  'familias',   '2026-T1', 'Techos solares viviendas sociales'],
    ['energia', 'Cortes eléctricos reducidos',             30,   22,  '%reducción', '2026-T1', 'Meta reducción cortes comunas rurales'],
    ['energia', 'Comunas con diagnóstico energético',      10,    8,  'comunas',    '2026-T1', 'Diagnóstico eficiencia energética municipal'],
    // economia
    ['economia', 'PYMES con crédito FOGAPE',              300,  234,  'empresas',   '2026-T1', 'Meta adopción crédito blando PYMES'],
    ['economia', 'Empleos formalizados',                 1200,  980,  'empleos',    '2026-T1', 'Formalización laboral PYMES región'],
    ['economia', 'Ruedas de negocios realizadas',           4,    3,  'eventos',    '2026-T1', 'Encuentros PYMES con compradores'],
    // mineria
    ['mineria', 'Faenas mineras formalizadas',             20,   12,  'faenas',     '2026-T1', 'Regularización pequeña minería artesanal'],
    ['mineria', 'Fiscalizaciones realizadas',              15,   14,  'fiscalizaciones','2026-T1','Inspecciones seguridad minera'],
    // desarrollosocial
    ['desarrollosocial', 'Fichas RSH actualizadas',      8000, 6900,  'fichas',     '2026-T1', 'Meta actualización RSH comunas región'],
    ['desarrollosocial', 'Personas en calle atendidas',   180,  155,  'personas',   '2026-T1', 'Atención integral personas situación calle'],
    ['desarrollosocial', 'Comunas con RSH al día',          9,    7,  'comunas',    '2026-T1', 'Meta comunas con 70%+ RSH actualizado'],
    // justicia
    ['justicia', 'Causas patrocinadas defensoría',       1200, 1050,  'causas',     '2026-T1', 'Cobertura defensoría penal pública'],
    ['justicia', 'Tasa de hacinamiento CRS',               80,  150,  '%',          '2026-T1', 'Meta reducción sobrepoblación penal (bajo meta=malo)'],
    // interior
    ['interior', 'Denuncias delitos reducidas',            25,   22,  '%reducción', '2026-T1', 'Meta plan seguridad barrios críticos'],
    ['interior', 'Operativos integrados realizados',       12,   10,  'operativos', '2026-T1', 'Operativos coordinados FFEE-municipios'],
    // cultura
    ['cultura', 'Actividades culturales realizadas',       30,   28,  'actividades','2026-T1', 'Eventos y espectáculos en la región'],
    ['cultura', 'Personas beneficiadas cultura',         5000, 4200,  'personas',   '2026-T1', 'Asistentes actividades culturales SEREMI'],
    // ciencia
    ['ciencia', 'Investigadores vinculados',               18,   12,  'investigadores','2026-T1','Red investigadores en proyectos regionales'],
    ['ciencia', 'Proyectos I+D en ejecución',                6,    4,  'proyectos',  '2026-T1', 'Proyectos con financiamiento regional o nacional'],
    // deporte
    ['deporte', 'Centros deportivos habilitados',           5,    4,  'centros',    '2026-T1', 'Infraestructura deportiva habilitada'],
    ['deporte', 'Personas en programas deporte',         3000, 2800,  'personas',   '2026-T1', 'Participantes programas IND-SEREMI'],
    // mujer
    ['mujer', 'Mujeres en programa autonomía',            400,  365,  'mujeres',    '2026-T1', 'Beneficiarias programa autonomía económica'],
    ['mujer', 'Atenciones por VIF',                      1500, 1420,  'atenciones', '2026-T1', 'Atenciones Centro de la Mujer y casas acogida'],
    ['mujer', 'Emprendimientos formalizados mujeres',     100,   78,  'emprendimientos','2026-T1','Meta formalización emprendimientos femeninos'],
  ]);
  console.log(`✅ kpi_indicadores: ${count('kpi_indicadores')} registros insertados`);
} else {
  console.log(`ℹ️  kpi_indicadores: ya tiene ${count('kpi_indicadores')} registros`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  COMENTARIOS (sobre los primeros registros de visitas y contrataciones)
// ═════════════════════════════════════════════════════════════════════════════
if (count('comentarios') === 0) {
  // Obtener primeros ids de visitas y contrataciones
  const priVisitas = db.prepare('SELECT id, seremiId FROM visitas ORDER BY id ASC LIMIT 5').all();
  const priContrats = db.prepare('SELECT id, seremiId FROM contrataciones ORDER BY id ASC LIMIT 3').all();

  const ins = db.prepare(`
    INSERT INTO comentarios (seremiId, tabla, registroId, texto, autorId, autorNombre, fecha)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((arr) => { for (const r of arr) ins.run(...r); });

  const rows = [];
  // Comentarios sobre visitas
  const comentariosVisita = [
    ['Visita muy productiva, el equipo local demostró alto compromiso. Acordamos reunión de seguimiento.', 'admin', 'Administrador Regional'],
    ['Se identificaron necesidades adicionales en infraestructura. Reportar a nivel central.', 'salud', 'Dra. Carmen López'],
    ['Positiva coordinación interinstitucional. El municipio se comprometió a aportar local.', 'educacion', 'Sr. Rodrigo Valdivia'],
    ['Pendiente confirmación de fecha para visita de seguimiento con equipo técnico regional.', 'admin', 'Administrador Regional'],
    ['Se tomaron fotos del estado actual. Adjuntar informe técnico al expediente.', 'obras', 'Ing. Felipe Meza'],
  ];

  priVisitas.forEach((v, i) => {
    if (comentariosVisita[i]) {
      const [texto, autorId, autorNombre] = comentariosVisita[i];
      rows.push([v.seremiId, 'visitas', v.id, texto, autorId, autorNombre, '2026-02-' + String(i + 10).padStart(2, '0')]);
    }
  });

  // Comentarios sobre contrataciones
  const comentariosContrat = [
    ['Documentación revisada. Falta informe de disponibilidad presupuestaria firmado.', 'admin', 'Administrador Regional'],
    ['Aprobada por VB. Se informa al interesado para firma de contrato.', 'admin', 'Administrador Regional'],
    ['El CV fue revisado. Perfil calificado para el cargo solicitado.', 'obras', 'Ing. Felipe Meza'],
  ];

  priContrats.forEach((c, i) => {
    if (comentariosContrat[i]) {
      const [texto, autorId, autorNombre] = comentariosContrat[i];
      rows.push([c.seremiId, 'contrataciones', c.id, texto, autorId, autorNombre, '2026-02-' + String(i + 18).padStart(2, '0')]);
    }
  });

  tx(rows);
  console.log(`✅ comentarios: ${count('comentarios')} registros insertados`);
} else {
  console.log(`ℹ️  comentarios: ya tiene ${count('comentarios')} registros`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  RESUMEN
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📊 ESTADO FINAL DE LA BASE DE DATOS:\n');
const tablas = [
  'seremis','users','visitas','contactos','prensa',
  'proyectos','nudos','temas','agenda','contrataciones',
  'kpi_indicadores','comentarios','archivos','audit_log',
];
tablas.forEach(t => {
  const n = count(t);
  const bar = '█'.repeat(Math.min(Math.ceil(n / 5), 30));
  console.log(`  ${t.padEnd(20)} ${String(n).padStart(4)}  ${bar}`);
});
console.log('\n✅ Seed completado\n');
