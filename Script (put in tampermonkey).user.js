// ==UserScript==
// @name           Krunker Junker
// @author         SkidLamer
// @source         https://github.com/e9x/kru/tree/master/junker
// @description    Junk in Your Krunk Guaranteed
// @version        1.0
// @license        gpl-3.0
// @namespace      https://greasyfork.org/users/704479
// @supportURL     https://e9x.github.io/kru/inv/
// @extracted      Fri, 11 Jun 2021 23:55:11 GMT
// @match          *://krunker.io/*
// @match          *://*.browserfps.com/*
// @match          *://linkvertise.com/*
// @run-at         document-start
// @connect        sys32.dev
// @connect        githubusercontent.com
// @icon           https://i.imgur.com/pA5e8hy.png
// @grant          none
// @noframes       temp
// ==/UserScript==

// Donations Accepted
// BTC:  3CsDVq96KgmyPjktUe1YgVSurJVe7LT53G
// ETH:  0x5dbF713F95F7777c84e6EFF5080e2f0e0724E8b1
// ETC:  0xF59BEbe25ECe2ac3373477B5067E07F2284C70f3
// Amazon Giftcard - skidlamer@mail.com

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./consts.js":
/*!*******************!*\
  !*** ./consts.js ***!
  \*******************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



var Utils = __webpack_require__(/*! ../sploit/libs/utils */ "../sploit/libs/utils.js"),
	API = __webpack_require__(/*! ../sploit/libs/api */ "../sploit/libs/api.js"),
	Updater = __webpack_require__(/*! ../sploit/libs/updater.js */ "../sploit/libs/updater.js"),
	Main = __webpack_require__(/*! ./main */ "./main.js"),
	utils = new Utils();

exports.meta = {
	script: 'https://y9x.github.io/userscripts/junker.user.js',
	github: 'https://github.com/e9x/kru/',
	discord: 'https://y9x.github.io/discord/',
	forum: 'https://forum.sys32.dev/',
};

exports.api_url = 'https://api.sys32.dev/';
exports.mm_url = 'https://matchmaker.krunker.io/';

exports.is_frame = window != window.top;
exports.extracted = typeof 1623455711074 != 'number' ? Date.now() : 1623455711074;

exports.krunker = utils.is_host(location, 'krunker.io', 'browserfps.com') && location.pathname == '/';

var main = new Main(exports.meta),
	updater = new Updater(exports.meta.script, exports.extracted),
	api = new API(exports.mm_url, exports.api_url);

if(!exports.is_frame){
	if(exports.krunker){
		// alerts shown prior to the window load event are cancelled
		if(typeof DO_UPDATES != 'boolean' || DO_UPDATES == true)window.addEventListener('load', () => updater.watch(() => {
			if(confirm('A new Sploit version is available, do you wish to update?'))updater.update();
		}, 60e3 * 3));
		
		api.observe();
	}

	api.license(exports.meta, typeof LICENSE_KEY == 'string' && LICENSE_KEY);
}

exports.main = main
exports.utils = utils;
exports.api = api;
exports.updater = updater;

/***/ }),

/***/ "./main.js":
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

 

var main,
	scripts,
	CRC2d = CanvasRenderingContext2D.prototype,
	Utils = __webpack_require__(/*! ./utils */ "./utils.js"),
	utils = new Utils();

class Main {
	constructor(meta) {
		this.hash = utils.genHash(8);
		__webpack_require__.g[this.hash] = this;
		
		this.utils = utils;
		
		this.settings = null;

		this.css = {
			hideAdverts: `#aContainer, #aHolder, #endAContainer, #aMerger { display: none !important; }`,
			noTextShadows: `*, .button.small, .bigShadowT { text-shadow: none !important; }`,
		};

		this.tabs = ['Render','Weapon','Player','GamePlay','Radio','Dev'];

		this.downKeys = new Set();
		this.nameTags = undefined;

		this.consts = {
			twoPI: Math.PI * 2,
			halfPI: Math.PI / 2,
			playerHeight: 11,
			cameraHeight: 1.5,
			headScale: 2,
			armScale: 1.3,
			armInset: 0.1,
			chestWidth: 2.6,
			hitBoxPad: 1,
			crouchDst: 3,
			recoilMlt: 0.3,
			nameOffset: 0.6,
			nameOffsetHat: 0.8,
		};

		this.key = {
			frame: 0,
			delta: 1,
			xdir: 2,
			ydir: 3,
			moveDir: 4,
			shoot: 5,
			scope: 6,
			jump: 7,
			reload: 8,
			crouch: 9,
			weaponScroll: 10,
			weaponSwap: 11,
			moveLock: 12
		};
		
		this.eventHandlers();
		
		this.discord = { guild: {} };
		
		fetch(new URL('code.txt', meta.discord), { cache: 'no-store' }).then(async res => {
			var code = await res.text();
			
			this.discord.code = code;
			
			Object.assign(this.discord, await(await fetch(`https://discord.com/api/v8/invites/${code}?with_counts=true`)).json());
		});
	}
	onInput(input) {
		if (!this.settings || !utils.isDefined(this.me)) return input;
		let isMelee = utils.isDefined(this.me.weapon.melee)&&this.me.weapon.melee||utils.isDefined(this.me.weapon.canThrow)&&this.me.weapon.canThrow;
		let ammoLeft = this.me[this.vars.ammos][this.me[this.vars.weaponIndex]];

		// autoReload
		if (this.settings.autoReload.val) {
			//let capacity = this.me.weapon.ammo;
			//if (ammoLeft < capacity)
			if (isMelee) {
				if (!this.me.canThrow) {
					//this.me.refillKnife();
				}
			} else if (!ammoLeft) {
				this.game.players.reload(this.me);
				input[this.key.reload] = 1;
				// this.me[this.vars.reloadTimer] = 1;
				//this.me.resetAmmo();
			}
		}

		//Auto Bhop
		if (this.settings.autoBhop.val && this.settings.autoBhop.val !== "off") {
			if (this.downKeys.has("Space") || this.settings.autoBhop.val == "autoJump" || this.settings.autoBhop.val == "autoSlide") {
				this.controls.keys[this.controls.binds.jump.val] ^= 1;
				if (this.controls.keys[this.controls.binds.jump.val]) {
					this.controls.didPressed[this.controls.binds.jump.val] = 1;
				}
				if (this.downKeys.has("Space") || this.settings.autoBhop.val == "autoSlide") {
					if (this.me[this.vars.yVel] < -0.03 && this.me.canSlide) {
						setTimeout(() => {
							this.controls.keys[this.controls.binds.crouch.val] = 0;
						}, this.me.slideTimer||325);
						this.controls.keys[this.controls.binds.crouch.val] = 1;
						this.controls.didPressed[this.controls.binds.crouch.val] = 1;
					}
				}
			}
		}

		//Autoaim
		if (this.settings.autoAim.val !== "off") {
			this.ray.setFromCamera(this.vec2, this.renderer.fpsCamera);
			const playerMaps = []
			let target = null, targets = this.game.players.list.filter(enemy => {
				let hostile = undefined !== enemy[this.vars.objInstances] && enemy[this.vars.objInstances] && !enemy[this.vars.isYou] && !this.getIsFriendly(enemy) && enemy.health > 0 && this.getInView(enemy);
				if (hostile) playerMaps.push( enemy[this.vars.objInstances] );
				return hostile
			})

			if (this.settings.fovBoxSize.val !== 'off') {
				let scaledWidth = this.ctx.canvas.width / this.scale;
				let scaledHeight = this.ctx.canvas.height / this.scale;
				for (let i = 0; i < targets.length; i++) {
					const t = targets[i];
					const sp = this.world2Screen(new this.three.Vector3(t.x, t.y, t.z), scaledWidth, scaledHeight, t.height / 2);
					let fovBox = null;
					switch (this.settings.fovBoxSize.val) {
						case 'large':
							fovBox = [scaledWidth / 3, scaledHeight / 4, scaledWidth * (1 / 3), scaledHeight / 2]
							break;
							// medium
						case 'medium':
							fovBox = [scaledWidth * 0.4, scaledHeight / 3, scaledWidth * 0.2, scaledHeight / 3]
							break
							// small
						case 'small':
							fovBox = [scaledWidth * 0.45, scaledHeight * 0.4, scaledWidth * 0.1, scaledHeight * 0.2]
							break
					}
					if (sp.x >= fovBox[0] && sp.x <= (fovBox[0] + fovBox[2]) && sp.y >= fovBox[1] && sp.y < (fovBox[1] + fovBox[3])) {
						target = targets[i]
						break
					}
				}
			}

			else target = targets.sort((p1, p2) => this.getD3D(this.me.x, this.me.z, p1.x, p1.z) - this.getD3D(this.me.x, this.me.z, p2.x, p2.z)).shift();

			if (target) {
				let obj = target[this.vars.objInstances];
				let pos = obj.position.clone();
				let yDire = (this.getDir(this.me.z, this.me.x, pos.z||target.z, pos.x||target.x) || 0) * 1000;
				let xDire = ((this.getXDire(this.me.x, this.me.y, this.me.z, pos.x||target.x, pos.y||target.y - target[this.vars.crouchVal] * this.consts.crouchDst + this.me[this.vars.crouchVal] * this.consts.crouchDst + this.settings.aimOffset.val, pos.z||target.z) || 0) - this.consts.recoilMlt * this.me[this.vars.recoilAnimY]) * 1000;
				let inCast = this.ray.intersectObjects(playerMaps, true).length//this.ray.intersectObjects(this.game.map.objects, true, obj) == obj;

				let vis = pos.clone();
				vis.y += this.consts.playerHeight + this.consts.nameOffset - (target[this.vars.crouchVal] * this.consts.crouchDst);
				if (target.hatIndex >= 0) vis.y += this.consts.nameOffsetHat;
				let dstDiv = Math.max(0.3, (1 - (this.getD3D(this.me.x, this.me.y, this.me.z, vis.x, vis.y, vis.z) / 600)));
				let fSize = (20 * dstDiv);
				let visible = (fSize >= 1 && this.containsPoint(vis));

				if (this.me.weapon[this.vars.nAuto] && this.me[this.vars.didShoot]) {
					input[this.key.shoot] = 0;
					input[this.key.scope] = 0;
					this.me.inspecting = false;
					this.me.inspectX = 0;
				}
				else if (!visible && this.settings.frustrumCheck.val) this.resetLookAt();
				else if (ammoLeft||isMelee) {
					//input[this.key.scope] = this.settings.autoAim.val === "assist" || this.settings.autoAim.val === "correction" || this.settings.autoAim.val === "trigger" ? this.controls[this.vars.mouseDownR] : 0;
					switch (this.settings.autoAim.val) {
						case "quickScope":
							input[this.key.scope] = (!visible && this.settings.frustrumCheck.val)?0:1;
							if (!this.me[this.vars.aimVal]||this.me.weapon.noAim) {
								if (!this.me.canThrow||!isMelee) {
									this.lookDir(xDire, yDire);
									input[this.key.shoot] = 1;
								}
								input[this.key.ydir] = yDire
								input[this.key.xdir] = xDire
							}
							break;
						case "assist": case "easyassist":
							if (input[this.key.scope] || this.settings.autoAim.val === "easyassist") {
								if (!this.me.aimDir && visible || this.settings.autoAim.val === "easyassist") {
									if (!this.me.canThrow||!isMelee) {
										this.lookDir(xDire, yDire);
									}
									if (this.settings.autoAim.val === "easyassist" && this.controls[this.vars.mouseDownR]) input[this.key.scope] = 1;
									input[this.key.ydir] = yDire
									input[this.key.xdir] = xDire
								}
							}
							break;
						case "silent":
							input[this.key.scope] = (!visible && this.settings.frustrumCheck.val)?0:1;
							if (!this.me[this.vars.aimVal]||this.me.weapon.noAim) {
								if (!this.me.canThrow||!isMelee) input[this.key.shoot] = 1;
							} else input[this.key.scope] = 1;
							input[this.key.ydir] = yDire
							input[this.key.xdir] = xDire
							break;
						case "trigger":
							if (input[this.key.scope] && inCast) {
								input[this.key.shoot] = 1;
								input[this.key.ydir] = yDire
								input[this.key.xdir] = xDire
							}
							break;
						case "correction":
							if (input[this.key.shoot] == 1) {
								input[this.key.ydir] = yDire
								input[this.key.xdir] = xDire
							}
							break;
						default:
							this.resetLookAt();
							break;
					}
				}
			} else {
				this.resetLookAt();
			}
		}
		
		return input;
	}

	onRender() {
		let main = this;
		let scaledWidth = this.ctx.canvas.width / this.scale;
		let scaledHeight = this.ctx.canvas.height / this.scale;
		let playerScale = (2 * this.consts.armScale + this.consts.chestWidth + this.consts.armInset) / 2
		let worldPosition = this.renderer.camera[this.vars.getWorldPosition]();
		let espVal = this.settings.renderESP.val;
		
		for (let iter = 0, length = this.game.players.list.length; iter < length; iter++) {
			let player = this.game.players.list[iter];
			if (!player || player[this.vars.isYou] || !player.active || !utils.isDefined(player[this.vars.objInstances]) ) {
				continue;
			}

			let isEnemy = !this.me.team || this.me.team != player.team;
			let isRisky = player.isDev || player.isMod || player.isMapMod || player.canGlobalKick || player.canViewReports || player.partnerApp || player.canVerify || player.canTeleport || player.kpdData || player.fakeName || player.level >= 100;

			// Chams
			if (!player[this.vars.objInstances].visible) {
				Object.defineProperty(player[this.vars.objInstances], 'visible', {
					value: true,
					writable: false
				});
			} else {
				player[this.vars.objInstances].traverse(obj => {
					if (obj && obj.type=='Mesh' && obj.hasOwnProperty('material')) {
						if (!obj.hasOwnProperty('_material')) {
							obj._material = obj.material;
						} else {
							Object.defineProperty(obj, 'material', {
								get() {
									if (utils.isDefined(main.mesh) && main.settings.renderChams.val) {
										return main.mesh[ isEnemy ? isRisky ? "#FFFF00" : main.settings.rainbowColor.val ? main.overlay.rainbow.col : main.settings.chamHostileCol.val||"#ff0000" : main.settings.chamFriendlyCol.val||"#00ff00"];
									}
									return this._material;
								}, set(val) {return this._material}
							});
						}

						obj.material.wireframe = !!main.settings.renderWireFrame.val;
					}
				})
			}

			//ESP
			// the below variables correspond to the 2d box esps corners
			let xmin = Infinity;
			let xmax = -Infinity;
			let ymin = Infinity;
			let ymax = -Infinity;
			let position = null;
			let br = false;
			for (let j = -1; !br && j < 2; j+=2) {
				for (let k = -1; !br && k < 2; k+=2) {
					for (let l = 0; !br && l < 2; l++) {
						if (position = player[this.vars.objInstances].position.clone()) {
							position.x += j * playerScale;
							position.z += k * playerScale;
							position.y += l * (player.height - player[this.vars.crouchVal] * this.consts.crouchDst);
							if (!this.containsPoint(position)) {
								br = true;
								break;
							}
							position.project(this.renderer.camera);
							xmin = Math.min(xmin, position.x);
							xmax = Math.max(xmax, position.x);
							ymin = Math.min(ymin, position.y);
							ymax = Math.max(ymax, position.y);
						}
					}
				}
			}

			if (br) {
				continue;
			}

			xmin = (xmin + 1) / 2;
			ymin = (ymin + 1) / 2;
			xmax = (xmax + 1) / 2;
			ymax = (ymax + 1) / 2;

			// save and restore these variables later so they got nothing on us
			const original_strokeStyle = this.ctx.strokeStyle;
			const original_lineWidth = this.ctx.lineWidth;
			const original_font = this.ctx.font;
			const original_fillStyle = this.ctx.fillStyle;

			//Tracers
			if (this.settings.renderTracers.val) {
				CRC2d.save.apply(this.ctx, []);
				let screenPos = this.world2Screen(player[this.vars.objInstances].position);
				this.ctx.lineWidth = 1;
				this.ctx.beginPath();
				this.ctx.moveTo(this.ctx.canvas.width/2, this.ctx.canvas.height - (this.ctx.canvas.height - scaledHeight));
				this.ctx.lineTo(screenPos.x, screenPos.y);
				this.ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
				this.ctx.stroke();
				this.ctx.lineWidth = 1;
				this.ctx.strokeStyle = isEnemy ? isRisky ? "#FFFF00" : main.settings.espHostileCol.val||"#ff0000" : main.settings.espFriendlyCol.val||"#00ff00"//this.settings.rainbowColor.val ? this.overlay.rainbow.col : "#eb5656"
				this.ctx.stroke();
				CRC2d.restore.apply(this.ctx, []);
			}

			CRC2d.save.apply(this.ctx, []);
			if (espVal == "twoD" || espVal == "full") {
				// perfect box esp
				this.ctx.lineWidth = 5;
				this.ctx.strokeStyle = isEnemy ? isRisky ? "#FFFF00" : main.settings.espHostileCol.val||"#ff0000" : main.settings.espFriendlyCol.val||"#00ff00"//this.settings.rainbowColor.val ? this.overlay.rainbow.col : "#eb5656"
				let distanceScale = Math.max(.3, 1 - this.getD3D(worldPosition.x, worldPosition.y, worldPosition.z, player.x, player.y, player.z) / 600);
				CRC2d.scale.apply(this.ctx, [distanceScale, distanceScale]);
				let xScale = scaledWidth / distanceScale;
				let yScale = scaledHeight / distanceScale;
				CRC2d.beginPath.apply(this.ctx, []);
				ymin = yScale * (1 - ymin);
				ymax = yScale * (1 - ymax);
				xmin = xScale * xmin;
				xmax = xScale * xmax;
				CRC2d.moveTo.apply(this.ctx, [xmin, ymin]);
				CRC2d.lineTo.apply(this.ctx, [xmin, ymax]);
				CRC2d.lineTo.apply(this.ctx, [xmax, ymax]);
				CRC2d.lineTo.apply(this.ctx, [xmax, ymin]);
				CRC2d.lineTo.apply(this.ctx, [xmin, ymin]);
				CRC2d.stroke.apply(this.ctx, []);

				if (espVal == "full") {
					// health bar
					this.ctx.fillStyle = "#000000";
					let barMaxHeight = ymax - ymin;
					CRC2d.fillRect.apply(this.ctx, [xmin - 7, ymin, -10, barMaxHeight]);
					this.ctx.fillStyle = player.health > 75 ? "green" : player.health > 40 ? "orange" : "red";
					CRC2d.fillRect.apply(this.ctx, [xmin - 7, ymin, -10, barMaxHeight * (player.health / player[this.vars.maxHealth])]);
					// info
					this.ctx.font = "Bold 48px Tahoma";
					this.ctx.fillStyle = "white";
					this.ctx.strokeStyle='black';
					this.ctx.lineWidth = 1;
					let x = xmax + 7;
					let y = ymax;
					CRC2d.fillText.apply(this.ctx, [player.name||player.alias, x, y]);
					CRC2d.strokeText.apply(this.ctx, [player.name||player.alias, x, y]);
					this.ctx.font = "Bold 30px Tahoma";
					this.ctx.fillStyle = "#cccccc";
					y += 35;
					CRC2d.fillText.apply(this.ctx, [player.weapon.name, x, y]);
					CRC2d.strokeText.apply(this.ctx, [player.weapon.name, x, y]);
					y += 35;
					this.ctx.fillStyle = player.health > 75 ? "green" : player.health > 40 ? "orange" : "red";
					CRC2d.fillText.apply(this.ctx, [player.health + ' HP', x, y]);
					CRC2d.strokeText.apply(this.ctx, [player.health + ' HP', x, y]);
				}
			}

			CRC2d.restore.apply(this.ctx, []);
			this.ctx.strokeStyle = original_strokeStyle;
			this.ctx.lineWidth = original_lineWidth;
			this.ctx.font = original_font;
			this.ctx.fillStyle = original_fillStyle;
		}

		if (this.settings.fovBoxSize.val !== 'off') {
			let fovBox = null;
			switch (this.settings.fovBoxSize.val) {
				case 'large':
					fovBox = [scaledWidth / 3, scaledHeight / 4, scaledWidth * (1 / 3), scaledHeight / 2]
					break;
					// medium
				case 'medium':
					fovBox = [scaledWidth * 0.4, scaledHeight / 3, scaledWidth * 0.2, scaledHeight / 3]
					break
					// small
				case 'small':
					fovBox = [scaledWidth * 0.45, scaledHeight * 0.4, scaledWidth * 0.1, scaledHeight * 0.2]
					break
			}
			CRC2d.save.apply(this.ctx, []);
			this.ctx.strokeStyle = "red"
			this.ctx.strokeRect(...fovBox)
			CRC2d.restore.apply(this.ctx, []);
		}
	}

	createSettings() {

		this.settings = {

			// Render

			renderESP: {
				tab: "Render",
				name: "Player ESP Type",
				val: "off",
				html: () =>
				this.generateSetting("select", "renderESP", {
					off: "Off",
					walls: "Walls",
					twoD: "2d",
					full: "Full"
				}),
				set: (value) => {
					this.nameTags=(value=="off")?undefined:true;
					this.noNameTags=(value=="full")?true:undefined;
				}
			},
			renderTracers: {
				tab: "Render",
				name: "Player Tracers",
				val: false,
				html: () => this.generateSetting("checkbox", "renderTracers"),
			},
			espHostileCol: {
				tab: "Render",
				name: "Hostile Color",
				val: "#ff0000",
				html: () => this.generateSetting("color", "espHostileCol"),
			},
			espFriendlyCol: {
				tab: "Render",
				name: "Friendly Color",
				val: "#00ff00",
				html: () => this.generateSetting("color", "espFriendlyCol"),
			},
			renderChams: {
				tab: "Render",
				pre: "<div class='separator'>Color Chams</div>",
				name: "Player Chams",
				val: false,
				html: () => this.generateSetting("checkbox", "renderChams") //+
			},
			renderWireFrame: {
				tab: "Render",
				name: "Player Wireframe",
				val: false,
				html: () => this.generateSetting("checkbox", "renderWireFrame"),
			},
			rainbowColor: {
				tab: "Render",
				name: "Rainbow Color",
				val: false,
				html: () => this.generateSetting("checkbox", "rainbowColor"),
			},
			chamHostileCol: {
				tab: "Render",
				name: "Hostile Color",
				val: "#ff0000",
				html: () => this.generateSetting("color", "chamHostileCol"),
			},
			chamFriendlyCol: {
				tab: "Render",
				name: "Friendly Color",
				val: "#00ff00",
				html: () => this.generateSetting("color", "chamFriendlyCol"),
			},
			hideAdverts: {
				tab: "Render",
				pre: "<div class='separator'>Krunker UI</div>",
				name: "Hide Advertisments",
				val: true,
				html: () => this.generateSetting("checkbox", "hideAdverts"),
				set: (value, init) => {
					if (value) this.mainCustomRule("insert", this.css.hideAdverts);
					else if (!init) this.mainCustomRule("delete", this.css.hideAdverts);
				}
			},
			hideStreams: {
				tab: "Render",
				name: "Hide Streams",
				val: false,
				html: () => this.generateSetting("checkbox", "hideStreams"),
				set: (value) => { this.displayStyle("streamContainer", value) }
			},
			hideMerch: {
				tab: "Render",
				name: "Hide Merch",
				val: false,
				html: () => this.generateSetting("checkbox", "hideMerch"),
				set: (value) => { this.displayStyle("merchHolder", value) }
			},
			hideNewsConsole: {
				tab: "Render",
				name: "Hide News Console",
				val: false,
				html: () => this.generateSetting("checkbox", "hideNewsConsole"),
				set: (value) => { this.displayStyle("newsHolder", value) }
			},
			hideCookieButton: {
				tab: "Render",
				name: "Hide Security Manage Button",
				val: false,
				html: () => this.generateSetting("checkbox", "hideCookieButton"),
				set: (value) => { this.displayStyle("onetrust-consent-sdk", value) }
			},
			//Rendering
			showSkidBtn: {
				tab: "Render",
				pre: "<hr>",
				name: "Show Menu Button",
				val: true,
				html: () => this.generateSetting("checkbox", "showSkidBtn"),
				set: (value, init) => {
					let button = document.getElementById("mainButton");
					if (!utils.isDefined(button)) utils.createButton("Junk", "https://i.imgur.com/pA5e8hy.png", this.toggleMenu, value)
					utils.waitFor(() => document.getElementById("mainButton")).then(button => { button.style.display = value ? "inherit" : "none" })
				}
			},
			customCSS: {
				tab: "Render",
				pre: "<hr>",
				name: "Custom CSS",
				val: "",
				html: () => this.generateSetting("url", "customCSS", "URL to CSS file"),
				css: document.createElement("link"),
				set: (value, init) => {
					if (value && value.startsWith("http")&&value.endsWith(".css")) {
						this.settings.customCSS.css.href = value
					} else this.settings.customCSS.css.href = null
					if (init && this.settings.customCSS.css) {
						this.settings.customCSS.css.rel = "stylesheet"
						try {
							document.getElementsByTagName('head')[0].appendChild(this.settings.customCSS.css)
						} catch(e) {
							console.error(e)
							this.settings.customCSS.css = null
						}
					}
				}
			},
			customBillboard: {
				tab: "Render",
				name: "Custom Billboard Text",
				val: "",
				html: () =>
				this.generateSetting(
					"text",
					"customBillboard",
					"Custom Billboard Text"
				),
			},

			// Weapon

			autoReload: {
				tab: "Weapon",
				//pre: "<br><div class='setHed'>Weapon</div>",
				name: "Auto Reload",
				val: false,
				html: () => this.generateSetting("checkbox", "autoReload"),
			},
			weaponZoom: {
				tab: "Weapon",
				name: "Weapon Zoom",
				val: 1.0,
				min: 0,
				max: 50.0,
				step: 0.01,
				html: () => this.generateSetting("slider", "weaponZoom"),
				set: (value) => utils.waitFor(() => this.renderer).then(renderer => renderer.adsFovMlt.fill(value))
			},
			weaponTrails: {
				tab: "Weapon",
				name: "Weapon Trails",
				val: false,
				html: () => this.generateSetting("checkbox", "weaponTrails"),
				set: (value) => utils.waitFor(() => this.me).then(me => { me.weapon.trail = value })
			},
			autoAim: {
				tab: "Weapon",
				pre: "<div class='separator'>Auto Aim</div>",
				name: "Auto Aim Type",
				val: "off",
				html: () =>
				this.generateSetting("select", "autoAim", {
					off: "Off",
					correction: "Aim Correction",
					assist: "Legit Aim Assist",
					easyassist: "Easy Aim Assist",
					silent: "Silent Aim",
					trigger: "Trigger Bot",
					quickScope: "Quick Scope"
				}),
			},

			fovBoxSize: {
				tab: "Weapon",
				name: "FOV Box Type",
				val: "off",
				html: () =>
				this.generateSetting("select", "fovBoxSize", {
					off: "Off",
					small: "Small",
					medium: "Medium",
					large: "Large"
				})
			},


			aimOffset: {
				tab: "Weapon",
				name: "Aim Offset",
				val: 0,
				min: -4,
				max: 1,
				step: 0.01,
				html: () => this.generateSetting("slider", "aimOffset"),
				set: (value) => { if (this.settings.playStream.audio) this.settings.playStream.audio.volume = value;}
			},
			frustrumCheck: {
				tab: "Weapon",
				name: "Player Visible Check",
				val: false,
				html: () => this.generateSetting("checkbox", "frustrumCheck"),
			},
			wallPenetrate: {
				tab: "Weapon",
				name: "Aim through Penetratables",
				val: false,
				html: () => this.generateSetting("checkbox", "wallPenetrate"),
			},

			// Player

			autoBhop: {
				tab: "Player",
				//pre: "<br><div class='setHed'>Player</div>",

				name: "Auto Bhop Type",
				val: "off",
				html: () => this.generateSetting("select", "autoBhop", {
					off: "Off",
					autoJump: "Auto Jump",
					keyJump: "Key Jump",
					autoSlide: "Auto Slide",
					keySlide: "Key Slide"
				}),
			},
			skinUnlock: {
				tab: "Player",
				name: "Unlock Skins",
				val: false,
				html: () => this.generateSetting("checkbox", "skinUnlock"),
			},

			// GamePlay

			autoActivateNuke: {
				tab: "GamePlay",
				name: "Auto Activate Nuke",
				val: false,
				html: () => this.generateSetting("checkbox", "autoActivateNuke"),
			},
			autoFindNew: {
				tab: "GamePlay",
				name: "New Lobby Finder",
				val: false,
				html: () => this.generateSetting("checkbox", "autoFindNew"),
			},
			autoClick: {
				tab: "GamePlay",
				name: "Auto Start Game",
				val: false,
				html: () => this.generateSetting("checkbox", "autoClick"),
			},
			noInActivity: {
				tab: "GamePlay",
				name: "No InActivity Kick",
				val: true,
				html: () => this.generateSetting("checkbox", "noInActivity"),
			},

			// Radio

			playStream: {
				tab: "Radio",
				//pre: "<br><div class='setHed'>Radio Stream Player</div>",
				name: "Stream Select",
				val: "off",
				html: () => this.generateSetting("select", "playStream", {
					off: 'Off',
					_2000s: 'General German/English',
					_HipHopRNB: 'Hip Hop / RNB',
					_Oldskool: 'Hip Hop Oldskool',
					_Country: 'Country',
					_Pop: 'Pop',
					_Dance: 'Dance',
					_Dubstep: 'DubStep',
					_Lowfi: 'LoFi HipHop',
					_Jazz: 'Jazz',
					_Oldies: 'Golden Oldies',
					_Club: 'Club',
					_Folk: 'Folk',
					_ClassicRock: 'Classic Rock',
					_Metal: 'Heavy Metal',
					_DeathMetal: 'Death Metal',
					_Classical: 'Classical',
					_Alternative: 'Alternative',
				}),
				set: (value) => {
					if (value == "off") {
						if ( this.settings.playStream.audio ) {
							this.settings.playStream.audio.pause();
							this.settings.playStream.audio.currentTime = 0;
							this.settings.playStream.audio = null;
						}
						return;
					}
					let url = this.settings.playStream.urls[value];
					if (!this.settings.playStream.audio) {
						this.settings.playStream.audio = new Audio(url);
						this.settings.playStream.audio.volume = this.settings.audioVolume.val||0.5
					} else {
						this.settings.playStream.audio.src = url;
					}
					this.settings.playStream.audio.load();
					this.settings.playStream.audio.play();
				},
				urls: {
					_2000s: 'http://0n-2000s.radionetz.de/0n-2000s.aac',
					_HipHopRNB: 'https://stream-mixtape-geo.ntslive.net/mixtape2',
					_Country: 'https://live.wostreaming.net/direct/wboc-waaifmmp3-ibc2',
					_Dance: 'http://streaming.radionomy.com/A-RADIO-TOP-40',
					_Pop: 'http://bigrradio.cdnstream1.com/5106_128',
					_Jazz: 'http://strm112.1.fm/ajazz_mobile_mp3',
					_Oldies: 'http://strm112.1.fm/60s_70s_mobile_mp3',
					_Club: 'http://strm112.1.fm/club_mobile_mp3',
					_Folk: 'https://freshgrass.streamguys1.com/irish-128mp3',
					_ClassicRock: 'http://1a-classicrock.radionetz.de/1a-classicrock.mp3',
					_Metal: 'http://streams.radiobob.de/metalcore/mp3-192',
					_DeathMetal: 'http://stream.laut.fm/beatdownx',
					_Classical: 'http://live-radio01.mediahubaustralia.com/FM2W/aac/',
					_Alternative: 'http://bigrradio.cdnstream1.com/5187_128',
					_Dubstep: 'http://streaming.radionomy.com/R1Dubstep?lang=en',
					_Lowfi: 'http://streams.fluxfm.de/Chillhop/mp3-256',
					_Oldskool: 'http://streams.90s90s.de/hiphop/mp3-128/',
				},
				audio: null,
			},

			audioVolume: {
				tab: "Radio",
				name: "Radio Volume",
				val: 0.5,
				min: 0,
				max: 1,
				step: 0.01,
				html: () => this.generateSetting("slider", "audioVolume"),
				set: (value) => { if (this.settings.playStream.audio) this.settings.playStream.audio.volume = value;}
			},

			// Dev

		   saveGameJsBtn: {
				tab: "Dev",
				name: "Save Game Script",
				val: false,
				html: () => this.generateSetting("button", "saveGameJsBtn", { label:"Save", function: `${this.hash}.globalCMD('save gameJS')`}),
			},
		}

		async function getSavedSettings() {

			async function getValue(key) {
				let value = await GM.getValue(key, "Fuck");
				if (value != "Fuck" && value != undefined) {
					return value;
				} else {
					return new Promise((resolve) => {
						window.setTimeout(() => resolve(getValue()), 10);
					})
				}
			}

			for (let key in main.settings) {
				const value = await getValue(key);
				main.settings[key].val = value !== null ? value : main.settings[key].val;
				main.settings[key].def = main.settings[key].val;
				if (main.settings[key].val == "false") main.settings[key].val = false;
				if (main.settings[key].val == "true") main.settings[key].val = true;
				if (main.settings[key].val == "undefined") main.settings[key].val = main.settings[key].def;
				if (main.settings[key].set) main.settings[key].set(main.settings[key].val, true);
			}

		}

		utils.waitFor(() => window.windows).then(() => {
			let win = window.windows[11]; win.html = "";
			win.header = utils.genHash(8);
			win.gen = ()=> {
				let tmpHTML = `<div class='wrapper'><div class="content"><div class="guild-icon" style="background-image: url(&quot;https://cdn.discordapp.com/icons/${this.discord.guild.id}/${this.discord.guild.icon}.webp?size=64&quot;);"></div><div class="guild-info" style="flex: 1 1 auto;"><div class="guild-name"> <a href="https://e9x.github.io/kru/inv">${this.discord.guild.name}</a> &nbsp;&nbsp;&nbsp;<div class="colorStandard size14 guildDetail"><div class="statusCounts"><i class="statusOnline status"></i><span class="count-30T-5k online-count">${this.discord.approximate_presence_count} Online</span>&nbsp;<i class="statusOffline status"></i><span class="count-30T-5k offline-count">${this.discord.approximate_member_count} Members</span></div></div></div></div><button type="button" class="d-button join-button" onmouseenter="playTick()" onclick="window.location.href='https://discord.com/invite/${this.discord.code}'"><div class="d-button-label">Join</div></button></div></div>`;
				tmpHTML += '<div class="tab">'; this.tabs.forEach(tab => { tmpHTML += `<button class="tablinks" onclick="${this.hash}.tabChange(event, '${tab}')">${tab}</button>` }); tmpHTML +='</div>'
				this.tabs.forEach(tab => {
					tmpHTML += `<div id="${tab}" class="tabcontent"> ${this.tabContent(tab)} </div>`
				})

				return tmpHTML
			}
			for (const key in this.settings) {
				this.settings[key].def = this.settings[key].val;
				if (!this.settings[key].disabled) {
					let tmpVal = this.getSavedVal(key);
					this.settings[key].val = tmpVal !== null ? tmpVal : this.settings[key].val;
					this.settings[key].val = this.settings[key].val;
					if (this.settings[key].val == "false") this.settings[key].val = false;
					if (this.settings[key].val == "true") this.settings[key].val = true;
					if (this.settings[key].val == "undefined") this.settings[key].val = this.settings[key].def;
					if (this.settings[key].set) this.settings[key].set(this.settings[key].val, true);
				}
			}
			//return getSavedSettings();
		})
	}

	toggleMenu() {
		let lock = document.pointerLockElement || document.mozPointerLockElement;
		if (lock) document.exitPointerLock();
		window.showWindow(12);
		if (utils.isDefined(window.SOUND)) window.SOUND.play(`tick_0`,0.1)
	}

	tabChange(evt, tabName) {
		var i, tabcontent, tablinks;
		tabcontent = document.getElementsByClassName("tabcontent");
		for (i = 0; i < tabcontent.length; i++) {
			tabcontent[i].style.display = "none";
		}
		tablinks = document.getElementsByClassName("tablinks");
		for (i = 0; i < tablinks.length; i++) {
			tablinks[i].className = tablinks[i].className.replace(" active", "");
		}
		document.getElementById(tabName).style.display = "block";
		evt.currentTarget.className += " active";
	}

	tabContent(name) {
		let tmpHTML = "";
		for (let key in this.settings) {
			if (this.settings[key].tab == name) {
				if (this.settings[key].pre) tmpHTML += this.settings[key].pre;
				tmpHTML += "<div class='settName' id='" + key + "_div' style='display:block'>" + this.settings[key].name + " " + this.settings[key].html() + "</div>";
			}
		}
		return tmpHTML;
	}

	globalCMD(cmd) {
		if (confirm(cmd)) {
			switch(cmd) {
				case "save gameJS": return utils.saveData("game_" + this.vars.build + ".js", this.gameJS);
			}
		}
	}

	generateSetting(type, name, extra) {
		switch (type) {
			case 'button':
				return `<input type="button" name="${type}" id="slid_utilities_${name}" class="settingsBtn" onclick="${extra.function}" value="${extra.label}" style="float:right;width:auto"/>`;
			case 'checkbox':
				return `<label class="switch"><input type="checkbox" onclick="${this.hash}.setSetting('${name}', this.checked)" ${this.settings[name].val ? 'checked' : ''}><span class="slider"></span></label>`;
			case 'slider':
				return `<span class='sliderVal' id='slid_utilities_${name}'>${this.settings[name].val}</span><div class='slidecontainer'><input type='range' min='${this.settings[name].min}' max='${this.settings[name].max}' step='${this.settings[name].step}' value='${this.settings[name].val}' class='sliderM' oninput="${this.hash}.setSetting('${name}', this.value)"></div>`
				case 'select': {
					let temp = `<select onchange="${this.hash}.setSetting(\x27${name}\x27, this.value)" class="inputGrey2">`;
					for (let option in extra) {
						temp += '<option value="' + option + '" ' + (option == this.settings[name].val ? 'selected' : '') + '>' + extra[option] + '</option>';
					}
					temp += '</select>';
					return temp;
				}
			default:
				return `<input type="${type}" name="${type}" id="slid_utilities_${name}"\n${'color' == type ? 'style="float:right;margin-top:5px"' : `class="inputGrey2" placeholder="${extra}"`}\nvalue="${this.settings[name].val}" oninput="${this.hash}.setSetting(\x27${name}\x27, this.value)"/>`;
		}
	}

	setSetting(key, value) {
		this.settings[key].val = value;
		//await GM.setValue(key, value);
		this.saveVal(key, value);
		if (document.getElementById(`slid_utilities_${key}`)) document.getElementById(`slid_utilities_${key}`).innerHTML = value;
		if (this.settings[key].set) this.settings[key].set(value);
	}

	saveVal(name, val) {
		localStorage.setItem("krk_"+name, val);
	}

	deleteVal(name) {
		localStorage.removeItem("krk_"+name);
	}

	getSavedVal(name) {
		return localStorage.getItem("krk_"+name);
	}

	async gameHooks() {
		let main = this;
		
		let exports = await utils.waitFor(() => this.exports);
		
		let toFind = {
			overlay: ["render", "canvas"],
			config: ["accAnnounce", "availableRegions", "assetCat"],
			three: ["ACESFilmicToneMapping", "TextureLoader", "ObjectLoader"],
		};
		
		for (let rootKey in exports) {
			let exp = exports[rootKey].exports;
			for (let name in toFind) {
				if (utils.objectHas(exp, toFind[name])) {
					console.info("Found Export ", name);
					delete toFind[name];
					this[name] = exp;
				}
			}
		}
		
		if (!(Object.keys(toFind).length === 0 && toFind.constructor === Object)) {
			for (let name in toFind) {
				alert("Failed To Find Export " + name);
			}
		} else {
			Object.defineProperties(this.config, {
				nameVisRate: {
					value: 0,
					writable: false
				},
				//serverBrowserRate: {
				//    value: 0,
				//    writable: false
				//},
				serverTickFrequency: {
					value: 60,
					writable: false
				},
				syncRate: {
					value: 0,
					writable: false
				},
				hitBoxPad: {
					value: 0,
					writable: false
				},
			});

			this.ray = new this.three.Raycaster();
			this.vec2 = new this.three.Vector2(0, 0);
			this.mesh = new Proxy({}, {
				get(target, prop){
					if(!target[prop]) {
						target[prop] = new main.three.MeshBasicMaterial({
							transparent: true,
							fog: false,
							depthTest: false,
							color: prop,
						});
					}
					return target[prop] ;
				},
			});

			this.ctx = this.overlay.canvas.getContext('2d');
			this.overlay.render = new Proxy(this.overlay.render, {
				apply: (target, that, args) => {
					return [target.apply(that, args), this.overlayRender(args, ...args)]
				}
			});
		}


		const $origSkins = Symbol("origSkins"), $localSkins = Symbol("localSkins");
		Object.defineProperties(Object.prototype, {
			skins: {
				set(fn) {
					//console.log(this.toString())
					//console.log(this)
					this[$origSkins] = fn;
					if (void 0 == this[$localSkins] || !this[$localSkins].length) {
						this[$localSkins] = Array.apply(null, Array(5e3)).map((x, i) => {
							return {
								ind: i,
								cnt: 0x1,
							}
						})
					}
					return fn;
				},
				get() {
					return main.settings.skinUnlock.val && this.stats ? this[$localSkins] : this[$origSkins];
				}
			},
		})
		
		utils.waitFor(() => this.ws).then(() => {
			this.wsEvent = this.ws._dispatchEvent.bind(this.ws);
			this.wsSend = this.ws.send.bind(this.ws);
			this.ws.send = new Proxy(this.ws.send, {
				apply: function(target, that, [type, ...msg]) {
					if (type=="ah2") return;
					if (type=="en") {
						let data = msg[0];
						if (data) {
							main.skinData = Object.assign({}, {
								main: data[2][0],
								secondary: data[2][1],
								hat: data[3],
								body: data[4],
								knife: data[9],
								dye: data[14],
								waist: data[17],
							});
						}
					}

					return target.apply(that, [type, ...msg]);
				}
			})

			this.ws._dispatchEvent = new Proxy(this.ws._dispatchEvent, {
				apply: function(target, that, [type, ...msg]) {
					if (type =="init") {
						let pInfo = msg[0];
						if(pInfo[10] && pInfo[10].bill && main.settings && main.settings.customBillboard.val.length > 1) {
							pInfo[10].bill.txt = main.settings.customBillboard.val;
						}
					}

					if (type=="0") {
						let pData = msg[0][0];
						let pSize = 39;
						while (pData.length % pSize !== 0) pSize++;
						for(let i = 0; i < pData.length; i += pSize) {
							if (pData[i] === main.ws.socketId||0) {
								pData[i + 12] = [main.skinData.main, main.skinData.secondary];
								pData[i + 13] = main.skinData.hat;
								pData[i + 14] = main.skinData.body;
								pData[i + 19] = main.skinData.knife;
								pData[i + 24] = main.skinData.dye;
								pData[i + 33] = main.skinData.waist;
							}
						}
					}
					if (type=="3") {
						if (msg[0][4]) {
							msg[0][4].wId=0;
							msg[0][4].hs=true;
							 msg[0][4].dst=Infinity
							msg[0][4].wb=true;
						}

					}
					
					return target.apply(that, [type, ...msg]);
				}
			})
		})
	}
	
	overlayRender(renderArgs, scale, game, controls, renderer, me){
		let width = this.overlay.canvas.width / scale;
		let height = this.overlay.canvas.height / scale;
		
		if (controls && typeof this.settings == "object" && this.settings.noInActivity.val) {
			controls.idleTimer = 0;
			if (utils.isDefined(this.config)) this.config.kickTimer = Infinity;
		}
		if (me) {
			if (me.active && me.health) controls.update();
			if (me.banned) Object.assign(me, {banned: false});
			if (me.isHacker) Object.assign(me, {isHacker: 0});
			if (me.kicked) Object.assign(me, {kicked: false});
			if (me.kickedByVote) Object.assign(me, {kickedByVote: false});
			me.account = Object.assign(me, {premiumT: true});
			
			["scale", "game", "controls", "renderer", "me"].forEach((item, index)=>{
				this[item] = renderArgs[index];
			});
			this.ctx.save();
			this.ctx.scale(scale, scale);
			// this.ctx.clearRect(0, 0, width, height);
			this.onRender();
			this.ctx.restore();
		}
		
		if (utils.isType(this.settings, 'object')) {
			if (this.settings.hasOwnProperty('autoActivateNuke') && this.settings.autoActivateNuke.val) {
				if (this.me && Object.keys(this.me.streaks).length) this.wsSend("k", 0);
			}
			if (this.settings.hasOwnProperty('autoClick') && this.settings.autoClick.val) {
				if (window.endUI.style.display == "none" && window.windowHolder.style.display == "none") controls.toggle(true);
			}
		}
	}
	
	async gameLoad(source, tokenPromise){
		this.gameJS = source;
		
		this.vars = utils.getData(this.gameJS, {
			build: { regex: /\.exports='(\w{5})'/, index: 1 },
			inView: { regex: /&&!\w\.\w+&&\w\.\w+&&\w\.(\w+)\){/, index: 1 },
			spectating: { regex: /team:window\.(\w+)/, index: 1 },
			//inView: { regex: /\]\)continue;if\(!\w+\['(.+?)\']\)continue;/, index: 1 },
			//canSee: { regex: /\w+\['(\w+)']\(\w+,\w+\['x'],\w+\['y'],\w+\['z']\)\)&&/, index: 1 },
			procInputs: { regex: /this\.(\w+)=function\(\w+,\w+,\w+,\w+\){this\.recon/, index: 1 },
			aimVal: { regex: /this\.(\w+)-=1\/\(this\.weapon\.aimSpd/, index: 1 },
			pchObjc: { regex: /0,this\.(\w+)=new \w+\.Object3D,this/, index: 1 },
			didShoot: { regex: /--,\w+\.(\w+)=!0/, index: 1 },
			nAuto: { regex: /'Single Fire',varN:'(\w+)'/, index: 1 },
			crouchVal: { regex: /this\.(\w+)\+=\w\.crouchSpd\*\w+,1<=this\.\w+/, index: 1 },
			recoilAnimY: { regex: /\.\w+=0,this\.(\w+)=0,this\.\w+=0,this\.\w+=1,this\.slide/, index: 1 },
			ammos: { regex: /length;for\(\w+=0;\w+<\w+\.(\w+)\.length/, index: 1 },
			weaponIndex: { regex: /\.weaponConfig\[\w+]\.secondary&&\(\w+\.(\w+)==\w+/, index: 1 },
			isYou: { regex: /this\.accid=0,this\.(\w+)=\w+,this\.isPlayer/, index: 1 },
			objInstances: { regex: /\w+\.\w+\(0,0,0\);if\(\w+\.(\w+)=\w+\.\w+/, index: 1 },
			getWorldPosition: { regex: /var \w+=\w+\.camera\.(\w+)\(\);/, index: 1 },
			mouseDownR: { regex: /this\.(\w+)=0,this\.keys=/, index: 1 },
			maxHealth: { regex: /\.regenDelay,this\.(\w+)=\w+\.mode&&\w+\.mode\.\1/, index: 1 },
			xDire: { regex: /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.xD/, index: 1 },
			yDire: { regex: /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.yD/, index: 1 },
			//xVel: { regex: /this\['x']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedX']/, index: 1 },
			yVel: { regex: /this\.(\w+)=this\.\w+,this\.visible/, index: 1 },
			//zVel: { regex: /this\['z']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedZ']/, index: 1 },
		});
		
		console.log(this.vars);
		
		var patched = utils.patchData(this.gameJS, {
			exports: {regex: /(,(\w+)\(\2\.s=\d+\))(}\(\[)/, patch: `$1,${this.hash}.exports=$2.c$3`},
			inputs: {regex: /(\w+\.\w+\.\w+\?'\w+':'push'\]\()(\w+)\),/, patch: `$1${this.hash}.onInput($2)),`},
			inView: {regex: /&&(\w+\.\w+)\){(if\(\(\w+=\w+\.\w+\.\w+\.\w+)/, patch: `){if(void 0!==${this.hash}.noNameTags||!$1&&void 0 == ${this.hash}.nameTags)continue;$2`},
			socket: {regex: /this\.\w+=new WebSocket\(\w+\)/, patch: `${this.hash}.ws=this;$&`},
			isHacker:{regex: /(window\.\w+=)!0\)/, patch: `$1!1)`},
			respawnT:{regex: /\w+:1e3\*/g, patch: `respawnT:0*`},
			anticheat1:{regex: /&&\w+\(\),window\.utilities&&\(\w+\(null,null,null,!0\),\w+\(\)\)/, patch: ""},
			anticheat3:{regex: /windows\.length>\d+.*?37/, patch: `37`},
			commandline:{regex: /Object\.defineProperty\(console.*?\),/, patch: ""},
		});
		
		new Function("WP_fetchMMToken", this.hash, patched)(tokenPromise, this);
	}

	mainCustomRule(action, rule) {
		utils.waitFor(() => this.mainCustom).then(() => {
			const rules = this.mainCustom.cssRules;
			if (action == "insert") this.mainCustom.insertRule(rule);
			else if (action == "delete") {
				for (let i = 0; i < rules.length; i++) {
					if (rules[i].cssText == rule) {
						this.mainCustom.deleteRule(i);
					}
				}
			} else console.error(action + " not Implemented for mainCustomRule")
		})
	}
	
	displayStyle(el, val) {
		utils.waitFor(() => window[el], 5e3).then(node => {
			if (node) node.style.display = val ? "none" : "inherit";
			else log.error(el, " was not found in the window object");
		})
	}

	stylesheets() {
		// Get Main Custom CSS
		new Array(...document.styleSheets).map(css => {
			if (css.href) {
				let arr = /http.*?krunker.io\/css\/(\w+.css).+/.exec(css.href);
				if (arr && arr[1]) {
					let name = arr[1];
					if (name && name.includes("main_custom")) {
						this.mainCustom = css;
					}
				}
			}
		})
		let css = {
			tabStyle: '.tab { overflow: hidden; border: 1px solid #ccc; background-image: linear-gradient(#2f3136, #f1f1f1, #2f3136); }',
			btnStyle: '.tab button { background-color: inherit; float: left; border: none; outline: solid; cursor: pointer; padding: 14px 16px; transition: 0.3s; font-size: 17px; font-weight:500;color:black;text-shadow: 2px 2px #FFF;}',
			btnHoverStyle: '.tab button:hover { background-color: #ddd; }',
			activeTabStyle: '.tab button.active { background-color: #ccc; }',
			tabContentStyle: '.tabcontent { display: none; padding: 6px 12px; border: 1px solid #ccc; border-top: none; animation: fadeEffect 1s; /* Fading effect takes 1 second */}',
			zeroToFullOpacity: '@keyframes fadeEffect { from {opacity: 0;} to {opacity: 1;} }',

			separator: `.separator{display:flex;align-items:center;text-align:center}.separator::before,.separator::after{content:'';flex:1;border-bottom:1px solid #000}.separator:not(:empty)::before{margin-right:.25em}.separator:not(:empty)::after{margin-left:.25em}`,

			discordWrapper: `.wrapper{background:#2f3136;width:100%;}`,
			discordContent: `.content{display:flex;-webkit-box-orient:horizontal;-webkit-box-direction:normal;flex-flow:row nowrap}`,
			discordInfo: `.guild-info{flex:1 1 auto;min-width:1px;-webkit-box-orient:vertical;-webkit-box-direction:normal;flex-direction:column;flex-wrap:nowrap;display:flex;align-items:stretch;-webkit-box-align:stretch;justify-content:center;text-indent:0}`,
			discordIcon: `.guild-icon{background-color:#333;margin-right:16px;flex:0 0 auto;width:50px;height:50px;border-radius:15px;position:relative;background-clip:padding-box;background-position:50%;background-size:100% 100%}`,
			discordDesc: `.inv-desc{font-weight:700;margin:0;margin-bottom:12px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;color:#b9bbbe;text-transform:uppercase;font-size:12px;line-height:12px;flex:1}`,
			discordName: `.guild-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:20px;align-items:center;display:flex;color:#FFF;font-weight:700}`,
			discordNameHover: `.guild-name:hover{cursor:pointer;text-decoration:underline}`,
			discordBtn: `.d-button{align-self:center;margin-left:10px;margin-top:4px;white-space:nowrap;flex:0 0 auto;position:relative;display:flex;justify-content:center;align-items:center;border-radius:3px;border:none;font-size:14px;font-weight:500;line-height:20px;height:43px;padding:2px 20px;user-select:none;transition:background-color .1s ease,color .1s ease;color:#FFF;background:#4B8;cursor:pointer}`,
			discordBtnHover: `.d-button:hover{background:#3A7;}`,
			discordBtnLabel: `.d-button-label{font-weight:500;color:white;text-shadow: 2px 2px #000;}`,
			discordActive: `.d-button:active{background:#396}`,
			discordInvDest: `.inviteDestination{margin:0}`,
			discordDetail: `.guildDetail{margin:0;font-size:14px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;color:#b9bbbe;line-height:16px}`,
			discordStatusCounts: `.statusCounts{display:flex;-webkit-box-align:center;align-items:center;font-weight:600}`,
			discordStatus: `.status{display:block;margin-right:4px;width:8px;height:8px;border-radius:50%;flex:0 0 auto;font-style:italic}`,
			discordStatusOnline: `.statusOnline{background:#43b581}`,
			discordStatusOffline: `.statusOffline{background:#747f8d}`,
			discordCount: `.count-30T-5k{-webkit-box-flex:0;flex:0 1 auto;margin-right:8px;color:#b9bbbe;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}`,
		}, style = document.createElement('style'); style.type = 'text/css'; utils.head.appendChild(style);
		Object.entries(css).forEach(([name, rule], index) => {
			style.appendChild(document.createTextNode(rule));
		})

	}
	eventHandlers() {
		window.addEventListener('load', (event) => {
			console.log('page is fully loaded');
			
			this.stylesheets();

			utils.waitFor(() => document.querySelector('#instructionsUpdate'), 5e3).then(target => {
				if(!target)return console.error('Could not get instructions update');
				utils.createObserver(target, 'style', target => {
					if (this.settings.autoFindNew.val) {
						if (['Kicked', 'Banned', 'Disconnected', 'Error', 'Game is full'].some(text => target && target.innerHTML.includes(text))) {
							location = document.location.origin;
						}
					}
				});
			})

			window.addEventListener('keyup', event =>{
				if (this.downKeys.has(event.code)) this.downKeys.delete(event.code)
			});
			window.addEventListener('keydown', event =>{
				if ('INPUT' == document.activeElement.tagName) return;
				switch (event.code) {
					case 'F1':
						event.preventDefault();
						this.toggleMenu();
						break;

					case 'NumpadSubtract':
						document.exitPointerLock();
						console.dir(window)
						console.dir(this)
						break;
					default:
						if (!this.downKeys.has(event.code)) this.downKeys.add(event.code);
						break;
				}
			});
		});
	}
	getD3D(x1, y1, z1, x2, y2, z2) {
		let dx = x1 - x2;
		let dy = y1 - y2;
		let dz = z1 - z2;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	getAngleDst(a, b) {
		return Math.atan2(Math.sin(b - a), Math.cos(a - b));
	}

	getXDire(x1, y1, z1, x2, y2, z2) {
		let h = Math.abs(y1 - y2);
		let dst = this.getD3D(x1, y1, z1, x2, y2, z2);
		return (Math.asin(h / dst) * ((y1 > y2)?-1:1));
	}

	getDir(x1, y1, x2, y2) {
		return Math.atan2(y1 - y2, x1 - x2);
	}

	getDistance(x1, y1, x2, y2) {
		return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
	}

	containsPoint(point) {
		let planes = this.renderer.frustum.planes;
		for (let i = 0; i < 6; i ++) {
			if (planes[i].distanceToPoint(point) < 0) {
				return false;
			}
		}
		return true;
	}

	getCanSee(from, toX, toY, toZ, boxSize) {
		if (!from) return 0;
		boxSize = boxSize||0;
		for (let obj, dist = this.getD3D(from.x, from.y, from.z, toX, toY, toZ),
			 xDr = this.getDir(from.z, from.x, toZ, toX),
			 yDr = this.getDir(this.getDistance(from.x, from.z, toX, toZ), toY, 0, from.y),
			 dx = 1 / (dist * Math.sin(xDr - Math.PI) * Math.cos(yDr)), dz = 1 / (dist * Math.cos(xDr - Math.PI) * Math.cos(yDr)),
			 dy = 1 / (dist * Math.sin(yDr)), yOffset = from.y + (from.height || 0) - this.consts.cameraHeight,
			 aa = 0; aa < this.game.map.manager.objects.length; ++aa) {
			if (!(obj = this.game.map.manager.objects[aa]).noShoot && obj.active && !obj.transparent && (!this.settings.wallPenetrate.val || (!obj.penetrable || !this.me.weapon.pierce))) {
				let tmpDst = this.lineInRect(from.x, from.z, yOffset, dx, dz, dy, obj.x - Math.max(0, obj.width - boxSize), obj.z - Math.max(0, obj.length - boxSize), obj.y - Math.max(0, obj.height - boxSize), obj.x + Math.max(0, obj.width - boxSize), obj.z + Math.max(0, obj.length - boxSize), obj.y + Math.max(0, obj.height - boxSize));
				if (tmpDst && 1 > tmpDst) return tmpDst;
			}
		}

		return null;
	}

	lineInRect(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2) {
		let t1 = (x1 - lx1) * dx;
		let t2 = (x2 - lx1) * dx;
		let t3 = (y1 - ly1) * dy;
		let t4 = (y2 - ly1) * dy;
		let t5 = (z1 - lz1) * dz;
		let t6 = (z2 - lz1) * dz;
		let tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
		let tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
		if (tmax < 0) return false;
		if (tmin > tmax) return false;
		return tmin;
	}

	lookDir(xDire, yDire) {
		xDire = xDire / 1000
		yDire = yDire / 1000
		this.controls.object.rotation.y = yDire
		this.controls[this.vars.pchObjc].rotation.x = xDire;
		this.controls[this.vars.pchObjc].rotation.x = Math.max(-this.consts.halfPI, Math.min(this.consts.halfPI, this.controls[this.vars.pchObjc].rotation.x));
		this.controls.yDr = (this.controls[this.vars.pchObjc].rotation.x % Math.PI).round(3);
		this.controls.xDr = (this.controls.object.rotation.y % Math.PI).round(3);
		this.renderer.camera.updateProjectionMatrix();
		this.renderer.updateFrustum();
	}

	resetLookAt() {
		this.controls.yDr = this.controls[this.vars.pchObjc].rotation.x;
		this.controls.xDr = this.controls.object.rotation.y;
		this.renderer.camera.updateProjectionMatrix();
		this.renderer.updateFrustum();
	}

	world2Screen (position) {
		let pos = position.clone();
		let scaledWidth = this.ctx.canvas.width / this.scale;
		let scaledHeight = this.ctx.canvas.height / this.scale;
		pos.project(this.renderer.camera);
		pos.x = (pos.x + 1) / 2;
		pos.y = (-pos.y + 1) / 2;
		pos.x *= scaledWidth;
		pos.y *= scaledHeight;
		return pos;
	}

	getInView(entity) {
		return null == this.getCanSee(this.me, entity.x, entity.y, entity.z);
	}

	getIsFriendly(entity) {
		return (this.me && this.me.team ? this.me.team : this.me.spectating ? 0x1 : 0x0) == entity.team
	}
};

module.exports = Main;

/***/ }),

/***/ "./utils.js":
/*!******************!*\
  !*** ./utils.js ***!
  \******************/
/***/ ((module) => {



class Utils {
	get head(){
		return document.head || document.getElementsByTagName("head")[0] || document.documentElement;
	}
	isType(item, type){
		return typeof item === type;
	}
	isDefined(object){
		return !this.isType(object, "undefined") && object !== null;
	}
	isURL(str){
		return /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm.test(str);
	}
	objectHas(obj, arr){
		return arr.some(prop => obj.hasOwnProperty(prop));
	}
	genHash(sz){
		return [...Array(sz)].map(_ => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[~~(Math.random()*52)]).join('');
	}
	loadScript(data){
		try {
			var script = null;
			if (this.isType(data, 'string')) {
				if (this.isURL(data)) {
					this.request(data, "text", {cache: "no-store"}).then((str)=>this.loadScript(str));
				} else {
					script = document.createElement("script");
					script.appendChild(document.createTextNode(data));
				}
			} else if (this.isType(data, 'function')) {
				script = document.createElement("script");
				script.textContent = `try {(${data})()}catch(e){console.error(e)}`;
			}
			if (script) this.head.appendChild(script);
		} catch (ex) {console.error(ex)}
		if (script && script.parentNode) script.parentNode.removeChild(script);
		if (script && script.hasAttribute("textContent")) script.removeAttribute("textContent");
	}
	loadStyle(url){
		let link = document.createElement('link');
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = url;
		return this.head.appendChild(link);
	}
	loadFrame(attributes){
		let frame = document.createElement('iframe');
		Object.entries(attributes).forEach(([type, rules], index) => {
			frame.setAttribute(type, ...rules);
		})
		return this.head.appendChild(frame);
	}
	patchData(data, patches){
		for(let name in patches) {
			let object = patches[name];
			let found = object.regex.exec(data);
			if (found) {
				data = data.replace(object.regex, object.patch);
				console.info("Patched ", name);
			} else alert("Failed to Patch " + name);
		}
		return data;
	}
	getData(data, mangled){
		let returnObj = {};
		for(let name in mangled) {
			let object = mangled[name];
			let found = object.regex.exec(data);
			if (object.hasOwnProperty('index')) {
				if (found) {
					object.val = found[object.index];
					console.info("Found ", name, ":", object);
				} else {
					object.val = null;
					alert("Failed to Find " + name);
				}
				Object.defineProperty(returnObj, name, {
					configurable: false,
					value: object.val
				});
			}
		}
		return returnObj;
	}
	saveData(name, data){
		let blob = new Blob([data], {type: 'text/plain'});
		let el = window.document.createElement("a");
		el.href = window.URL.createObjectURL(blob);
		el.download = name;
		window.document.body.appendChild(el);
		el.click();
		window.document.body.removeChild(el);
	}
	createObserver(elm, check, callback, onshow = true){
		return new MutationObserver((mutationsList, observer) => {
			if (check == 'src' || onshow && mutationsList[0].target.style.display == 'block' || !onshow) {
				callback(mutationsList[0].target);
			}
		}).observe(elm, check == 'childList' ? {childList: true} : {attributes: true, attributeFilter: [check]});
	}
	createElement(element, attribute, inner){
		if (!this.isDefined(element)) {
			return null;
		}
		if (!this.isDefined(inner)) {
			inner = "";
		}
		let el = document.createElement(element);
		if (this.isType(attribute, 'object')) {
			for (let key in attribute) {
				el.setAttribute(key, attribute[key]);
			}
		}
		if (!Array.isArray(inner)) {
			inner = [inner];
		}
		for (let i = 0; i < inner.length; i++) {
			if (inner[i].tagName) {
				el.appendChild(inner[i]);
			} else {
				el.appendChild(document.createTextNode(inner[i]));
			}
		}
		return el;
	}
	createButton(name, iconURL, fn, visible){
		visible = visible ? "inherit":"none";
		this.waitFor(_=>document.querySelector("#menuItemContainer")).then(menu => {
			let icon = this.createElement("div",{"class":"menuItemIcon", "style":`background-image:url("${iconURL}");display:inherit;`});
			let title= this.createElement("div",{"class":"menuItemTitle", "style":`display:inherit;`}, name);
			let host = this.createElement("div",{"id":"mainButton", "class":"menuItem", "onmouseenter":"playTick()", "onclick":"showWindow(12)", "style":`display:${visible};`},[icon, title]);
			if (menu) menu.append(host)
		})
	}
	async request(url, type, opt = {}){
		const res = await fetch(url, opt);
		
		if(res.ok)return await res[type]();
		
		console.error('Could not fetch', url);
		
		return '';
		// return this.nin.request(url, type, opt);
	}
	async waitFor(test, timeout_ms = Infinity, doWhile = null){
		let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		return new Promise(async (resolve, reject) => {
			if (typeof timeout_ms != "number") reject("Timeout argument not a number in waitFor(selector, timeout_ms)");
			let result, freq = 100;
			while (result === undefined || result === false || result === null || result.length === 0) {
				if (doWhile && doWhile instanceof Function) doWhile();
				if (timeout_ms % 1e4 < freq) console.log("waiting for: ", test);
				if ((timeout_ms -= freq) < 0) {
					console.error( "Timeout : ", test );
					resolve(false);
					return;
				}
				await sleep(freq);
				result = typeof test === "string" ? Function(test)() : test();
			}
			console.info("Passed : ", test);
			resolve(result);
		});
	}
}

module.exports = Utils;

/***/ }),

/***/ "../sploit/libs/api.js":
/*!*****************************!*\
  !*** ../sploit/libs/api.js ***!
  \*****************************/
/***/ ((module) => {



var window = new Function('return this')();

class API {
	constructor(matchmaker_url, api_url, storage){
		this.matchmaker = matchmaker_url,
		this.api = /*CHANGE*/ false ? 0 : api_url,
		
		this.stacks = new Set();
		
		this.api_v2 = new URL('v2/', this.api);
		
		this.default_storage = {
			get: key => localStorage.getItem('ss' + key),
			set: (key, value) => localStorage.setItem('ss' + key, value),
			default: true,
		};
		
		this.storage = typeof storage == 'object' && storage != null ? storage : this.default_storage;
		
		this.meta = new Promise((resolve, reject) => {
			this.meta_resolve = resolve;
			this.meta_reject = reject;
		});
	}
	observe(){
		this.load = new Promise(resolve => new MutationObserver((muts, observer) => muts.forEach(mut => [...mut.addedNodes].forEach(node => {
			if(node.tagName == 'DIV' && node.id == 'instructionHolder'){
				this.instruction_holder = node;
				
				new MutationObserver(() => this.on_instruct && setTimeout(this.on_instruct, 200)).observe(this.instruction_holder, {
					attributes: true,
					attributeFilter: [ 'style' ],
				});
			}
			
			if(node.tagName == 'SCRIPT' && node.textContent.includes('Yendis Entertainment')){
				node.textContent = '';
				resolve();
			}
		}))).observe(document, { childList: true, subtree: true }));
	}
	has_instruct(...ors){
		var instruction = this.instruction_holder ? this.instruction_holder.textContent.trim().toLowerCase() : '';
		
		return ors.some(check => instruction.includes(check));
	}
	async report_error(where, err){
		if(typeof err != 'object')return;
		
		var body = {
			name: err.name,
			message: err.message,
			stack: err.stack,
			where: where,
		};
		
		if(this.stacks.has(err.stack))return;
		
		console.error('Where:', where, '\nUncaught', err);
		
		this.stacks.add(err.stack);
		
		await this.fetch({
			target: this.api_v2,
			endpoint: 'error',
			data: body,
		});
	}
	async fetch(input){
		if(typeof input != 'object' || input == null)throw new TypeError('Input must be a valid object');
		
		var opts = {
			cache: 'no-store',
			headers: {},
		};
		
		if(input.hasOwnProperty('headers')){
			Object.assign(opts.headers, input.headers);
		}
		
		if(input.hasOwnProperty('data')){
			opts.method = 'POST';
			opts.body = JSON.stringify(input.data);
			opts.headers['content-type'] = 'application/json';
		}
		
		var result = ['text', 'json', 'arrayBuffer'].includes(input.result) ? input.result : 'text';
		
		return await(await fetch(this.resolve(input), opts))[result]();
	}
	resolve(input){
		if(!input.hasOwnProperty('target'))throw new TypeError('Target must be specified');
		
		var url = new URL(input.target);
		
		if(input.hasOwnProperty('endpoint'))url = new URL(input.endpoint, url);
		
		if(typeof input.query == 'object' && input.query != null)url.search = '?' + new URLSearchParams(Object.entries(input.query));
		
		return url;
	}
	async source(){
		await this.meta;
		
		return await this.fetch({
			target: this.api_v2,
			endpoint: 'source',
			result: 'text',
		});
	}
	async show_error(title, message){
		await this.load;
		
		var holder = document.querySelector('#instructionHolder'),
			instructions = document.querySelector('#instructions');
		
		holder.style.display = 'block';
		holder.style.pointerEvents = 'all';
		
		instructions.innerHTML = `<div style='color:#FFF9'>${title}</div><div style='margin-top:10px;font-size:20px;color:#FFF6'>${message}</div>`;
	}
	async token(){
		await this.meta;
		
		return await this.fetch({
			target: this.api_v2,
			endpoint: 'token',
			data: await this.fetch({
				target: this.matchmaker,
				endpoint: 'generate-token',
				headers: {
					'client-key': this.meta.key,
				},
				result: 'json',
			}),
			result: 'json',
		});
	}
	is_host(url, ...hosts){
		return hosts.some(host => url.hostname == host || url.hostname.endsWith('.' + host));
	}
	async license(input_meta, input_key){
		if(this.is_host(location, 'linkvertise.com') && location.pathname.match(/^\/\d+\//))return this.linkvertise();
		else if(!this.is_host(location, 'krunker.io', 'browserfps.com') || location.pathname != '/')return;
		
		var entries = [...new URLSearchParams(location.search).entries()];
		
		if(entries.length == 1 && !entries[0][1]){
			history.replaceState(null, null, '/');
			this.storage.set('tgg', entries[0][0]);
		}
		
		var key = input_key || await this.storage.get('tgg');
		
		var meta = await this.fetch({
			target: this.api_v2,
			endpoint: 'meta',
			data: {
				...input_meta,
				needs_key: true,
				license: key || null,
			},
			result: 'json',
		});
		
		if(meta.error){
			this.show_error(meta.error.title, meta.error.message);
			this.meta_reject();
		}
		
		if(!meta.license)return this.meta_resolve(this.meta = meta);
		
		return location.replace(meta.license);
	}
	linkvertise(){
		var todor,
			todo = new Promise(resolve => todor = resolve),
			before_redir = [],
			redirecting,
			interval = setInterval,
			close_modals = modals => {
				for(var node of document.querySelectorAll('.modal.show .web-close-btn'))node.click();
			};
		
		window.setInterval = (callback, time) => interval(callback, time == 1e3 ? 0 : time);
		
		// navigator.beacon should have been used for impressions
		XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
			apply(target, request, [ method, url, ...args ]){
				try{
					var url = new URL(url, location);
					
					if(url.hostname == 'publisher.linkvertise.com')before_redir.push(new Promise(resolve => request.addEventListener('readystatechange', () => {
						if(request.readyState >= XMLHttpRequest.HEADERS_RECEIVED)resolve();
					})));
				}catch(err){}
				
				return Reflect.apply(target, request, [ method, url, ...args ]);
			}
		});
		
		new MutationObserver(muts => muts.forEach(mut => [...mut.addedNodes].forEach(async node => {
			if(!node.classList)return;
			
			var is_progress = node.tagName == 'A',
				is_access = is_progress && node.textContent.includes('Free Access'),
				is_continue = is_progress && node.textContent.includes('Continue'),
				is_todo = node.classList.contains('todo'),
				is_web = is_todo && node.classList.contains('web');
			
			if(is_access){
				node.click();
				setTimeout(todor, 200);
			}else if(is_todo){
				await todo;
				
				if(is_web)setInterval(close_modals, 50);
				
				node.click();
			}else if(is_continue && !node.clicks){
				node.clicks = true;
				
				node.click();
				
				let interval = setInterval(() => {
					if(redirecting)return clearInterval(interval);
					
					node.click();
				}, 75);
			}
		}))).observe(document, { childList: true, subtree: true });
		
		var on_set = (obj, prop, callback) => {
			if(obj[prop])return callback(obj[prop]);
			
			Object.defineProperty(obj, prop, {
				set(value){
					Object.defineProperty(obj, prop, { value: value, writable: true });
					callback(value);
					return value;
				},
				configurable: true,
			});
		};
		
		Object.defineProperty(Object.prototype, 'linkvertiseService', {
			set(value){
				Object.defineProperty(this, 'linkvertiseService', { value: value, configurable: true });
				
				Object.defineProperty(value, 'vpn', {
					get: _ => false,
					set: _ => _,
					configurable: true,
				});
				
				on_set(this, 'webService', web => web.webCounter = 0);
				
				on_set(this, 'link', () => {
					var oredir = this.redirect;
					
					this.link.type = 'DYNAMIC';
					
					window.open = this.redirect = () => {
						redirecting = true;
						this.link.type = 'DYNAMIC';
						
						Promise.all(before_redir).then(() => oredir.call(this));
					};
				});
				
				on_set(this, 'addonService', addon => {
					var installed = false;
					
					addon.alreadyInstalled = installed;
					addon.addonIsInstalled = () => installed;
					addon.handleAddon = () => {
						installed = true;
						addon.addonState = 'PENDING_USER';
						addon.checkAddon();
					};
				});
				
				on_set(this, 'adblockService', adblock => {
					Object.defineProperty(adblock, 'adblock', { get: _ => false, set: _ => _ });
				});
				
				on_set(this, 'videoService', video => {
					video.addPlayer = () => video.videoState = 'DONE';
				});
				
				on_set(this, 'notificationsService', notif => {
					var level = 'default';
					
					notif.getPermissionLevel = () => level;
					notif.ask = () => {
						level = 'granted';
						notif.linkvertiseService.postAction('notification');
					};
				});
				
				return value;
			},
			configurable: true,
		});
	}
}

module.exports = API;

/***/ }),

/***/ "../sploit/libs/updater.js":
/*!*********************************!*\
  !*** ../sploit/libs/updater.js ***!
  \*********************************/
/***/ ((module) => {



class Updater {
	constructor(script, extracted, show_logs = false){
		this.script = script;
		this.extracted = extracted;
		this.show_logs = show_logs;
		
		this.log('Initialized');
	}
	log(...args){
		if(this.show_logs)console.info('[UPDATER]', ...args);
	}
	warn(...args){
		if(this.show_logs)console.warn('[UPDATER]', ...args);
	}
	parse_headers(script){
		var out = {},
			close = '==/UserScript==',
			header = script.slice(0, script.indexOf(close));
		
		header.replace(/@(\S+)(?: +(.*))?$/gm, (match, label, value) => {
			out[label] = label in out ? [].concat(out[label], value) : value;
		});
		
		return out;
	}
	async update(){
		location.assign(this.script);
	}
	async check(){
		var script = await(await fetch(this.script)).text();
		
		this.log('Latest script fetched from', this.script);
		
		var parsed = this.parse_headers(script),
			latest = new Date(parsed.extracted).getTime();
		
		this.log(parsed);
		
		this.log('Parsed headers:', parsed, '\nCurrent script:', this.extracted, '\nLatest script:', latest);
		
		var will_update = this.extracted < latest;
		
		if(will_update)this.log('Script will update, current script is', latest - this.extracted, ' MS behind latest');
		else this.warn('Script will NOT update');
		
		// if updated, wait 3 minutes
		return will_update;
	}
	watch(callback, interval = 60e3 * 3){
		this.log('Polling at an interval of', interval, 'MS');
		
		var run = async () => {
			if(await this.check())callback();
			else setTimeout(run, interval);
		};
		
		run();
	}
}

module.exports = Updater;

/***/ }),

/***/ "../sploit/libs/utils.js":
/*!*******************************!*\
  !*** ../sploit/libs/utils.js ***!
  \*******************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var vars = __webpack_require__(/*! ./vars */ "../sploit/libs/vars.js");

class Utils {
	constructor(canvas, three, game, world){
		this.canvas = canvas;
		this.three = three;
		this.game = game;
		this.world = world;
		
		this.pi2 = Math.PI * 2;
		this.halfpi = Math.PI / 2;
		// planned mobile client
		this.mobile = [ 'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini' ].some(ua => navigator.userAgent.includes(ua));
	}
	dist_center(pos){
		return Math.hypot((window.innerWidth / 2) - pos.x, (window.innerHeight / 2) - pos.y);
	}
	round(n, r){
		return Math.round(n * Math.pow(10, r)) / Math.pow(10, r);
	}
	is_host(url, ...hosts){
		return hosts.some(host => url.hostname == host || url.hostname.endsWith('.' + host));
	}
	wait_for(check, time){
		return new Promise(resolve => {
			var interval,
				run = () => {
					try{
						if(check()){
							if(interval)clearInterval(interval);
							resolve();
							
							return true;
						}
					}catch(err){console.log(err)}
				};
			
			interval = run() || setInterval(run, time || 50);
		});
	}
	normal_radian(radian){
		radian = radian % this.pi2;
		
		if(radian < 0)radian += this.pi2;
					
		return radian;
	}
	distanceTo(vec1, vec2){
		return Math.hypot(vec1.x - vec2.x, vec1.y - vec2.y, vec1.z - vec2.z);
	}
	applyMatrix4(pos, t){var e=pos.x,n=pos.y,r=pos.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return pos.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,pos.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,pos.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,pos}
	project3d(pos, camera){
		return this.applyMatrix4(this.applyMatrix4(pos, camera.matrixWorldInverse), camera.projectionMatrix);
	}
	update_frustum(){
		this.world.frustum.setFromProjectionMatrix(new this.three.Matrix4().multiplyMatrices(this.world.camera.projectionMatrix, this.world.camera.matrixWorldInverse));
	}
	update_camera(){
		this.world.camera.updateMatrix();
		this.world.camera.updateMatrixWorld();
	}
	pos2d(pos, offset_y = 0){
		if(isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z))return { x: 0, y: 0 };
		
		pos = { x: pos.x, y: pos.y, z: pos.z };
		
		pos.y += offset_y;
		
		this.update_camera();
		
		this.project3d(pos, this.world.camera);
		
		return {
			x: (pos.x + 1) / 2 * this.canvas.width,
			y: (-pos.y + 1) / 2 * this.canvas.height,
		}
	}
	obstructing(player, target, wallbangs, offset = 0){
		var d3d = this.getD3D(player.x, player.y, player.z, target.x, target.y, target.z),
			dir = this.getDir(player.z, player.x, target.z, target.x),
			dist_dir = this.getDir(this.getDistance(player.x, player.z, target.x, target.z), target.y, 0, player.y),
			ad = 1 / (d3d * Math.sin(dir - Math.PI) * Math.cos(dist_dir)),
			ae = 1 / (d3d * Math.cos(dir - Math.PI) * Math.cos(dist_dir)),
			af = 1 / (d3d * Math.sin(dist_dir)),
			view_y = player.y + (player.height || 0) - 1.15; // 1.15 = config.cameraHeight
		
		// iterate through game objects
		for(var ind in this.game.map.manager.objects){
			var obj = this.game.map.manager.objects[ind];
			
			if(!obj.noShoot && obj.active && (wallbangs ? !obj.penetrable : true)){
				var in_rect = this.lineInRect(player.x, player.z, view_y, ad, ae, af, obj.x - Math.max(0, obj.width - offset), obj.z - Math.max(0, obj.length - offset), obj.y - Math.max(0, obj.height - offset), obj.x + Math.max(0, obj.width - offset), obj.z + Math.max(0, obj.length - offset), obj.y + Math.max(0, obj.height - offset));
				
				if(in_rect && 1 > in_rect)return in_rect;
			}
		}
		
		// iterate through game terrain
		if(this.game.map.terrain){
			var al = this.game.map.terrain.raycast(player.x, -player.z, view_y, 1 / ad, -1 / ae, 1 / af);
			if(al)return this.getD3D(player.x, player.y, player.z, al.x, al.z, -al.y);
		}
	}
	getDistance(x1, y1, x2, y2){
		return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
	}
	getD3D(x1, y1, z1, x2, y2, z2){
		var dx = x1 - x2,
			dy = y1 - y2,
			dz = z1 - z2;
		
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}
	getXDire(x1, y1, z1, x2, y2, z2){
		return Math.asin(Math.abs(y1 - y2) / this.getD3D(x1, y1, z1, x2, y2, z2)) * ((y1 > y2) ? -1 : 1);
	}
	getDir(x1, y1, x2, y2){
		return Math.atan2(y1 - y2, x1 - x2)
	}
	lineInRect(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2){
		var t1 = (x1 - lx1) * dx,
			t2 = (x2 - lx1) * dx,
			t3 = (y1 - ly1) * dy,
			t4 = (y2 - ly1) * dy,
			t5 = (z1 - lz1) * dz,
			t6 = (z2 - lz1) * dz,
			tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6)),
			tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
		
		return (tmax < 0 || tmin > tmax) ? false : tmin;
	}
	getAngleDst(a1, a2){
		return Math.atan2(Math.sin(a2 - a1), Math.cos(a1 - a2));
	}
	add_ele(node_name, parent, attributes){
		return Object.assign(parent.appendChild(document.createElement(node_name)), attributes);
	}
	// box = Box3
	box_size(obj, box){
		var vFOV = this.world.camera.fov * Math.PI / 180;
		var h = 2 * Math.tan( vFOV / 2 ) * this.world.camera.position.z;
		var aspect = this.canvas.width / this.canvas.height;
		var w = h * aspect;
		
		return { width: width, height: height};
	}
	box_rect(obj){
		var box = new this.three.Box3().setFromObject(obj),
			center = this.pos2d(box.getCenter()),
			min = this.pos2d(box.min),
			max = this.pos2d(box.max),
			size = { width: max.x - min.x, height: max.y - min.y };
		
		return {
			width: size.width,
			height: size.height,
			x: center.x,
			y: center.y,
			left: center.x - size.width / 2,
			right: center.x + size.width / 2,
			top: center.y - size.height / 2,
			bottom: center.y + size.height / 2,
		};
	}
	contains_point(point){
		for(var ind = 0; ind < 6; ind++)if(this.world.frustum.planes[ind].distanceToPoint(point) < 0)return false;
		return true;
	}
	camera_world(){
		var matrix_copy = this.world.camera.matrixWorld.clone(),
			pos = this.world.camera[vars.getWorldPosition]();
		
		this.world.camera.matrixWorld.copy(matrix_copy);
		this.world.camera.matrixWorldInverse.copy(matrix_copy).invert();
		
		return pos.clone();
	}
	request_frame(callback){
		requestAnimationFrame(callback);
	}
}

module.exports = Utils;

/***/ }),

/***/ "../sploit/libs/vars.js":
/*!******************************!*\
  !*** ../sploit/libs/vars.js ***!
  \******************************/
/***/ ((__unused_webpack_module, exports) => {



/*
Source: https://api.sys32.dev/v1/source

Notes:
	- Versions around 3.9.2 don't have variable randomization
	- Keep regexes updated
*/

var vars = new Map(),
	patches = new Map(),
	add_var = (varn, regex, index) => vars.set(varn, [ regex, index ]),
	add_patch = (regex, replacement) => patches.set(regex, replacement),
	key = '_' + Math.random().toString().substr(2);

add_var('procInputs', /this\.(\w+)=function\(\w+,\w+,\w+,\w+\){this\.recon/, 1);

add_var('isYou', /this\.accid=0,this\.(\w+)=\w+,this\.isPlayer/, 1);

add_var('pchObjc', /0,this\.(\w+)=new \w+\.Object3D,this/, 1);

add_var('aimVal', /this\.(\w+)-=1\/\(this\.weapon\.aimSpd/, 1),

add_var('crouchVal', /this\.(\w+)\+=\w\.crouchSpd\*\w+,1<=this\.\w+/, 1),

add_var('didShoot', /--,\w+\.(\w+)=!0/, 1);

add_var('ammos', /length;for\(\w+=0;\w+<\w+\.(\w+)\.length/, 1);

add_var('weaponIndex', /\.weaponConfig\[\w+]\.secondary&&\(\w+\.(\w+)==\w+/, 1);

add_var('maxHealth', /\.regenDelay,this\.(\w+)=\w+\.mode&&\w+\.mode\.\1/, 1),

add_var('yVel', /\w+\.(\w+)&&\(\w+\.y\+=\w+\.\1\*/, 1);

add_var('mouseDownR', /this\.(\w+)=0,this\.keys=/, 1);

add_var('recoilAnimY', /\.\w+=0,this\.(\w+)=0,this\.\w+=0,this\.\w+=1,this\.slide/, 1),

add_var('objInstances', /lowerBody\),\w+\|\|\w+\.(\w+)\./, 1),

add_var('getWorldPosition', /var \w+=\w+\.camera\.(\w+)\(\);/, 1);

// Nametags
add_patch(/(&&)((\w+)\.cnBSeen)(?=\){if\(\(\w+=\3\.objInstances)/, (match, start, can_see) => `${start}${key}.can_see(${can_see})`);

// Game
add_patch(/(\w+)\.moveObj=func/, (match, game) => `${key}.game(${game}),${match}`);

// World
add_patch(/(\w+)\.backgroundScene=/, (match, world) => `${key}.world(${world}),${match}`);

// ThreeJS
add_patch(/\(\w+,(\w+),\w+\){(?=[a-z ';\.\(\),]+ACESFilmic)/, (match, three) => `${match}${key}.three(${three});`);

// Skins
add_patch(/((?:[a-zA-Z]+(?:\.|(?=\.skins)))+)\.skins(?!=)/g, (match, player) => `${key}.skins(${player})`);

// Socket
add_patch(/(\w+)(\.exports={ahNum:)/, (match, mod, other) => `({set exports(socket){${key}.socket(socket);return ${mod}.exports=socket}})${other}`);

// Input
add_patch(/((\w+\.\w+)\[\2\._push\?'_push':'push']\()(\w+)(\),)/, (match, func, array, input, end) => `${func}${key}.input(${input})${end}`);

// Timer
add_patch(/(\w+\.exports)\.(kickTimer)=([\dex]+)/, (match, object, property, value) => `${key}.timer(${object},"${property}",${value})`);

exports.patch = source => {
	var found = {},
		missing = {};
	
	for(var [ label, [ regex, index ] ] of vars){
		var value = (source.match(regex) || 0)[index];
		
		if(value)exports[label] = found[label] = value;
		else missing[label] = [ regex, index ];
	}
	
	console.log('Found:');
	console.table(found);
	
	console.log('Missing:');
	console.table(missing);
	
	for(var [ input, replacement ] of patches)source = source.replace(input, replacement);
	
	return source;
};

exports.key = key;

// Input keys
/*
[
	controls.getISN(),
	Math.round(delta * game.config.deltaMlt),
	Math.round(1000 * controls.yDr.round(3)),
	Math.round(1000 * xDr.round(3)),
	game.moveLock ? -1 : config.movDirs.indexOf(controls.moveDir),
	controls.mouseDownL || controls.keys[controls.binds.shoot.val] ? 1 : 0,
	controls.mouseDownR || controls.keys[controls.binds.aim.val] ? 1 : 0,
	!Q.moveLock && controls.keys[controls.binds.jump.val] ? 1 : 0,
	controls.keys[controls.binds.reload.val] ? 1 : 0,
	controls.keys[controls.binds.crouch.val] ? 1 : 0,
	controls.scrollToSwap ? controls.scrollDelta * ue.tmp.scrollDir : 0,
	controls.wSwap,
	1 - controls.speedLmt.round(1),
	controls.keys[controls.binds.reset.val] ? 1 : 0,
	controls.keys[controls.binds.interact.val] ? 1 : 0
];
*/

exports.keys = { frame: 0, delta: 1, xdir: 2, ydir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12, speed_limit: 13, reset: 14, interact: 15 };

exports.playerHeight = 11;
exports.cameraHeight = 1.5;
exports.headScale = 2;
exports.armScale = 1.1;
exports.armInset = 0.1;
exports.chestWidth = 2.5;
exports.hitBoxPad = 1;
exports.crouchDst = 1;
exports.recoilMlt = 0.3;
exports.nameOffset = 0.6;
exports.nameOffsetHat = 0.8;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!******************!*\
  !*** ./index.js ***!
  \******************/


var { krunker, updater, api, main } = __webpack_require__(/*! ./consts */ "./consts.js");

if(krunker){
	window.addEventListener('load', () => {
		updater.watch(() => {
			if(confirm('A new Junker version is available, do you wish to update?'))updater.update();
		}, 60e3 * 3);	
	});
	
	var tokenPromise = api.token();
	
	api.source().then(source => {
		main.gameLoad(source, tokenPromise);
		main.createSettings();
		main.gameHooks();
	});
}
})();

/******/ })()
;
