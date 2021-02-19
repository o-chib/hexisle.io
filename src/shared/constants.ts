module.exports = Object.freeze({
    // Player_Radius, Player_Hp, Player_Speed, Player_Fire_rate, Bullet_speed, Bullet damage
    DEFAULT_WIDTH: 10000,
    DEFAULT_HEIGHT: 10000,

    DIRECTION: {
        E:  0,
        NE: 0.25 * Math.PI, 
        N:  0.5 * Math.PI, 
        NW: 0.75 * Math.PI, 
        W:  Math.PI, 
        SW: 1.25 * Math.PI, 
        S:  1.5 * Math.PI, 
        SE: 1.75 * Math.PI
    },

    MESSAGE: {
        JOIN: 'join',
        GAME_UPDATE: 'update_state',
        MOVEMENT: 'move',
        SHOOT: 'shoot',
        ROTATE: 'rotate',
        
        TEMP_HIT: 'im_hit', //TODO this is temporary
    }
});