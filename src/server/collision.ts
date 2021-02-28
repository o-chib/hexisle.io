import Player from './../shared/player';
import Bullet from './../shared/bullet';
import Wall from '../shared/wall';
import { Quadtree, Rect, CollisionObject } from './quadtree';
const Constant = require('../shared/constants');

export default class CollisionDetection {
	quadtree: Quadtree;

	constructor() {
		this.quadtree = new Quadtree();
	}

	// runGlobalCollisionDetection(): void {}

	// detectCollision(): void {}

	playerBulletCollision(player: Player, bullets: Set<Bullet>): void {
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
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != player.teamNumber
			) {
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
	buildingBulletCollision(wall: Wall, bullets: Set<Bullet>): void {
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
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != wall.teamNumber
			) {
				wall.hp -= 10;
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

	zombieBulletPlayerCollision(): void {
		// future implementation
	}

	doesObjCollideWithWall(
		xPos: number,
		yPos: number,
		objectRadius: number
	): boolean {
		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				xPos - objectRadius,
				xPos + objectRadius,
				yPos + objectRadius,
				yPos - objectRadius
			),
			results
		);
		for (const result of results) {
			if (result.payload instanceof Wall) return true;
		}
		return false;
	}

	insertCollider(
		object: any,
		radius: number
	): void {
		this.quadtree.insertIntoQuadtree(
			new CollisionObject(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius,
				object
			)
		);
	}

	deleteCollider(
		object: any,
		radius: number
	): void {
		this.quadtree.deleteFromQuadtree(
			new CollisionObject(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius,
				object
			)
		);
	}

	updateCollider(
		object: any,
		radius: number
	): void {
		this.quadtree.updateInQuadtree(
			new CollisionObject(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius,
				object
			)
		);
	}
}
