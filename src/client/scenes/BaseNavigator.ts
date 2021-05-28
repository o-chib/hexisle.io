import { Constant } from '../../shared/constants';
import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';

export default class BaseNavigator {
	private indicator_icon: Phaser.GameObjects.Image;
	private screen: { width: number; height: number; };
	private playerPosition: { x: number, y: number};
	private basePosition: {x: number, y : number};

	constructor() {
		return;
	}

	public createNavigator(scene: Phaser.Scene, icon_name: string, viewport_width: number = 1920, viewport_height: number = 1080) : void{
		this.indicator_icon = scene.add
			.image(viewport_width/2, viewport_height/2, icon_name)
			.setOrigin(0.5, 1)
			.setDepth(Constant.SPRITE_DEPTH.UI);
		this.indicator_icon.setScale(0.3);

		this.indicator_icon.setVisible(false);

		this.screen = {width:viewport_width * 0.90,height:viewport_height*0.80};
	}

	private isTargetOnScreen(): boolean{
		// Shift player to origin and get new relative coordinate to base using vector difference
		let difference = this.shiftVectorToOrigin();

		// Origin is our screen center
		if((difference.x > this.screen.width/2) || (difference.x < (-1 * this.screen.width/2))) {
			return false;
		}
		if((difference.y > this.screen.height/2) || (difference.y < (-1 * this.screen.height/2))) {
			return false;
		}
		return true;
	}
	private shiftVectorToOrigin(){
		let difference = {
			x: this.basePosition.x - this.playerPosition.x,
			y: (this.basePosition.y - this.playerPosition.y) * -1 // Engine has lower screen have positive values.
		}
		return difference;
	}

	private getSlope(): number{
		// Assume origin is center of screen
		// y = mx
		let difference = this.shiftVectorToOrigin();
		return difference.y/difference.x;
	}

	private getCoordAtRightEdge(): { x: number; y: number; }{
		let x = this.screen.width/2;
		let y = this.getSlope() * x;

		return {x:x, y:y};
	}

	private getCoordAtLeftEdge(): { x: number; y: number; }{
		let x = -1 * this.screen.width/2;
		let y = this.getSlope() * x;

		return {x:x, y:y};
	}

	private getCoordAtTopEdge(): { x: number; y: number; }{
		let y = this.screen.height/2;
		let x = y / this.getSlope();

		return {x:x, y:y};
	}

	private getCoordAtBottomEdge(): { x: number; y: number; }{
		let y = this.screen.height/2;
		let x = y / this.getSlope();

		return {x:x, y:y};
	}

	private convertToScreenSystemTopHalf(coord : {x:number, y:number}){
		coord.y *= -1;

		return coord;
	}
	private convertToScreenSystemBottomHalf(coord : {x:number, y:number}){
		coord.x *= -1;

		return coord;
	}

	private getCoordAtBoxEdge(){
		let difference = this.shiftVectorToOrigin();

		console.log(this.playerPosition);
		console.log(this.basePosition);
		console.log(difference);

		// If base is in top half
		// As y is in inverted due to world coordinate system
		// Top half needs to flip y
		if(difference.y > 0) {
			let top = this.getCoordAtTopEdge();

			// if x coords are off screen, find left/right edge instead
			if(top.x > this.screen.width/2){
				let right = this.getCoordAtRightEdge();
				return this.convertToScreenSystemTopHalf(right);
			}else if(top.x < (-1 * this.screen.width/2)){
				let left = this.getCoordAtLeftEdge();
				return this.convertToScreenSystemTopHalf(left);
			}
			return this.convertToScreenSystemTopHalf(top);
		}
		// If base is in bottom halfwd
		if(difference.y < 0) {
			let bottom = this.getCoordAtBottomEdge();
			// if x coords are off screen, find left/right edge instead
			if(bottom.x > this.screen.width/2){
				let right = this.getCoordAtRightEdge();
				return this.convertToScreenSystemBottomHalf(right);
			}else if(bottom.x < (-1 * this.screen.width/2)){
				let left = this.getCoordAtLeftEdge();
				return this.convertToScreenSystemBottomHalf(left);
			}
			return this.convertToScreenSystemBottomHalf(bottom);
		}

		return {x:0,y:0};
	}

	public updateNavigator(base:{x:number, y:number}, player: {x: number, y : number}) : void{
		this.playerPosition = player;
		this.basePosition = base;

		if(this.isTargetOnScreen()){
			this.indicator_icon.setVisible(false);
		}
		else{
			this.indicator_icon.setVisible(true);

			let position = this.getCoordAtBoxEdge();
			console.log(position);

			let stringX = (position.x >=0)?('+'+position.x.toFixed(0)):position.x.toFixed(0);
			let stringY = (position.y >=0)?('+'+position.y.toFixed(0)):position.y.toFixed(0);
			let position_config ={
				centerX:'center'+stringX,
				centerY:'center'+stringY
			}
			console.log(position_config);
			new Anchor(this.indicator_icon, position_config);
		}

	}
}
