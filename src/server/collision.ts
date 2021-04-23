import Player from './../shared/player';
import Bullet from './../shared/bullet';
import Wall from '../shared/wall';
import Turret from '../shared/turret';
import Campfire from '../shared/campfire';
import Base from '../shared/base';
import { Quadtree, Rect, CollisionObject } from './quadtree';
import { Constant } from '../shared/constants';
import { Point } from '../shared/hexTiles';

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

	playerBulletCollision(player: Player, bullets: Set<Bullet>): void {
		if (player.health <= 0) {
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
				player.health -= 10;
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
				building.hp -= 10;
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

	zombieBulletPlayerCollision(): void {
		// future implementation
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
				// TODO replace Point with some better invisible collider when refactoring
				((result.payload instanceof Wall ||
					result.payload instanceof Point) &&
					this.doCirclesCollide(
						{ xPos: xPos, yPos: yPos },
						Constant.RADIUS.COLLISION.PLAYER,
						result.payload,
						Constant.RADIUS.COLLISION.WALL
					)) ||
				(result.payload instanceof Turret &&
					this.doCirclesCollide(
						{ xPos: xPos, yPos: yPos },
						Constant.RADIUS.COLLISION.PLAYER,
						result.payload,
						Constant.RADIUS.COLLISION.TURRET
					)) ||
				(result.payload instanceof Base &&
					this.doCirclesCollide(
						{ xPos: xPos, yPos: yPos },
						Constant.RADIUS.COLLISION.PLAYER,
						result.payload,
						Constant.RADIUS.COLLISION.BASE
					))
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
		let closestEnemy: any = null;
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
		let closestEnemyDirection = Constant.NO_ENEMIES;
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
		if (object instanceof Wall) {
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
		return 0;
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
