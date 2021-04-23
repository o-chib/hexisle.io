export const Constant = Object.freeze({
	// Player_Radius, Player_Hp, Player_Speed, Player_Fire_rate, Bullet_speed, Bullet damage
	MAP_WIDTH: 10000,
	MAP_HEIGHT: 5000,
	TEAM_COUNT: 2,
	WALL_COST: 5,
	TURRET_COST: 10,
	BUILDING_REFUND_MULTIPLIER: 0.5,
	NO_ENEMIES: 10,

	RADIUS: {
		PLAYER: 50,
		BULLET: 15,
		WALL: 75,
		TURRET: 75,
		BASE: 200,
		CAMP: 75,
		TERRITORY: 500,
		VIEW: 2000,
		CAMP_HEXES: 4,

		COLLISION: {
			PLAYER: 50,
			BULLET: 15,
			WALL: 75 * 0.75,
			TURRET: 75 * 0.75,
			BASE: 200 * 0.75,
			CAMP: 75,
		},

		RANGE: {
			TURRET: 750,
		},
	},

	HP: {
		PLAYER: 100,
		BASE: 100,
		WALL: 50,
		TURRET: 50,
	},

	INCOME: {
		UPDATE_RATE: 1 * 1000,
		INCOME_PER_CAMP: 1,
	},

	TEAM: {
		NONE: -1,
		RED: 0,
		BLUE: 1,
	},

	DIRECTION: {
		E: 0,
		NE: 0.25 * Math.PI,
		N: 0.5 * Math.PI,
		NW: 0.75 * Math.PI,
		W: Math.PI,
		SW: 1.25 * Math.PI,
		S: 1.5 * Math.PI,
		SE: 1.75 * Math.PI,
	},

	BUILDING: {
		OUT_OF_BOUNDS: 'out of bounds',
		NONE: 'none',
		WALL: 'wall',
		TURRET: 'turret',
		CAMP: 'camp',
		BASE: 'base',
		CANT_BUILD: 'cant build',
		BOUNDARY: 'boundary',
	},

	MESSAGE: {
		JOIN: 'join',
		GAME_UPDATE: 'update_state',
		GAME_END: 'game_end',
		MOVEMENT: 'move',
		BUILD_WALL: 'build_wall',
		BUILD_TURRET: 'build_turret',
		DEMOLISH_STRUCTURE: 'demolish_structure',
		SHOOT: 'shoot',
		ROTATE: 'rotate',
		RESPAWN: 'respawn',
		INITIALIZE: 'initialize_game',
	},

	TIMING: {
		SERVER_GAME_UPDATE: 1000 / 60,
		CHECK_GAME_END: 1000 / 60,
		GAME_END_SCREEN: 5 * 1000,
		GAME_TIME_LIMIT: 5 * (60 * 1000),
		TURRET_RELOAD_TIME: 1 * 60,
	},
});
