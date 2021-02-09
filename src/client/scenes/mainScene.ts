import io from 'socket.io-client'
//import playerData from '../../shared/playerData';

const Constant = require('./../../shared/constants');

export default class MainScene extends Phaser.Scene {
	socket: SocketIOClient.Socket;

	constructor() {
		super('MainScene');
	}

	preload(): void {
		this.load.image('aliem', '../assets/Alien-thumb.jpg');
	}

	create(): void {
		this.socket = io();
		this.socket.emit('ready')
		this.socket.emit(Constant.message.JOIN, this.socket.id);
		this.socket.on("hello", () => {
			console.log("socket hello");
		});

  	}

  	update(): void {
  	}

	play = () => {
		this.socket.emit(Constant.message.JOIN, this.socket.id);
	};
}
