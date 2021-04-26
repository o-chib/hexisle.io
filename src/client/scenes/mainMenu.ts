import mainScene from './mainScene';
import Utilities from "./Utilities";

export default class MainMenu extends Phaser.Scene {
    public static Name = "MainMenu";

    constructor() {
        super('MainMenu');
    }

    public preload(): void {
        // Preload as needed.
    }

    // On create
    public create(): void {
        Utilities.LogSceneMethodEntry("MainMenu", "create");
        var titleText = this.add.text(300, 10, 'Please enter your name', { color: 'white', fontSize: '20px '});

        const newGameText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "Start");
        newGameText
            .setFontFamily("monospace")
            .setFontSize(40)
            .setFill("#fff")
            .setAlign("center")
            .setOrigin(0.5);
        newGameText.setInteractive();
        newGameText.on("pointerdown", () => {
            this.loadMainScene();
        }, this);

        this.time.addEvent({
			// Run after ten seconds.
			delay: 10000,
			callback: this.loadMainScene,
			callbackScope: this,
			loop: false
		});
    }

    // Update logic
    public update(): void {
    }

    private loadMainScene(): void {
        this.scene.start(mainScene.Name);
    }
}