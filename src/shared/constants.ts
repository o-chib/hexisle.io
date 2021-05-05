export const Constant = Object.freeze({
	// Player_Radius, Player_Hp, Player_Speed, Player_Fire_rate, Bullet_speed, Bullet damage
	MAP_WIDTH: 4000,
	MAP_HEIGHT: 4000,
	TEAM_COUNT: 2,

	COST: {
		WALL: 5,
		TURRET: 10,
		BUILDING_REFUND_MULTIPLIER: 0.5,
	},

	HP: {
		PLAYER: 100,
		BASE: 1000,
		WALL: 100,
		TURRET: 150,
	},

	INCOME: {
		UPDATE_RATE: 1 * 1000,
		INCOME_PER_CAMP: 1,
	},

	GAME_TIMING: {
		UPDATE_RATE: 1000 / 60,
		CHECK_END: 1000 / 60,
		END_SCREEN: 5 * 1000,
		TIME_LIMIT: 5 * (60 * 1000),
	},

	RELOAD_TIMING: {
		PLAYER: 0.5 * 1000,
		TURRET: 1 * 1000,
	},

	OBJS: {
		BULLET: {
			SPEED: 1,
			LIFELENGTH: 1* 1000,
		},

		PLAYER: {
			SPEED: 600,
		},
	},

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

	BUILDING: {
		OUT_OF_BOUNDS: 'OUT_OF_BOUNDS',
		NONE: 'NONE',
		WALL: 'WALL',
		TURRET: 'TURRET',
		CAMP: 'CAMP',
		BASE: 'BASE',
		CANT_BUILD: 'CANT_BUILD',
		BOUNDARY: 'BOUNDARY',
	},

	MESSAGE: {
		JOIN: 'JOIN',
		GAME_UPDATE: 'GAME_UPDATE',
		GAME_END: 'GAME_END',
		MOVEMENT: 'MOVEMENT',
		BUILD_WALL: 'BUILD_WALL',
		BUILD_TURRET: 'BUILD_TURRET',
		DEMOLISH_STRUCTURE: 'DEMOLISH_STRUCTURE',
		SHOOT: 'SHOOT',
		ROTATE: 'ROTATE',
		RESPAWN: 'RESPAWN',
		INITIALIZE: 'INITIALIZE',
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
		INVALID: 10,
	},
});
