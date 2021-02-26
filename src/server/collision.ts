import Player from './../shared/player';
import Bullet from './../shared/bullet';
import { Quadtree, Rect, CollisionObject } from './quadtree';
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
const Constant = require('../shared/constants');

export default class CollisionDetection {

    // Variables
    quadtree: Quadtree;

    constructor() {
        // default stuff
        this.quadtree = new Quadtree();
    }

    runGlobalCollisionDetection(): void {

    }

    detectCollision(): void {
        
    }

    playerCollision(player: Player, bullets: Set<Bullet>): void {
        let results: CollisionObject[] = [];
        this.quadtree.searchQuadtree(new Rect(player.xPos - Constant.PLAYER_RADIUS,
													player.xPos + Constant.PLAYER_RADIUS,
                                        			player.yPos + Constant.PLAYER_RADIUS,
													player.yPos - Constant.PLAYER_RADIUS),
                                        			results);

        results.forEach((result) => {
            if (result.payload instanceof Player && 
                result.payload.id != player.id) {
                
                console.log("player at", player.xPos, player.yPos,
                            "is colliding with player at",
                            result.payload.xPos, result.payload.yPos);

            } else if (result.payload instanceof Bullet &&
                        result.payload.id == result.payload.id &&
                        result.payload.teamNumber != player.teamNumber) {
                    
                console.log("player at", player.xPos, player.yPos,
                                	"is colliding with bullet at",
                                	result.payload.xPos, result.payload.yPos);

                bullets.delete(result.payload);
                this.quadtree.deleteFromQuadtree(new CollisionObject(result.payload.xPos - Constant.BULLET_RADIUS,
																		result.payload.xPos + Constant.BULLET_RADIUS,
                                                    					result.payload.yPos + Constant.BULLET_RADIUS, 
																		result.payload.yPos - Constant.BULLET_RADIUS,
                                                    					result.payload));
            }
		});
    }

    // Wall based collision
    buildingCollision() {

    }

    zombieCollision() {
        // future implementation
    }

    insertCollider(object: any): void {
        switch(object) { // TODO: maybe save radius inside cases and do 'insertIntoQuadtree' in default
            case object instanceof Player: {
                this.quadtree.insertIntoQuadtree(new CollisionObject(object.xPos - Constant.PLAYER_RADIUS,
                                                                        object.xPos + Constant.PLAYER_RADIUS,
                                                                        object.yPos + Constant.PLAYER_RADIUS,
                                                                        object.yPos - Constant.PLAYER_RADIUS,
                                                                        object));
                break; 
            }
            case object instanceof Bullet: { 
                this.quadtree.insertIntoQuadtree(new CollisionObject(object.xPos - Constant.BULLET_RADIUS, 
                                                                        object.xPos + Constant.BULLET_RADIUS,
                                                                        object.yPos + Constant.BULLET_RADIUS, 
                                                                        object.yPos - Constant.BULLET_RADIUS, 
                                                                        object));
                break;
            } 
            case object instanceof Tile: {
                //TODO: add walls, turrets, etc
                break; 
            }
            // case object instanceof Zombie: {
                // break;
            // } 
            default: {
                // TODO: maybe handle error detection
                break; 
            }
        }
    }

    deleteCollider(object: any): void {
        switch(object) { // TODO: maybe save radius inside cases and do 'insertIntoQuadtree' in default
            case object instanceof Player: {
                this.quadtree.deleteFromQuadtree(new CollisionObject(object.xPos - Constant.PLAYER_RADIUS,
                                                                        object.xPos + Constant.PLAYER_RADIUS,
                                                                        object.yPos + Constant.PLAYER_RADIUS,
                                                                        object.yPos - Constant.PLAYER_RADIUS,
                                                                        object));
                break; 
            }
            case object instanceof Bullet: {
                this.quadtree.deleteFromQuadtree(new CollisionObject(object.xPos - Constant.BULLET_RADIUS, 
                                                                        object.xPos + Constant.BULLET_RADIUS,
                                                                        object.yPos + Constant.BULLET_RADIUS, 
                                                                        object.yPos - Constant.BULLET_RADIUS, 
                                                                        object));
                break;
            }
            case object instanceof Tile: {
                //TODO: add walls, turrets, etc
                break; 
            }
            // case object instanceof Zombie: {
                // break;
            // } 
            default: {
                // TODO: maybe handle error detection
                break; 
            }
        }
    }

    updateCollider(object: any): void {
        switch(object) { // TODO: maybe save radius inside cases and do 'insertIntoQuadtree' in default
            case object instanceof Player: {
                this.quadtree.updateInQuadtree(new CollisionObject(object.xPos - Constant.PLAYER_RADIUS,
                                                                        object.xPos + Constant.PLAYER_RADIUS,
                                                                        object.yPos + Constant.PLAYER_RADIUS,
                                                                        object.yPos - Constant.PLAYER_RADIUS,
                                                                        object));
                break; 
            }
            case object instanceof Bullet: { 
                this.quadtree.updateInQuadtree(new CollisionObject(object.xPos - Constant.BULLET_RADIUS, 
                                                                        object.xPos + Constant.BULLET_RADIUS,
                                                                        object.yPos + Constant.BULLET_RADIUS, 
                                                                        object.yPos - Constant.BULLET_RADIUS, 
                                                                        object));
                break;
            } 
            case object instanceof Tile: {
                //TODO: add walls, turrets, etc
                break; 
            }
            // case object instanceof Zombie: {
                // break;
            // } 
            default: {
                // TODO: maybe handle error detection
                break; 
            }
        }
    }
}


