import Player from './objects/player';
import Bullet from './objects/bullet';
import Wall from './objects/wall';
import Turret from './objects/turret';
import Campfire from './objects/campfire';
import Base from './objects/base';
import { Quadtree, Rect, CollisionObject } from './quadtree';
import { Constant } from '../shared/constants';
import { Point } from '../shared/hexTiles';
import { MapResources } from './mapResources';
import { Resource } from './objects/resource';

export default class CollisionDetection {
	quadtree: Quadtree;

	constructor() {
		this.quadtree = new Quadtree();
	}

	campfirePlayerCollision(campfire: Campfire): void {
		const results: CollisionObject[] = [];
		// Get everything touching the campfires collider
		this.quadtree.searchQuadtree(
			new Rect(
				campfire.xPos - Constant.RADIUS.COLLISION.WALL,
				campfire.xPos + Constant.RADIUS.COLLISION.WALL,
				campfire.yPos + Constant.RADIUS.COLLISION.WALL,
				campfire.yPos - Constant.RADIUS.COLLISION.WALL
			),
			results
		);

		const playerCount: number[] = [];
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			playerCount[i] = 0;
		}
		results.forEach((result) => {
			if (
				result.payload instanceof Player &&
				this.doCirclesCollide(
					campfire,
					Constant.RADIUS.COLLISION.CAMP,
					result.payload,
					Constant.RADIUS.COLLISION.PLAYER
				)
			) {
				// Get number of players in each team
				playerCount[result.payload.teamNumber] += 1;
			}
		});

		campfire.updateCaptureState(playerCount);
	}

	playerBulletResourceCollision(
		player: Player,
		bullets: Set<Bullet>,
		mapResources: MapResources
	): void {
		if (!player.isAlive()) {
			return;
		}

		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				player.xPos - Constant.RADIUS.COLLISION.PLAYER,
				player.xPos + Constant.RADIUS.COLLISION.PLAYER,
				player.yPos + Constant.RADIUS.COLLISION.PLAYER,
				player.yPos - Constant.RADIUS.COLLISION.PLAYER
			),
			results
		);

		results.forEach((result) => {
			if (
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != player.teamNumber &&
				this.doCirclesCollide(
					player,
					Constant.RADIUS.COLLISION.PLAYER,
					result.payload,
					Constant.RADIUS.COLLISION.BULLET
				)
			) {
				player.hp -= Bullet.DAMAGE;
				bullets.delete(result.payload);
				this.quadtree.deleteFromQuadtree(
					new CollisionObject(
						result.payload.xPos - Constant.RADIUS.COLLISION.BULLET,
						result.payload.xPos + Constant.RADIUS.COLLISION.BULLET,
						result.payload.yPos + Constant.RADIUS.COLLISION.BULLET,
						result.payload.yPos - Constant.RADIUS.COLLISION.BULLET,
						result.payload
					)
				);
			} else if (
				result.payload instanceof Resource &&
				result.payload.dropAmount > 0 &&
				this.doCirclesCollide(
					player,
					Constant.RADIUS.PLAYER,
					result.payload,
					Constant.RADIUS.RESOURCE
				)
			) {
				player.updateResource(result.payload.dropAmount);
				mapResources.deleteResource(result.payload);
				this.quadtree.deleteFromQuadtree(
					new CollisionObject(
						result.payload.xPos - Constant.RADIUS.RESOURCE,
						result.payload.xPos + Constant.RADIUS.RESOURCE,
						result.payload.yPos + Constant.RADIUS.RESOURCE,
						result.payload.yPos - Constant.RADIUS.RESOURCE,
						result.payload
					)
				);
			}
		});
	}

	buildingBulletCollision(building: any, bullets: Set<Bullet>): void {
		const results: CollisionObject[] = [];
		const col_radius = this.getCollisionRadius(building);

		this.quadtree.searchQuadtree(
			new Rect(
				building.xPos - col_radius,
				building.xPos + col_radius,
				building.yPos + col_radius,
				building.yPos - col_radius
			),
			results
		);

		results.forEach((result) => {
			if (
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != building.teamNumber &&
				this.doCirclesCollide(
					building,
					col_radius,
					result.payload,
					Constant.RADIUS.COLLISION.BULLET
				)
			) {
				building.hp -= Bullet.DAMAGE;
				bullets.delete(result.payload);
				this.quadtree.deleteFromQuadtree(
					new CollisionObject(
						result.payload.xPos - Constant.RADIUS.COLLISION.BULLET,
						result.payload.xPos + Constant.RADIUS.COLLISION.BULLET,
						result.payload.yPos + Constant.RADIUS.COLLISION.BULLET,
						result.payload.yPos - Constant.RADIUS.COLLISION.BULLET,
						result.payload
					)
				);
			}
		});
	}

	doesObjCollideWithStructure(
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
			if (
				this.isStructure(result.payload) &&
				this.doCirclesCollide(
					{ xPos: xPos, yPos: yPos },
					Constant.RADIUS.COLLISION.PLAYER,
					result.payload,
					this.getCollisionRadius(result.payload)
				)
			)
				return true;
		}
		return false;
	}

	doesObjCollideWithPlayers(
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
			if (
				result.payload instanceof Player &&
				this.doCirclesCollide(
					{ xPos: xPos, yPos: yPos },
					objectRadius,
					result.payload,
					Constant.RADIUS.COLLISION.PLAYER
				)
			)
				return true;
		}
		return false;
	}

	findDirectionOfClosestEnemy(object: any, objectRange: number): number {
		// Get everything in range
		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				object.xPos - objectRange,
				object.xPos + objectRange,
				object.yPos + objectRange,
				object.yPos - objectRange
			),
			results
		);

		// Go through the results and find the closest enemy
		let closestEnemy: Player | null = null;
		let closestEnemyDistance: number = objectRange + 1;
		for (const result of results) {
			if (
				result.payload instanceof Player &&
				result.payload.teamNumber != object.teamNumber &&
				this.doCirclesCollide(
					{ xPos: object.xPos, yPos: object.yPos },
					objectRange,
					result.payload,
					Constant.RADIUS.COLLISION.PLAYER
				)
			) {
				const xDiff: number = result.payload.xPos - object.xPos;
				const yDiff: number = result.payload.yPos - object.yPos;
				const distance: number = Math.sqrt(
					xDiff * xDiff + yDiff * yDiff
				);

				if (distance < closestEnemyDistance) {
					closestEnemy = result.payload;
					closestEnemyDistance = distance;
				}
			}
		}

		// Find the direction from the turret to the enemy if there is an enemy
		let closestEnemyDirection = Constant.DIRECTION.INVALID;
		if (closestEnemy != null) {
			closestEnemyDirection = Math.atan2(
				closestEnemy.yPos - object.yPos,
				closestEnemy.xPos - object.xPos
			);
		}
		return closestEnemyDirection;
	}

	doCirclesCollide(
		object1: any,
		radius1: number,
		object2: any,
		radius2: number
	): boolean {
		const centerDist: number = Math.sqrt(
			(object1.xPos - object2.xPos) ** 2 +
				(object1.yPos - object2.yPos) ** 2
		);
		if (centerDist > radius1 + radius2) {
			return false;
		} else {
			return true;
		}
	}

	getCollisionRadius(object: any): number {
		//TODO should be handled internally
		if (object instanceof Wall || object instanceof Point) {
			return Constant.RADIUS.COLLISION.WALL;
		} else if (object instanceof Turret) {
			return Constant.RADIUS.COLLISION.TURRET;
		} else if (object instanceof Base) {
			return Constant.RADIUS.COLLISION.BASE;
		} else if (object instanceof Player) {
			return Constant.RADIUS.COLLISION.PLAYER;
		} else if (object instanceof Bullet) {
			return Constant.RADIUS.COLLISION.BULLET;
		}
		throw new Error('Invalid Object.');
	}

	isStructure(object: any) {
		//TODO should be handled internally
		return (
			object instanceof Wall ||
			object instanceof Point ||
			object instanceof Turret ||
			object instanceof Base
		);
	}

	insertCollider(object: any, radius: number): void {
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

	deleteCollider(object: any, radius: number): void {
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

	updateCollider(object: any, radius: number): void {
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
