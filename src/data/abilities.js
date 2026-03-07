// ══════════════════════════════════════════
// Abilities System — Passive battle effects
// ══════════════════════════════════════════

// ── Ability definitions ──────────────────────────────────────────────────────
export const ABILITIES = {
  // ── Starter trio triggers ──
  BLAZE:       { id:'BLAZE',       name:'اللهب',         icon:'🔥', desc:'هجمات النار +50% عند HP ≤ 33%',         type:'damage_boost' },
  TORRENT:     { id:'TORRENT',     name:'التيار',         icon:'🌊', desc:'هجمات الماء +50% عند HP ≤ 33%',        type:'damage_boost' },
  OVERGROW:    { id:'OVERGROW',    name:'الإنبات',       icon:'🌿', desc:'هجمات العشب +50% عند HP ≤ 33%',        type:'damage_boost' },
  SWARM:       { id:'SWARM',       name:'السرب',          icon:'🐛', desc:'هجمات الحشرات +50% عند HP ≤ 33%',     type:'damage_boost' },
  TORCHIC:     { id:'TORCHIC',     name:'الشعلة الصغيرة',icon:'🐦', desc:'هجمات النار +50% عند HP ≤ 33%',        type:'damage_boost' },

  // ── Type immunities ──
  LEVITATE:    { id:'LEVITATE',    name:'التحليق',       icon:'🌪️', desc:'مناعة كاملة ضد هجمات الأرض',          type:'immunity' },
  FLASH_FIRE:  { id:'FLASH_FIRE',  name:'النار الخاطفة', icon:'✨', desc:'مناعة من النار + تعزيزها',              type:'immunity' },
  WATER_ABSORB:{ id:'WATER_ABSORB',name:'امتصاص الماء',  icon:'💧', desc:'يشفي 25% من الماء بدلاً من تلقي أذى', type:'absorb'   },
  VOLT_ABSORB: { id:'VOLT_ABSORB', name:'امتصاص الكهرباء',icon:'⚡',desc:'يشفي 25% من الكهرباء بدلاً من تلقي أذى',type:'absorb' },
  LIGHTNING_ROD:{ id:'LIGHTNING_ROD',name:'موصل الصاعقة',icon:'⚡', desc:'يجذب هجمات الكهرباء ويزيد الSpAtk',   type:'redirect' },
  SAP_SIPPER:  { id:'SAP_SIPPER',  name:'ماص العصارة',   icon:'🌿', desc:'مناعة من العشب + زيادة ATK',           type:'absorb'   },

  // ── Damage reduction / boost ──
  THICK_FAT:   { id:'THICK_FAT',   name:'الدهون الثخينة',icon:'🛡️', desc:'يقلل أضرار النار والجليد بنصف',        type:'resistance'},
  FILTER:      { id:'FILTER',      name:'المرشح',         icon:'💎', desc:'يقلل الهجمات الفعّالة جداً بـ 25%',  type:'resistance'},
  SOLID_ROCK:  { id:'SOLID_ROCK',  name:'الصخرة الصلبة', icon:'🪨', desc:'يقلل الهجمات الفعّالة جداً بـ 25%',  type:'resistance'},
  MARVEL_SCALE:{ id:'MARVEL_SCALE',name:'الحرشفة المذهلة',icon:'✨', desc:'DEF +50% عند تأثر بحالة سلبية',       type:'conditional'},
  GUTS:        { id:'GUTS',        name:'الشجاعة',        icon:'💪', desc:'ATK +50% عند تأثر بحالة سلبية',       type:'conditional'},

  // ── Speed & pressure ──
  SPEED_BOOST: { id:'SPEED_BOOST', name:'تسريع',          icon:'💨', desc:'يزيد SPD بمقدار +1 كل دور',           type:'end_of_turn'},
  SWIFT_SWIM:  { id:'SWIFT_SWIM',  name:'السباحة السريعة',icon:'🏊', desc:'SPD ×2 في المطر',                      type:'weather'   },
  CHLOROPHYLL: { id:'CHLOROPHYLL', name:'الكلوروفيل',     icon:'☀️', desc:'SPD ×2 في الشمس',                      type:'weather'   },
  SAND_RUSH:   { id:'SAND_RUSH',   name:'سرعة الرمال',    icon:'🏜️', desc:'SPD ×2 في العاصفة الرملية',            type:'weather'   },
  SLUSH_RUSH:  { id:'SLUSH_RUSH',  name:'سرعة الثلج',     icon:'❄️', desc:'SPD ×2 في البَرَد',                    type:'weather'   },

  // ── Intimidation / entry ──
  INTIMIDATE:  { id:'INTIMIDATE',  name:'التخويف',        icon:'😤', desc:'يخفض ATK العدو بـ -1 عند الدخول',     type:'on_enter'  },
  DOWNLOAD:    { id:'DOWNLOAD',    name:'التحميل',        icon:'📡', desc:'يرفع ATK أو SpATK حسب دفاع العدو',    type:'on_enter'  },
  TRACE:       { id:'TRACE',       name:'النسخ',          icon:'📋', desc:'ينسخ قدرة العدو عند الدخول',          type:'on_enter'  },

  // ── Status immunity ──
  IMMUNITY:    { id:'IMMUNITY',    name:'المناعة',        icon:'🦠', desc:'مناعة كاملة من السم',                  type:'status_immune'},
  INSOMNIA:    { id:'INSOMNIA',    name:'الأرق',          icon:'👁️', desc:'مناعة من النوم',                      type:'status_immune'},
  INNER_FOCUS: { id:'INNER_FOCUS', name:'التركيز الداخلي',icon:'🧘', desc:'مناعة من الارتباك والرعب',             type:'status_immune'},
  OBLIVIOUS:   { id:'OBLIVIOUS',   name:'الغفلة',         icon:'😶', desc:'مناعة من الارتباك والجاذبية',          type:'status_immune'},
  LIMBER:      { id:'LIMBER',      name:'الليونة',        icon:'🤸', desc:'مناعة من الشلل',                       type:'status_immune'},
  MAGMA_ARMOR: { id:'MAGMA_ARMOR', name:'درع الحمم',      icon:'🌋', desc:'مناعة من التجميد',                     type:'status_immune'},
  WATER_VEIL:  { id:'WATER_VEIL',  name:'حجاب الماء',    icon:'💦', desc:'مناعة من الحرق',                       type:'status_immune'},

  // ── Healing ──
  REGENERATOR: { id:'REGENERATOR', name:'التجدد',         icon:'💚', desc:'يشفي 33% HP عند مغادرة الملعب',       type:'on_exit'   },
  POISON_HEAL: { id:'POISON_HEAL', name:'شفاء السم',      icon:'💜', desc:'يشفي 12% HP/دور بدلاً من تلقي ضرر السم',type:'end_of_turn'},
  SHED_SKIN:   { id:'SHED_SKIN',   name:'تجديد الجلد',    icon:'🐍', desc:'33% احتمال إزالة الحالة السلبية كل دور',type:'end_of_turn'},

  // ── Misc ──
  STURDY:      { id:'STURDY',      name:'الصلابة',        icon:'🔩', desc:'يبقى على 1 HP عند ضربة إسقاط من HP كامل',type:'survive'},
  MAGIC_GUARD: { id:'MAGIC_GUARD', name:'الحارس السحري',  icon:'🔮', desc:'لا ضرر إضافي من البيئة (سم/حرق/طقس)', type:'negate'   },
  TECHNICIAN:  { id:'TECHNICIAN',  name:'التقني',         icon:'🔧', desc:'هجمات قوة ≤ 60 تُضاعَف ×1.5',         type:'damage_boost'},
  HUGE_POWER:  { id:'HUGE_POWER',  name:'القوة الهائلة',  icon:'🦾', desc:'يضاعف ATK الفعّال',                    type:'stat_boost'},
  PURE_POWER:  { id:'PURE_POWER',  name:'القوة النقية',   icon:'⚡', desc:'يضاعف ATK الفعّال',                    type:'stat_boost'},
};

// ── Pokémon Classes ───────────────────────────────────────────────────────────
export const POKE_CLASSES = {
  TANK:      { id:'TANK',     name:'الحارس',    nameEn:'TANK',     icon:'🛡️', color:'#90A4AE', desc:'HP ودفاع عالٍ — يتحمل الضربات'   },
  SWEEPER:   { id:'SWEEPER',  name:'الهجوم',    nameEn:'SWEEPER',  icon:'⚔️', color:'#EF5350', desc:'هجوم وسرعة عالية — يضرب أولاً'    },
  SPECIAL:   { id:'SPECIAL',  name:'السحري',    nameEn:'SPECIAL',  icon:'✨', color:'#EC407A', desc:'هجوم خاص عالٍ — قوة سحرية'       },
  WALL:      { id:'WALL',     name:'السد',      nameEn:'WALL',     icon:'🧱', color:'#78909C', desc:'دفاع خاص عالٍ — يصمد أمام الهجمات الخاصة'},
  SUPPORT:   { id:'SUPPORT',  name:'الداعم',    nameEn:'SUPPORT',  icon:'💚', color:'#66BB6A', desc:'يدعم الفريق بتأثيرات الحالة والطقس'},
  SPEEDSTER: { id:'SPEEDSTER',name:'السريع',    nameEn:'SPEEDSTER',icon:'💨', color:'#4FC3F7', desc:'سرعة فائقة — يهاجم دائماً أولاً'  },
  BALANCED:  { id:'BALANCED', name:'المتوازن',  nameEn:'BALANCED', icon:'⚖️', color:'#FFB74D', desc:'إحصائيات متوازنة — مرونة عالية'   },
  LEGENDARY: { id:'LEGENDARY',name:'الأسطوري', nameEn:'LEGENDARY',icon:'👑', color:'#FFD600', desc:'قوة استثنائية في كل الإحصائيات'  },
};

// ── Determine class from base stats ─────────────────────────────────────────
export function classifyPoke(pokeId, stats, bst) {
  if (!stats) return POKE_CLASSES.BALANCED;

  // Legendary threshold
  if (bst >= 600) return POKE_CLASSES.LEGENDARY;

  const { a, d, sa, sd, sp } = stats;
  const defScore  = (d  + sd) / 2;
  const atkScore  = (a  + sa) / 2;
  const spAtkRatio = sa / Math.max(a, 1);

  if (sp >= 110)                         return POKE_CLASSES.SPEEDSTER;
  if (defScore >= 100 && d  >= sd)       return POKE_CLASSES.TANK;
  if (defScore >= 100 && sd >= d)        return POKE_CLASSES.WALL;
  if (sa >= 110 && spAtkRatio >= 1.3)   return POKE_CLASSES.SPECIAL;
  if (a  >= 110 && spAtkRatio  < 1.3)   return POKE_CLASSES.SWEEPER;
  if (bst <= 460)                        return POKE_CLASSES.SUPPORT;
  return POKE_CLASSES.BALANCED;
}

// ── Pokémon → Ability mapping ────────────────────────────────────────────────
// Map of pokeId → ability id
export const POKE_ABILITIES = {
  // Gen 1 Starters
  1:'OVERGROW', 2:'OVERGROW', 3:'OVERGROW',
  4:'BLAZE',    5:'BLAZE',    6:'BLAZE',
  7:'TORRENT',  8:'TORRENT',  9:'TORRENT',

  // Early mons
  12:'COMPOUNDEYES', 15:'SWARM',
  16:'KEEN_EYE', 17:'KEEN_EYE', 18:'KEEN_EYE',
  19:'RUN_AWAY', 20:'RUN_AWAY',
  23:'SHED_SKIN', 24:'SHED_SKIN',
  25:'STATIC', 26:'STATIC',
  27:'SAND_VEIL', 28:'SAND_VEIL',
  29:'POISON_POINT', 30:'POISON_POINT', 31:'POISON_POINT',
  32:'POISON_POINT', 33:'POISON_POINT', 34:'POISON_POINT',
  35:'THICK_FAT', 36:'THICK_FAT',
  37:'FLASH_FIRE', 38:'FLASH_FIRE',
  39:'THICK_FAT', 40:'THICK_FAT',
  41:'INNER_FOCUS', 42:'INNER_FOCUS',
  43:'EFFECT_SPORE', 44:'EFFECT_SPORE', 45:'EFFECT_SPORE',
  46:'EFFECT_SPORE', 47:'EFFECT_SPORE',
  48:'EFFECT_SPORE', 49:'COMPOUNDEYES',
  50:'SAND_VEIL', 51:'SAND_VEIL',
  52:'LIMBER', 53:'LIMBER',
  54:'CLOUD_NINE', 55:'CLOUD_NINE',
  56:'VITAL_SPIRIT', 57:'VITAL_SPIRIT',
  58:'INTIMIDATE', 59:'INTIMIDATE',
  60:'WATER_ABSORB', 61:'WATER_ABSORB', 62:'WATER_ABSORB',
  63:'INNER_FOCUS', 64:'INNER_FOCUS', 65:'INNER_FOCUS',
  66:'GUTS', 67:'GUTS', 68:'GUTS',
  69:'CHLOROPHYLL', 70:'CHLOROPHYLL', 71:'CHLOROPHYLL',
  72:'LIQUID_OOZE', 73:'LIQUID_OOZE',
  74:'STURDY', 75:'STURDY', 76:'STURDY',
  77:'FLASH_FIRE', 78:'FLASH_FIRE',
  79:'OBLIVIOUS', 80:'OBLIVIOUS',
  81:'MAGNET_PULL', 82:'MAGNET_PULL',
  83:'KEEN_EYE',
  84:'KEEN_EYE', 85:'KEEN_EYE',
  86:'THICK_FAT', 87:'THICK_FAT',
  88:'STENCH', 89:'STENCH',
  90:'SHELL_ARMOR', 91:'SHELL_ARMOR',
  92:'LEVITATE', 93:'LEVITATE', 94:'LEVITATE',
  95:'STURDY', 96:'OBLIVIOUS', 97:'OBLIVIOUS',
  98:'SHELL_ARMOR', 99:'SHELL_ARMOR',
  100:'LEVITATE', 101:'LEVITATE',
  102:'CHLOROPHYLL', 103:'CHLOROPHYLL',
  104:'ROCK_HEAD', 105:'ROCK_HEAD',
  106:'LIMBER', 107:'IRON_FIST',
  108:'OWN_TEMPO', 109:'STENCH', 110:'STENCH',
  111:'LIGHTNING_ROD', 112:'LIGHTNING_ROD',
  113:'SERENE_GRACE', 114:'CHLOROPHYLL',
  115:'SCRAPPY', 116:'SWIFT_SWIM', 117:'SWIFT_SWIM',
  118:'SWIFT_SWIM', 119:'SWIFT_SWIM',
  120:'ILLUMINATE', 121:'ILLUMINATE',
  122:'SOUNDPROOF', 123:'SWARM', 124:'OBLIVIOUS',
  125:'STATIC', 126:'FLAME_BODY', 127:'HYPER_CUTTER',
  128:'INTIMIDATE', 129:'SWIFT_SWIM', 130:'INTIMIDATE',
  131:'WATER_ABSORB', 132:'LIMBER', 133:'ADAPTABILITY',
  134:'WATER_ABSORB', 135:'VOLT_ABSORB', 136:'FLASH_FIRE',
  137:'TRACE', 138:'SWIFT_SWIM', 139:'SWIFT_SWIM',
  140:'SWIFT_SWIM', 141:'BATTLE_ARMOR',
  142:'PRESSURE', 143:'THICK_FAT',
  // Legendaries
  144:'PRESSURE', 145:'PRESSURE', 146:'PRESSURE',
  147:'SHED_SKIN', 148:'SHED_SKIN', 149:'INNER_FOCUS',
  150:'PRESSURE', 151:'SYNCHRONIZE',

  // Gen 2
  152:'OVERGROW', 153:'OVERGROW', 154:'OVERGROW',
  155:'BLAZE',    156:'BLAZE',    157:'BLAZE',
  158:'TORRENT',  159:'TORRENT',  160:'TORRENT',
  161:'RUN_AWAY', 162:'RUN_AWAY',
  163:'KEEN_EYE', 164:'KEEN_EYE',
  165:'SWARM',    166:'SWARM',
  167:'SWARM',    168:'SWARM',
  169:'INNER_FOCUS', 170:'VOLT_ABSORB', 171:'VOLT_ABSORB',
  172:'STATIC',   173:'SERENE_GRACE', 174:'THICK_FAT',
  175:'SERENE_GRACE', 176:'SERENE_GRACE', 177:'KEEN_EYE', 178:'KEEN_EYE',
  179:'STATIC',   180:'STATIC',   181:'STATIC',
  182:'CHLOROPHYLL', 183:'THICK_FAT', 184:'THICK_FAT',
  185:'STURDY',   186:'WATER_ABSORB',
  187:'CHLOROPHYLL', 188:'CHLOROPHYLL', 189:'CHLOROPHYLL',
  190:'PICKUP',   191:'CHLOROPHYLL', 192:'CHLOROPHYLL',
  193:'SWIFT_SWIM', 194:'WATER_ABSORB', 195:'WATER_ABSORB',
  196:'SYNCHRONIZE', 197:'SYNCHRONIZE',
  198:'INSOMNIA', 199:'OBLIVIOUS', 200:'LEVITATE',
  201:'LEVITATE', 202:'SHADOW_TAG', 203:'INNER_FOCUS',
  204:'STURDY',   205:'STURDY',   206:'LEVITATE',
  207:'HYPER_CUTTER', 208:'STURDY',
  209:'INTIMIDATE', 210:'INTIMIDATE',
  211:'POISON_POINT', 212:'SWARM',
  213:'STURDY',   214:'GUTS',
  215:'INNER_FOCUS', 216:'THICK_FAT', 217:'THICK_FAT',
  218:'FLAME_BODY', 219:'FLAME_BODY',
  220:'OBLIVIOUS', 221:'OBLIVIOUS',
  222:'NATURAL_CURE', 223:'HUSTLE', 224:'HUSTLE',
  225:'THICK_FAT', 226:'SWIFT_SWIM', 227:'KEEN_EYE',
  228:'FLASH_FIRE', 229:'FLASH_FIRE',
  230:'SWIFT_SWIM', 231:'OBLIVIOUS', 232:'OBLIVIOUS',
  233:'DOWNLOAD',  234:'INNER_FOCUS',
  235:'OWN_TEMPO', 236:'GUTS',     237:'INNER_FOCUS',
  238:'OBLIVIOUS', 239:'STATIC',   240:'FLAME_BODY',
  241:'THICK_FAT', 242:'SERENE_GRACE', 243:'PRESSURE',
  244:'PRESSURE',  245:'PRESSURE',  246:'SHED_SKIN',
  247:'SHED_SKIN', 248:'SAND_STREAM', 249:'PRESSURE',
  250:'PRESSURE',  251:'NATURAL_CURE',

  // Notable Gen 3-7
  252:'OVERGROW', 255:'BLAZE',    258:'TORRENT',
  282:'TRACE',    302:'SWIFT_SWIM',
  310:'STATIC',   330:'LEVITATE', 334:'CLOUD_NINE',
  335:'HYPER_CUTTER', 350:'MARVEL_SCALE',
  357:'CHLOROPHYLL', 359:'SAND_VEIL',
  373:'SHED_SKIN', 376:'CLEAR_BODY',
  380:'LEVITATE', 381:'LEVITATE', 382:'DRIZZLE',
  383:'DROUGHT',  384:'AIR_LOCK',
  385:'SERENE_GRACE', 386:'LEVITATE',
  389:'OVERGROW', 392:'BLAZE', 395:'TORRENT',
  398:'KEEN_EYE', 400:'SHELL_ARMOR', 405:'INTIMIDATE',
  407:'NATURAL_CURE', 409:'ROCK_HEAD',
  413:'ANTICIPATION', 416:'PRESSURE',
  422:'SHIELD_DUST', 428:'LIMBER',
  430:'SUPER_LUCK', 432:'THICK_FAT',
  445:'SAND_VEIL', 448:'INNER_FOCUS',
  450:'SAND_VEIL', 452:'SHED_SKIN',
  460:'SNOW_WARNING', 462:'MAGNET_PULL',
  466:'STATIC',    467:'FLAME_BODY',
  468:'SERENE_GRACE', 472:'LEVITATE',
  473:'THICK_FAT', 474:'DOWNLOAD',
  477:'LEVITATE',  479:'LEVITATE',
  480:'LEVITATE',  481:'LEVITATE',
  482:'LEVITATE',  483:'PRESSURE',
  484:'PRESSURE',  485:'FLASH_FIRE',
  486:'PRESSURE',  487:'LEVITATE',
  488:'LEVITATE',  489:'HYDRATION',
  490:'HYDRATION', 491:'BAD_DREAMS',
  493:'MULTITYPE',

  // Gen 5
  496:'OVERGROW', 499:'BLAZE',  502:'TORRENT',
  503:'TORRENT',  523:'LIGHTNING_ROD',
  528:'INNER_FOCUS', 545:'SHED_SKIN',
  549:'CHLOROPHYLL', 551:'SAND_VEIL',
  553:'INTIMIDATE', 555:'ZEN_MODE',
  560:'INTIMIDATE', 571:'ILLUSION',
  576:'MAGIC_GUARD', 579:'MAGIC_GUARD',
  581:'SWIFT_SWIM',  591:'REGENERATOR',
  596:'COMPOUND_EYES', 598:'IRON_BARBS',
  609:'FLAME_BODY', 614:'INNER_FOCUS',
  621:'SHED_SKIN', 623:'SOLID_ROCK',
  625:'IRON_FIST', 630:'INTIMIDATE',
  631:'FLASH_FIRE', 637:'FLAME_BODY',
  638:'PRESSURE', 639:'PRESSURE',
  640:'JUSTIFIED', 641:'SAND_FORCE',
  642:'SAND_FORCE', 643:'TURBOBLAZE',
  644:'TERAVOLT', 646:'PRESSURE',

  // Gen 6-7 notable
  650:'OVERGROW', 653:'BLAZE',  656:'TORRENT',
  661:'KEEN_EYE', 667:'INTIMIDATE', 668:'INTIMIDATE',
  680:'STANCE_CHANGE', 681:'STANCE_CHANGE',
  696:'STRONG_JAW', 697:'ROCK_HEAD',
  700:'FAIRY_AURA', 703:'LEVITATE',
  706:'HYDRATION', 711:'INSOMNIA',
  713:'STURDY',    716:'FAIRY_AURA',
  717:'DARK_AURA', 718:'AURA_BREAK',
  719:'STURDY',    720:'UNNERVE',

  722:'OVERGROW', 725:'BLAZE',   728:'TORRENT',
  734:'RATTLED',  736:'COMPOUND_EYES',
  741:'DANCER',   745:'INTIMIDATE',
  750:'GUTS',     751:'SWIFT_SWIM',
  754:'CHLOROPHYLL', 758:'INTIMIDATE',
  760:'THICK_FAT', 764:'CUTE_CHARM',
  766:'DANCER',    770:'REGENERATOR',
  773:'RKS_SYSTEM', 776:'MOTOR_DRIVE',
  781:'WATER_VEIL', 784:'TOUGH_CLAWS',
  785:'FULL_METAL_BODY', 786:'FULL_METAL_BODY',
  787:'FULL_METAL_BODY', 788:'FULL_METAL_BODY',
  789:'RECEIVER', 790:'RECEIVER',
  791:'PRESSURE', 792:'PRESSURE',
  793:'NEUROFORCE', 800:'PRISM_ARMOR',
  802:'NATURAL_CURE', 807:'GIGAVOLT_HAVOC',
  809:'POWER_OF_ALCHEMY',
};

// Normalize: map legacy/unknown ability ids to known ones
const ABILITY_ALIASES = {
  COMPOUNDEYES:'TECHNICIAN', STATIC:'TECHNICIAN', VITAL_SPIRIT:'INNER_FOCUS',
  CLOUD_NINE:'LEVITATE', KEEN_EYE:'TECHNICIAN', RUN_AWAY:'SPEED_BOOST',
  SHED_SKIN:'REGENERATOR', NATURAL_CURE:'REGENERATOR',
  PICKUP:'REGENERATOR', SYNCHRONIZE:'MAGIC_GUARD',
  ILLUMINATE:'TECHNICIAN', STENCH:'TECHNICIAN',
  HYPER_CUTTER:'HUGE_POWER', SCRAPPY:'GUTS',
  IRON_FIST:'HUGE_POWER', SHADOW_TAG:'PRESSURE',
  HUSTLE:'HUGE_POWER', FLAME_BODY:'FLASH_FIRE',
  DROUGHT:'BLAZE', DRIZZLE:'TORRENT', SAND_STREAM:'GUTS',
  CLEAR_BODY:'FILTER', ADAPTABILITY:'HUGE_POWER',
  BATTLE_ARMOR:'FILTER', ROCK_HEAD:'FILTER',
  SERENE_GRACE:'TECHNICIAN', LIQUID_OOZE:'POISON_HEAL',
  MAGNET_PULL:'TECHNICIAN', OWN_TEMPO:'INNER_FOCUS',
  PRESSURE:'FILTER', AIR_LOCK:'MAGIC_GUARD',
  MULTITYPE:'HUGE_POWER', ZEN_MODE:'GUTS',
  JUSTIFIED:'GUTS', SAND_FORCE:'GUTS', TURBOBLAZE:'FILTER',
  TERAVOLT:'FILTER', STANCE_CHANGE:'HUGE_POWER',
  STRONG_JAW:'TECHNICIAN', FAIRY_AURA:'FILTER',
  DARK_AURA:'FILTER', AURA_BREAK:'FILTER',
  DANCER:'SPEED_BOOST', RATTLED:'SPEED_BOOST',
  HYDRATION:'WATER_ABSORB', BAD_DREAMS:'TECHNICIAN',
  MOTOR_DRIVE:'VOLT_ABSORB', TOUGH_CLAWS:'TECHNICIAN',
  RKS_SYSTEM:'HUGE_POWER', NEUROFORCE:'HUGE_POWER',
  PRISM_ARMOR:'FILTER', FULL_METAL_BODY:'FILTER',
  RECEIVER:'DOWNLOAD', POWER_OF_ALCHEMY:'DOWNLOAD',
  GIGAVOLT_HAVOC:'HUGE_POWER', UNNERVE:'INTIMIDATE',
  IRON_BARBS:'FILTER', COMPOUND_EYES:'TECHNICIAN',
  CUTE_CHARM:'TECHNICIAN', SUPER_LUCK:'TECHNICIAN',
  ANTICIPATION:'FILTER', INSOMNIA_GUARD:'INSOMNIA',
  WATER_VEIL_EX:'WATER_VEIL', SAND_VEIL:'FILTER',
  EFFECT_SPORE:'TECHNICIAN', POISON_POINT:'TECHNICIAN',
  SHED_SKIN_REGEN:'REGENERATOR',
};

// ── Resolve ability id → ABILITIES entry ─────────────────────────────────────
export function resolveAbility(rawId) {
  if (!rawId) return null;
  const id = ABILITY_ALIASES[rawId] || rawId;
  return ABILITIES[id] || null;
}

export function getPokeAbility(pokeId) {
  const raw = POKE_ABILITIES[pokeId];
  return resolveAbility(raw);
}
