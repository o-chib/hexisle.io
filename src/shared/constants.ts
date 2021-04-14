export const Constant = Object.freeze({
	// Player_Radius, Player_Hp, Player_Speed, Player_Fire_rate, Bullet_speed, Bullet damage
	DEFAULT_WIDTH: 10000,
	DEFAULT_HEIGHT: 10000,
	PLAYER_RADIUS: 50,
	BULLET_RADIUS: 15,
	WALL_RADIUS: 75,
	WALL_COL_RADIUS: 75 * 0.75,
	BASE_RADIUS: 200,
	BASE_COL_RADIUS: 200 * 0.75,
	VIEW_RADIUS: 1600,
	CAMP_RADIUS: 4,
	TEAM_COUNT: 2,
	WALL_COST: 5,

	TEAM: {
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
		STRUCTURE: 'structure',
		CAMP: 'camp',
		BASE: 'base',
		CANT_BUILD: 'cant build',
		BOUNDARY: 'boundary',
	},

	MESSAGE: {
		JOIN: 'join',
		GAME_UPDATE: 'update_state',
		MOVEMENT: 'move',
		BUILD_WALL: 'build_wall',
		DEMOLISH_WALL: 'demolish_wall',
		SHOOT: 'shoot',
		ROTATE: 'rotate',
		RESPAWN: 'respawn',
		INITIALIZE: 'initialize_game',
		DISCONNECT: 'disconnect',
	},
});
