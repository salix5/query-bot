// special cid
export const CID_BLACK_LUSTER_SOLDIER = 19092;

// type
const TYPE_MONSTER = 0x1;
const TYPE_SPELL = 0x2;
const TYPE_TRAP = 0x4;

// color type
const TYPE_NORMAL = 0x10;
const TYPE_EFFECT = 0x20;
const TYPE_FUSION = 0x40;
const TYPE_RITUAL = 0x80;
const TYPE_SYNCHRO = 0x2000;
const TYPE_XYZ = 0x800000;
const TYPE_PENDULUM = 0x1000000;
const TYPE_LINK = 0x4000000;
const TYPE_EXTRA = TYPE_FUSION | TYPE_SYNCHRO | TYPE_XYZ | TYPE_LINK;

// extype
const TYPE_SPIRIT = 0x200;
const TYPE_UNION = 0x400;
const TYPE_DUAL = 0x800;
const TYPE_TUNER = 0x1000;
const TYPE_TOKEN = 0x4000;
const TYPE_FLIP = 0x200000;
const TYPE_TOON = 0x400000;
const TYPE_SPSUMMON = 0x2000000;

// spell type
const TYPE_QUICKPLAY = 0x10000;
const TYPE_CONTINUOUS = 0x20000;
const TYPE_EQUIP = 0x40000;
//const TYPE_RITUAL
const TYPE_FIELD = 0x80000;

// trap type
//const TYPE_CONTINUOUS
const TYPE_COUNTER = 0x100000;

// race
const RACE_WARRIOR = 0x1;
const RACE_SPELLCASTER = 0x2;
const RACE_FAIRY = 0x4;
const RACE_FIEND = 0x8;
const RACE_ZOMBIE = 0x10;
const RACE_MACHINE = 0x20;
const RACE_AQUA = 0x40;
const RACE_PYRO = 0x80;
const RACE_ROCK = 0x100;
const RACE_WINDBEAST = 0x200;
const RACE_PLANT = 0x400;
const RACE_INSECT = 0x800;
const RACE_THUNDER = 0x1000;
const RACE_DRAGON = 0x2000;
const RACE_BEAST = 0x4000;
const RACE_BEASTWARRIOR = 0x8000;
const RACE_DINOSAUR = 0x10000;
const RACE_FISH = 0x20000;
const RACE_SEASERPENT = 0x40000;
const RACE_REPTILE = 0x80000;
const RACE_PSYCHO = 0x100000;
const RACE_DIVINE = 0x200000;
const RACE_CREATORGOD = 0x400000;
const RACE_WYRM = 0x800000;
const RACE_CYBERSE = 0x1000000;
const RACE_ILLUSION = 0x2000000;

// attribute
const ATTRIBUTE_EARTH = 0x01;
const ATTRIBUTE_WATER = 0x02;
const ATTRIBUTE_FIRE = 0x04;
const ATTRIBUTE_WIND = 0x08;
const ATTRIBUTE_LIGHT = 0x10;
const ATTRIBUTE_DARK = 0x20;
const ATTRIBUTE_DIVINE = 0x40;

// Link Marker
const LINK_MARKER_BOTTOM_LEFT = 0x001;	// ↙
const LINK_MARKER_BOTTOM = 0x002;		// ↓
const LINK_MARKER_BOTTOM_RIGHT = 0x004;	// ↘

const LINK_MARKER_LEFT = 0x008;			// ←
const LINK_MARKER_RIGHT = 0x020;		// →

const LINK_MARKER_TOP_LEFT = 0x040;		// ↖
const LINK_MARKER_TOP = 0x080;			// ↑
const LINK_MARKER_TOP_RIGHT = 0x100;	// ↗

export const card_types = {
	TYPE_MONSTER,
	TYPE_SPELL,
	TYPE_TRAP,
};

export const monster_types = {
	TYPE_NORMAL,
	TYPE_EFFECT,
	TYPE_FUSION,
	TYPE_RITUAL,
	TYPE_SYNCHRO,
	TYPE_XYZ,
	TYPE_PENDULUM,
	TYPE_LINK,
	TYPE_EXTRA,

	TYPE_SPIRIT,
	TYPE_UNION,
	TYPE_DUAL,
	TYPE_TUNER,
	TYPE_TOKEN,
	TYPE_FLIP,
	TYPE_TOON,
	TYPE_SPSUMMON,
};

export const spell_types = {
	none: 0,
	TYPE_QUICKPLAY,
	TYPE_CONTINUOUS,
	TYPE_EQUIP,
	TYPE_RITUAL,
	TYPE_FIELD,
	TYPE_NORMAL: 0x80000000,	// Pseudo type for API (not stored in database)
};

export const trap_types = {
	none: 0,
	TYPE_CONTINUOUS,
	TYPE_COUNTER,
	TYPE_NORMAL: 0x80000000,	// Pseudo type for API (not stored in database)
};

export const spell_colors = {
	0: 10,
	[TYPE_QUICKPLAY]: 11,
	[TYPE_CONTINUOUS]: 12,
	[TYPE_EQUIP]: 13,
	[TYPE_RITUAL]: 14,
	[TYPE_FIELD]: 15,
};

export const trap_colors = {
	0: 20,
	[TYPE_CONTINUOUS]: 21,
	[TYPE_COUNTER]: 22,
};

export const races = {
	RACE_WARRIOR,
	RACE_SPELLCASTER,
	RACE_FAIRY,
	RACE_FIEND,
	RACE_ZOMBIE,
	RACE_MACHINE,
	RACE_AQUA,
	RACE_PYRO,
	RACE_ROCK,
	RACE_WINDBEAST,
	RACE_PLANT,
	RACE_INSECT,
	RACE_THUNDER,
	RACE_DRAGON,
	RACE_BEAST,
	RACE_BEASTWARRIOR,
	RACE_DINOSAUR,
	RACE_FISH,
	RACE_SEASERPENT,
	RACE_REPTILE,
	RACE_PSYCHO,
	RACE_DIVINE,
	RACE_CREATORGOD,
	RACE_WYRM,
	RACE_CYBERSE,
	RACE_ILLUSION,
};

export const attributes = {
	ATTRIBUTE_EARTH,
	ATTRIBUTE_WATER,
	ATTRIBUTE_FIRE,
	ATTRIBUTE_WIND,
	ATTRIBUTE_LIGHT,
	ATTRIBUTE_DARK,
	ATTRIBUTE_DIVINE,
};

export const link_markers = {
	LINK_MARKER_BOTTOM_LEFT,
	LINK_MARKER_BOTTOM,
	LINK_MARKER_BOTTOM_RIGHT,

	LINK_MARKER_LEFT,
	LINK_MARKER_RIGHT,

	LINK_MARKER_TOP_LEFT,
	LINK_MARKER_TOP,
	LINK_MARKER_TOP_RIGHT,
};

export const md_rarity = {
	1: 'N',
	2: 'R',
	3: 'SR',
	4: 'UR',
}

export const interface_types = {
	"id": 0,
	"cid": 0,
	"tcg": 0,
	"alias": 0,
	"setcode": 0,
	"type": 0,
	"exact_type": 0,
	"exclude": 0,
	"spell_type": 0,
	"trap_type": 0,
	"mention": 0,

	"atk_from": 0,
	"atk_to": 0,
	"def_from": 0,
	"def_to": 0,
	"sum": 0,
	"marker": 0,
	"marker_operator": 0,
	"level": 1,
	"level_from": 0,
	"level_to": 0,
	"scale": 1,
	"scale_from": 0,
	"scale_to": 0,
	"race": 0,
	"attribute": 0,
	"material": 0,

	"name": 2,
	"desc": 2,
	"desc_operator": 0,
	"pack": 2,
};

export const constant_table = {
	card_types,
	monster_types,
	spell_types,
	trap_types,
	races,
	attributes,
	link_markers,
	md_rarity,
	interface_types,
};
