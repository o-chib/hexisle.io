import Player from './../shared/player';
import Bullet from './../shared/bullet';
import { Quadtree, Rect, CollisionObject } from './quadtree';
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
import Wall from '../shared/wall';
const Constant = require('../shared/constants');

export default class CollisionDetection {
	quadtree: Quadtree;

	constructor() {
		this.quadtree = new Quadtree();
	}

	runGlobalCollisionDetection(): void {}

	detectCollision(): void {}

	playerCollision(player: Player, bullets: Set<Bullet>): void {
		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				player.xPos - Constant.PLAYER_RADIUS,
				player.xPos + Constant.PLAYER_RADIUS,
				player.yPos + Constant.PLAYER_RADIUS,
				player.yPos - Constant.PLAYER_RADIUS
			),
			results
		);

		results.forEach((result) => {
			if (
				result.payload instanceof Player &&
				result.payload.id != player.id
			) {
				console.log(
					'player at',
					player.xPos,
					player.yPos,
					'is colliding with player at',
					result.payload.xPos,
					result.payload.yPos
				);
			} else if (
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != player.teamNumber
			) {
				console.log(
					'player at',
					player.xPos,
					player.yPos,
					'is colliding with bullet at',
					result.payload.xPos,
					result.payload.yPos
				);

				player.health -= 10;
				bullets.delete(result.payload);
				this.quadtree.deleteFromQuadtree(
					new CollisionObject(
						result.payload.xPos - Constant.BULLET_RADIUS,
						result.payload.xPos + Constant.BULLET_RADIUS,
						result.payload.yPos + Constant.BULLET_RADIUS,
						result.payload.yPos - Constant.BULLET_RADIUS,
						result.payload
					)
				);
			}
		});
	}

	// Wall/Turret based collision
	buildingCollision(wall: Wall, bullets: Set<Bullet>): void {
		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				wall.xPos - Constant.WALL_RADIUS,
				wall.xPos + Constant.WALL_RADIUS,
				wall.yPos + Constant.WALL_RADIUS,
				wall.yPos - Constant.WALL_RADIUS
			),
			results
		);

		results.forEach((result) => {
			if (
				result.payload instanceof Player &&
				result.payload.id != wall.id
			) {
				console.log(
					'wall at',
					wall.xPos,
					wall.yPos,
					'is colliding with player at',
					result.payload.xPos,
					result.payload.yPos
				);
			} else if (
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != wall.teamNumber
			) {
				console.log(
					'wall at',
					wall.xPos,
					wall.yPos,
					'is colliding with bullet at',
					result.payload.xPos,
					result.payload.yPos
				);

				bullets.delete(result.payload);
				this.quadtree.deleteFromQuadtree(
					new CollisionObject(
						result.payload.xPos - Constant.BULLET_RADIUS,
						result.payload.xPos + Constant.BULLET_RADIUS,
						result.payload.yPos + Constant.BULLET_RADIUS,
						result.payload.yPos - Constant.BULLET_RADIUS,
						result.payload
					)
				);
			}
		});
	}

	zombieCollision(): void {
		// future implementation
	}

	collidesWithWall(xPos: number, yPos: number): boolean {
		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				xPos - Constant.PLAYER_RADIUS,
				xPos + Constant.PLAYER_RADIUS,
				yPos + Constant.PLAYER_RADIUS,
				yPos - Constant.PLAYER_RADIUS
			),
			results
		);
		for (const result of results) {
			if (result.payload instanceof Wall) {
				console.log(
					'player at',
					xPos,
					yPos,
					'would collide with wall at',
					result.payload.xPos,
					result.payload.yPos
				);

				return true;
			}
		}
		return false;
	}

	insertCollider(object: any): void {
		// TODO: maybe save radius inside cases and do 'insertIntoQuadtree' in default
		if (object instanceof Player) {
			this.quadtree.insertIntoQuadtree(
				new CollisionObject(
					object.xPos - Constant.PLAYER_RADIUS,
					object.xPos + Constant.PLAYER_RADIUS,
					object.yPos + Constant.PLAYER_RADIUS,
					object.yPos - Constant.PLAYER_RADIUS,
					object
				)
			);
		} else if (object instanceof Bullet) {
			this.quadtree.insertIntoQuadtree(
				new CollisionObject(
					object.xPos - Constant.BULLET_RADIUS,
					object.xPos + Constant.BULLET_RADIUS,
					object.yPos + Constant.BULLET_RADIUS,
					object.yPos - Constant.BULLET_RADIUS,
					object
				)
			);
		} else if (object instanceof Wall) {
			this.quadtree.insertIntoQuadtree(
				new CollisionObject(
					object.xPos - Constant.WALL_RADIUS,
					object.xPos + Constant.WALL_RADIUS,
					object.yPos + Constant.WALL_RADIUS,
					object.yPos - Constant.WALL_RADIUS,
					object
				)
			);
			//} else if (object instanceof Zombie) {
		}
	}

	deleteCollider(object: any): void {
		// TODO: maybe save radius inside cases and do 'insertIntoQuadtree' in default
		if (object instanceof Player) {
			this.quadtree.deleteFromQuadtree(
				new CollisionObject(
					object.xPos - Constant.PLAYER_RADIUS,
					object.xPos + Constant.PLAYER_RADIUS,
					object.yPos + Constant.PLAYER_RADIUS,
					object.yPos - Constant.PLAYER_RADIUS,
					object
				)
			);
		} else if (object instanceof Bullet) {
			this.quadtree.deleteFromQuadtree(
				new CollisionObject(
					object.xPos - Constant.BULLET_RADIUS,
					object.xPos + Constant.BULLET_RADIUS,
					object.yPos + Constant.BULLET_RADIUS,
					object.yPos - Constant.BULLET_RADIUS,
					object
				)
			);
		} else if (object instanceof Wall) {
			this.quadtree.deleteFromQuadtree(
				new CollisionObject(
					object.xPos - Constant.WALL_RADIUS,
					object.xPos + Constant.WALL_RADIUS,
					object.yPos + Constant.WALL_RADIUS,
					object.yPos - Constant.WALL_RADIUS,
					object
				)
			);
			//} else if (object instanceof Zombie) {
		}
	}

	updateCollider(object: any): void {
		if (object instanceof Player) {
			this.quadtree.updateInQuadtree(
				new CollisionObject(
					object.xPos - Constant.PLAYER_RADIUS,
					object.xPos + Constant.PLAYER_RADIUS,
					object.yPos + Constant.PLAYER_RADIUS,
					object.yPos - Constant.PLAYER_RADIUS,
					object
				)
			);
		} else if (object instanceof Bullet) {
			this.quadtree.updateInQuadtree(
				new CollisionObject(
					object.xPos - Constant.BULLET_RADIUS,
					object.xPos + Constant.BULLET_RADIUS,
					object.yPos + Constant.BULLET_RADIUS,
					object.yPos - Constant.BULLET_RADIUS,
					object
				)
			);
		} else if (object instanceof Wall) {
			this.quadtree.updateInQuadtree(
				new CollisionObject(
					object.xPos - Constant.WALL_RADIUS,
					object.xPos + Constant.WALL_RADIUS,
					object.yPos + Constant.WALL_RADIUS,
					object.yPos - Constant.WALL_RADIUS,
					object
				)
			);
			//} else if (object instanceof Zombie) {
		}
	}
}
