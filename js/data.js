/* Lección 09 · Me gusta mucho viajar — 학습 데이터 */
window.L9 = {
  skills: {
    voc: 'Vocabulario 어휘',
    gus: 'Gustar · Encantar',
    pro: 'Pronombres 간접목적대명사',
    pre: 'Preferir',
    acu: 'También / Tampoco',
    com: 'Comparación 비교',
    fre: 'Frecuencia 빈도',
    lib: 'Escritura libre 자유작문'
  },

  sections: [
    { id: 'inicio', label: 'Portada', kr: '표지 · 학습목표', group: '' },
    { id: 'vocab', label: 'Antes de empezar', kr: '여가활동 어휘', group: 'Introducción' },
    { id: 'gram', label: 'Gramática', kr: '문법 정리', group: 'Introducción' },
    { id: 'd1', label: 'Diálogo 1', kr: '후안과 크리스티나', group: 'Diálogo 1', kind: 'dialogo' },
    { id: 'a1', label: 'Actividad 1', kr: '¿Te gusta / Te gustan?', group: 'Diálogo 1', kind: 'act', n: 1 },
    { id: 'a2', label: 'Actividad 2', kr: 'preferir 문장 사슬', group: 'Diálogo 1', kind: 'act', n: 2 },
    { id: 'a3', label: 'Actividad 3', kr: '그림 연결 · 맞장구', group: 'Diálogo 1', kind: 'act', n: 3 },
    { id: 'a4', label: 'Actividad 4', kr: '¿Por qué? Porque…', group: 'Diálogo 1', kind: 'act', n: 4 },
    { id: 'a5', label: 'Actividad 5', kr: '마르코스와 아드리아나', group: 'Diálogo 1', kind: 'act', n: 5 },
    { id: 'd2', label: 'Diálogo 2', kr: '마리아와 페드로', group: 'Diálogo 2', kind: 'dialogo' },
    { id: 'a6', label: 'Actividad 6', kr: '좋아하는 것 3 · 싫어하는 것 3', group: 'Diálogo 2', kind: 'act', n: 6 },
    { id: 'a7', label: 'Actividad 7', kr: '날씨와 취미', group: 'Diálogo 2', kind: 'act', n: 7 },
    { id: 'a8', label: 'Actividad 8', kr: 'me gusta más … que …', group: 'Diálogo 2', kind: 'act', n: 8 },
    { id: 'a9', label: 'Actividad 9', kr: '취미 대화 완성', group: 'Diálogo 2', kind: 'act', n: 9 },
    { id: 'a10', label: 'Actividad 10', kr: '스포츠 질문에 답하기', group: 'Diálogo 2', kind: 'act', n: 10 },
    { id: 'a11', label: 'Actividad 11', kr: '¿Qué prefieres?', group: 'Diálogo 2', kind: 'act', n: 11 },
    { id: 'util', label: 'Expresiones útiles', kr: '유용한 표현 · 속담', group: 'Repaso' },
    { id: 'examen', label: '¡Compruébalo!', kr: '쓰기 모의시험', group: 'Repaso' },
    { id: 'resultados', label: 'Resultados', kr: '나의 성적표', group: 'Repaso' }
  ],

  aficiones: [
    { es: 'ir a la playa', kr: '해변에 가다', e: '🏖️' },
    { es: 'subir a la montaña', kr: '산에 오르다', e: '⛰️' },
    { es: 'jugar al tenis', kr: '테니스를 치다', e: '🎾' },
    { es: 'ir al cine', kr: '영화관에 가다', e: '🎬' },
    { es: 'leer libros', kr: '책을 읽다', e: '📚' },
    { es: 'escuchar música', kr: '음악을 듣다', e: '🎧' },
    { es: 'ver exposiciones', kr: '전시회를 보다', e: '🖼️' },
    { es: 'cocinar', kr: '요리하다', e: '🍳' },
    { es: 'navegar por Internet', kr: '인터넷 서핑하다', e: '💻' },
    { es: 'pintar', kr: '그림을 그리다', e: '🎨' },
    { es: 'tocar la guitarra', kr: '기타를 치다', e: '🎸' },
    { es: 'pasear con mascotas', kr: '반려동물과 산책하다', e: '🐕' }
  ],

  dialogo1: [
    { who: 'J', es: 'Cristina, ¿te gusta leer?' },
    { who: 'C', es: 'Sí, me gusta [mucho] leer. ¿Y a ti, Juan?' },
    { who: 'J', es: 'Pues a mí [también] me gusta leer, [sobre todo], novelas de amor. Pero [prefiero] ver películas.' },
    { who: 'C', es: 'A mí también me gusta ir al cine.' },
    { who: 'J', es: '¿Qué [tipo] de películas te gusta?' },
    { who: 'C', es: 'A mí me [gustan] las películas de terror. ¿Y a ti?' },
    { who: 'J', es: 'A mí también. Cristina, ¿te gusta viajar?' },
    { who: 'C', es: 'Sí, me gusta mucho viajar, [especialmente] a países de culturas diferentes. Me gusta conocer otras costumbres y comer cosas diferentes.' }
  ],

  dialogo2: [
    { who: 'María', es: '¿Cuál es tu deporte favorito?' },
    { who: 'Pedro', es: 'El baloncesto. Juego [cada martes] después de clase. Y también me gusta mucho el esquí. Todos los inviernos, en Navidades, voy a Sierra Nevada con mis padres a esquiar.' },
    { who: 'María', es: 'Pues a mí me gusta la natación. Voy a la piscina dos veces [a la semana]. ¿Te gusta nadar?' },
    { who: 'Pedro', es: 'No, nunca voy a la piscina.' },
    { who: 'María', es: '¿Y te gusta pasear? Voy al parque a menudo con mi mascota.' },
    { who: 'Pedro', es: 'Yo también paseo por el parque de vez en cuando.' },
    { who: 'María', es: 'Voy este fin de semana con mis amigos, [¿te vienes?]' },
    { who: 'Pedro', es: 'Sí, [¡genial!]' }
  ],

  /* Actividad 5 — 교재 음원 대신 읽기 자료 */
  dialogo5: [
    { who: 'Adriana', es: 'Marcos, ¿qué te gusta hacer los fines de semana?' },
    { who: 'Marcos', es: 'Me gusta mucho jugar al fútbol con mis amigos. ¿Te gusta el fútbol?' },
    { who: 'Adriana', es: 'No, a mí no me gusta el fútbol. Prefiero el tenis. Juego los sábados.' },
    { who: 'Marcos', es: '¿Y te gusta bailar?' },
    { who: 'Adriana', es: '¡Sí! Me encanta la salsa. ¿Y a ti?' },
    { who: 'Marcos', es: 'A mí no me gusta bailar. Tampoco me gustan las discotecas. Prefiero cocinar en casa. ¡Me encantan los platos mexicanos!' },
    { who: 'Adriana', es: 'Pues a mí no me gusta hacer la compra, pero me encantan las películas de terror. ¿Vamos al cine?' },
    { who: 'Marcos', es: '¡Vale!' }
  ],

  act3: [
    { e: '🚲', es: 'montar en bicicleta' },
    { e: '🧹', es: 'limpiar la habitación' },
    { e: '🎮', es: 'jugar a los videojuegos' },
    { e: '🛒', es: 'hacer la compra' },
    { e: '🍲', es: 'cocinar' },
    { e: '☕', es: 'tomar café' },
    { e: '⛷️', es: 'esquiar' },
    { e: '🖼️', es: 'ver exposiciones' },
    { e: '🧺', es: 'lavar la ropa' }
  ],

  act6: ['hablar español', 'tocar el piano', 'hacer los deberes', 'pintar', 'enseñar a los niños',
    'navegar por Internet', 'ir a la playa', 'subir a la montaña', 'ordenar mi habitación',
    'ir a conciertos', 'viajar a América Latina', 'resolver problemas de matemáticas'],

  clima: [
    { k: 'hace fresco', e: '🍃', kr: '선선하다' },
    { k: 'hace mucho calor', e: '🥵', kr: '아주 덥다' },
    { k: 'hace mucho frío', e: '🥶', kr: '아주 춥다' },
    { k: 'nieva', e: '❄️', kr: '눈이 온다' },
    { k: 'llueve', e: '🌧️', kr: '비가 온다' },
    { k: 'hace mucho sol', e: '☀️', kr: '햇볕이 아주 강하다' }
  ],

  act8: [
    { a: { es: 'el coche pequeño', e: '🚗', kr: '작은 차' }, b: { es: 'el coche grande', e: '🚙', kr: '큰 차' } },
    { a: { es: 'el violín', e: '🎻', kr: '바이올린' }, b: { es: 'la guitarra', e: '🎸', kr: '기타' } },
    { a: { es: 'el campo', e: '🏡', kr: '시골' }, b: { es: 'la ciudad', e: '🏙️', kr: '도시' } }
  ],

  act11: [
    { tema: 'hacer deporte', a: { es: 'la natación', e: '🏊' }, b: { es: 'el esquí', e: '⛷️' } },
    { tema: 'ir de vacaciones', a: { es: 'la playa', e: '🏝️' }, b: { es: 'la montaña', e: '🏔️' } },
    { tema: 'comer', a: { es: 'la carne', e: '🥩' }, b: { es: 'el pescado', e: '🐟' } },
    { tema: 'escuchar música', a: { es: 'la música clásica', e: '🎻' }, b: { es: 'el rock', e: '🤘' } }
  ],

  utiles: [
    '¿Qué te gusta hacer?',
    'Me gusta leer, pero no me gusta el cine.',
    'Me gustan las discotecas y las motos.',
    'Me gusta mucho pintar.',
    'Me encanta bailar y cantar.',
    'Me gusta jugar en la nieve.',
    'A mí también. / A mí no.',
    'No me gusta el fútbol ni el tenis.',
    'A mí tampoco. / A mí sí.',
    '¿A quién le gusta tocar la guitarra?',
    'A Olga le gusta tocar la guitarra.'
  ],

  /* 쓰기 모의시험 Parte A 문제은행 */
  examBank: [
    { p: '(A mí) me ____ las películas cómicas. <i>(gustar)</i>', a: ['gustan'], s: 'gus' },
    { p: 'A mi hermano ____ gusta jugar al béisbol.', a: ['le'], s: 'pro' },
    { p: '¿A vosotros ____ gusta la música pop?', a: ['os'], s: 'pro' },
    { p: 'A nosotros ____ encantan los conciertos.', a: ['nos'], s: 'pro' },
    { p: 'Mis amigos ____ el cine al teatro. <i>(preferir)</i>', a: ['prefieren'], s: 'pre' },
    { p: 'Yo ____ ver películas en casa. <i>(preferir)</i>', a: ['prefiero'], s: 'pre' },
    { p: '¿Tú qué ____, la playa o la montaña? <i>(preferir)</i>', a: ['prefieres'], s: 'pre' },
    { p: 'A: No me gusta el fútbol. — B (나도 싫어): A mí ____.', a: ['tampoco'], s: 'acu' },
    { p: 'A: Me gusta esquiar. — B (나도 좋아): A mí ____.', a: ['también'], s: 'acu' },
    { p: 'A: No me gusta cocinar. — B (나는 좋아): A mí ____.', a: ['sí'], s: 'acu' },
    { p: 'Me gusta ____ el tenis que el fútbol. <i>(더)</i>', a: ['más'], s: 'com' },
    { p: 'Me gusta más la ciudad ____ el campo.', a: ['que'], s: 'com' },
    { p: 'Me ____ bailar y cantar. <i>(encantar)</i>', a: ['encanta'], s: 'gus' },
    { p: 'Juego al baloncesto dos veces ____ semana.', a: ['a la', 'por'], s: 'fre' },
    { p: 'No me gusta el fútbol ____ el tenis. <i>(~도 …도 아니다)</i>', a: ['ni'], s: 'gus' },
    { p: 'Me gusta navegar por Internet ____ ir a la playa. <i>(그리고)</i>', a: ['e'], s: 'gus' },
    { p: '¿____ tipo de películas te gusta?', a: ['qué'], s: 'gus' },
    { p: 'Pedro ____ va a la piscina. <i>(전혀 ~않다)</i>', a: ['nunca'], s: 'fre' }
  ]
};
