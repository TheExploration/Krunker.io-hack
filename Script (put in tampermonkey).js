// ==UserScript==
// @name         Krunker Cheats
// @namespace    https://skidlamer.github.io/
// @version      0.1
// @description  try to take over the world!
// @author       SkidLamer
// @match        *krunker.io/*
// @exclude      *krunker.io/social*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/* eslint-disable no-undef, no-caller, no-loop-func */

;((skid, skidStr) => {
    'use strict';
    class Skid {

        constructor() {
            skid = this;
            this.isProxy = Symbol("isProxy");
            this.settings = null;
            this.tabs = ['Render','Weapon','Player','GamePlay','Radio','Dev'];
            this.consts = Object.assign({}, {
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
            });
            this.downKeys = new Set();
            try {
                this.onLoad();
            }
            catch(e) {
                console.error(e);
                console.trace(e.stack);
            }
        }

        onLoad() {
            Object.defineProperties(Object.prototype, {
                OBJLoader: {
                    set(val) {
                        skid.three = this;
                        skid.ray = new skid.three.Raycaster();
                        skid.vec2 = new skid.three.Vector2(0, 0);
                        skid.mesh = new Proxy({}, {
                            get(target, prop){
                                if(!target[prop]) {
                                    target[prop] = new skid.three.MeshBasicMaterial({
                                        transparent: true,
                                        fog: false,
                                        depthTest: false,
                                        color: prop,
                                    });
                                }
                                return target[prop] ;
                            },
                        });
                        this._value = val;
                    },
                    get() {
                        return this._value;
                    }
                },
                canvas: {
                    set(val) {
                        this._value = val;
                    },
                    get() {
                        if (!skid.isDefined(skid.overlay) && skid.objectHas(this, ["healthColE", "healthColT", "dmgColor"])) {
                            skid.overlay = this;
                            this.ctx = skid.overlay.canvas.getContext('2d');
                            this.render = new Proxy(skid.overlay.render, {
                                apply: function(target, that, args) {
                                    return [target.apply(that, args), render.apply(that, args)]
                                }
                            })
                            function render(scale, game, controls, renderer, me) {
                                let width = skid.overlay.canvas.width / scale;
                                let height = skid.overlay.canvas.height / scale;
                                const renderArgs = [scale, game, controls, renderer, me];
                                if (renderArgs) {
                                    if (me) {
                                        if (me.active && me.health) controls.update();
                                        if (me.banned) Object.assign(me, {banned: false});
                                        if (me.isHacker) Object.assign(me, {isHacker: 0});
                                        if (me.kicked) Object.assign(me, {kicked: false});
                                        if (me.kickedByVote) Object.assign(me, {kickedByVote: false});
                                        me.account = Object.assign(me, {premiumT: true});
                                        ["scale", "game", "controls", "renderer", "me"].forEach((item, index)=>{
                                            skid[item] = renderArgs[index];
                                        });

                                        if (!me.procInputs[skid.isProxy]) {
                                            me.procInputs = new Proxy(me.procInputs, {
                                                apply: function(target, that, [input, game, recon, lock]) {
                                                    if (that) skid.onInput(that, input, game, recon, lock)
                                                    return target.apply(that, [input, game, recon, lock]);
                                                },
                                                get: function(target, key) {
                                                    return key === skid.isProxy ? true : Reflect.get(target, key);
                                                },
                                            })
                                        }

                                        skid.overlay.ctx.save();
                                        skid.overlay.ctx.scale(scale, scale);
                                        //main.ctx.clearRect(0, 0, width, height);
                                        skid.onRender();
                                        skid.overlay.ctx.restore();
                                    }
                                }
                            }
                        }
                        return this._value;
                    }
                },
                cnBSeen: {
                    set (val){this.inView=val}, get() {
                        let isEnemy =!skid.isDefined(skid.me)|| !skid.me.team||skid.me.team !=this.team;
                        return this.inView||isEnemy&&skid.settings.showNameTags.val;
                    }
                }
            });

            this.stylesheets();

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
                        console.dir(this)
                        break;
                    default:
                        if (!this.downKeys.has(event.code)) this.downKeys.add(event.code);
                        break;
                }
            });

            this.createSettings();

        }

        // Main Loops

        onRender() {
            for (let iter = 0, length = this.game.players.list.length; iter < length; iter++) {
                let player = skid.game.players.list[iter];
                if (!player || player.isYou || !player.active || !this.isDefined(player.objInstances) ) {
                    continue;
                }

                let isEnemy = !this.me.team || this.me.team != player.team;
                let isRisky = player.isDev || player.isMod || player.isMapMod || player.canGlobalKick || player.canViewReports || player.partnerApp || player.canVerify || player.canTeleport || player.kpdData || player.fakeName || player.level >= 50;

                // Chams
                if (!player.objInstances.visible) {
                    Object.defineProperty(player.objInstances, 'visible', {
                        value: true,
                        writable: false
                    });
                } else {
                    player.objInstances.traverse(obj => {
                        if (obj && obj.type=='Mesh' && obj.hasOwnProperty('material')) {
                            if (!obj.hasOwnProperty('_material')) {
                                obj._material = obj.material;
                            } else {
                                Object.defineProperty(obj, 'material', {
                                    get() {
                                        if (skid.isDefined(skid.mesh) && skid.settings.renderChams.val) {
                                            return skid.mesh[ isEnemy ? isRisky ? "#FFFF00" : skid.settings.rainbowColor.val ? skid.overlay.rainbow.col : skid.settings.chamHostileCol.val||"#ff0000" : skid.settings.chamFriendlyCol.val||"#00ff00"];
                                        }
                                        return this._material;
                                    }, set(val) {return this._material}
                                });
                            }

                            obj.material.wireframe = !!this.settings.renderWireFrame.val;
                        }
                    })
                }
            }
        }

        onInput(me, input, game) {
            const key = {
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
            let isMelee = this.isDefined(me.weapon.melee)&&me.weapon.melee||this.isDefined(me.weapon.canThrow)&&me.weapon.canThrow;
            let ammoLeft = me.ammos[me.weaponIndex];

            // autoReload
            if (this.settings.autoReload.val) {
                if (!isMelee && !ammoLeft) {
                    game.players.reload(me);
                    input[key.reload] = 1;
                }
            }

            //Auto Bhop
            if (this.settings.autoBhop !== "off") {
                if (this.downKeys.has("Space") || this.settings.autoBhop.val == "autoJump" || this.settings.autoBhop.val == "autoSlide") {
                    this.controls.keys[this.controls.binds.jump.val] ^= 1;
                    if (this.controls.keys[this.controls.binds.jump.val]) {
                        this.controls.didPressed[this.controls.binds.jump.val] = 1;
                    }
                    if (this.downKeys.has("Space") || this.settings.autoBhop.val == "autoSlide") {
                        if (me.yVel < -0.03 && me.canSlide) {
                            setTimeout(() => {
                                this.controls.keys[this.controls.binds.crouch.val] = 0;
                            }, me.slideTimer||325);
                            this.controls.keys[this.controls.binds.crouch.val] = 1;
                            this.controls.didPressed[this.controls.binds.crouch.val] = 1;
                        }
                    }
                }
            }

            //Autoaim
            if (this.settings.autoAim.val !== "off") {
                const playerMaps = [];
                this.ray.setFromCamera(this.vec2, this.renderer.fpsCamera);
                let target = null, targets = game.players.list.filter(enemy => {
                    let hostile = undefined !== enemy.objInstances && enemy.objInstances && !enemy.isYou && !this.getIsFriendly(enemy) && enemy.health > 0 && this.getInView(enemy);
                    if (hostile) playerMaps.push( enemy.objInstances );
                    return hostile
                })

                target = targets.sort((p1, p2) => this.getD3D(me.x, me.z, p1.x, p1.z) - this.getD3D(me.x, me.z, p2.x, p2.z)).shift();

                if (target) {
                    let inCast = this.ray.intersectObjects(playerMaps, true).length;
                    let obj = target.objInstances;
                    let pos = obj.position.clone();
                    let yDire = (this.getDir(me.z, me.x, pos.z||target.z, pos.x||target.x) || 0) * 1000;
                    let xDire = ((this.getXDire(me.x, me.y, me.z, pos.x||target.x, pos.y||target.y - target.crouchVal * this.consts.crouchDst + me.crouchVal * this.consts.crouchDst + this.settings.aimOffset.val, pos.z||target.z) || 0) - this.consts.recoilMlt * me.recoilAnimY) * 1000;

                    let vis = pos.clone();
                    vis.y += this.consts.playerHeight + this.consts.nameOffset - (target.crouchVal * this.consts.crouchDst);
                    if (target.hatIndex >= 0) vis.y += this.consts.nameOffsetHat;
                    let dstDiv = Math.max(0.3, (1 - (this.getD3D(me.x, me.y, me.z, vis.x, vis.y, vis.z) / 600)));
                    let fSize = (20 * dstDiv);
                    let visible = (fSize >= 1 && this.containsPoint(vis));

                    if (me.weapon.nAuto && me.didShoot) {
                        input[key.shoot] = 0;
                        input[key.scope] = 0;
                        me.inspecting = false;
                        me.inspectX = 0;
                    }
                    else if (!visible && this.settings.frustrumCheck.val) this.resetLookAt();
                    else if (ammoLeft||isMelee) {
                        switch (this.settings.autoAim.val) {
                            case "quickScope":
                                input[key.scope] = (!visible && this.settings.frustrumCheck.val)?0:1;
                                if (!me.aimVal||me.weapon.noAim) {
                                    if (!me.canThrow||!isMelee) {
                                        this.lookDir(xDire, yDire);
                                        input[key.shoot] = 1;
                                    }
                                    input[key.ydir] = yDire
                                    input[key.xdir] = xDire
                                }
                                break;
                            case "assist": case "easyassist":
                                if (input[key.scope] || this.settings.autoAim.val === "easyassist") {
                                    if (!me.aimDir && visible || this.settings.autoAim.val === "easyassist") {
                                        if (!me.canThrow||!isMelee) {
                                            this.lookDir(xDire, yDire);
                                        }
                                        if (this.settings.autoAim.val === "easyassist" && this.controls.mouseDownR) input[key.scope] = 1;
                                        input[key.ydir] = yDire
                                        input[key.xdir] = xDire
                                    }
                                }
                                break;
                            case "silent":
                                input[key.scope] = (!visible && this.settings.frustrumCheck.val)?0:1;
                                if (!me.aimVal||me.weapon.noAim) {
                                    if (!me.canThrow||!isMelee) input[key.shoot] = 1;
                                } else input[key.scope] = 1;
                                input[key.ydir] = yDire
                                input[key.xdir] = xDire
                                break;
                            case "trigger":
                                if (input[key.scope] && inCast) {
                                    input[key.shoot] = 1;
                                    input[key.ydir] = yDire
                                    input[key.xdir] = xDire
                                }
                                break;
                            case "correction":
                                if (input[key.shoot] == 1) {
                                    input[key.ydir] = yDire
                                    input[key.xdir] = xDire
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
        }

        // GUI

        createSettings() {

            this.settings = {

                // Render
                showNameTags: {
                    tab: "Render",
                    name: "Show NameTags",
                    val: false,
                    html: () => this.generateSetting("checkbox", "showNameTags"),
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
                //Rendering
                showSkidBtn: {
                    tab: "Render",
                    pre: "<hr>",
                    name: "Show Menu Button",
                    val: true,
                    html: () => this.generateSetting("checkbox", "showSkidBtn"),
                    set: (value, init) => {
                        let button = document.getElementById("mainButton");
                        if (!this.isDefined(button)) this.createButton("SKID", "https://d3bzyjrsc4233l.cloudfront.net/company_office/cheat.png", this.toggleMenu, value)
                        this.waitFor(() => document.getElementById("mainButton")).then(button => { button.style.display = value ? "inherit" : "none" })
                    }
                },

                // Weapon

                autoReload: {
                    tab: "Weapon",
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
                    set: (value) => this.waitFor(() => this.renderer).then(renderer => { renderer.adsFovMlt = value })
                },
                weaponTrails: {
                    tab: "Weapon",
                    name: "Weapon Trails",
                    val: false,
                    html: () => this.generateSetting("checkbox", "weaponTrails"),
                    set: (value) => this.waitFor(() => this.me).then(me => { me.weapon.trail = value })
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

                // GamePlay

                //autoActivateNuke: {
                //    tab: "GamePlay",
                //    name: "Auto Activate Nuke",
                //    val: false,
                //    html: () => this.generateSetting("checkbox", "autoActivateNuke"),
               // },

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
                    html: () => this.generateSetting("button", "saveGameJsBtn", { label:"Save", function: `${skidStr}.globalCMD('save gameJS')`}),
                },
            }

            this.waitFor(() => window.windows).then(() => {
                let win = window.windows[11]; win.html = "";
                //win.header = this.genHash(8);
                win.gen = ()=> {
                    let tmpHTML = `<div style="text-align:center;display:block;"> <a href="https://skidlamer.github.io/wp">Krunker Cheats</a> <hr> </div>`;
                    tmpHTML += '<div class="tab">'; this.tabs.forEach(tab => { tmpHTML += `<button class="tablinks" onclick="${skidStr}.tabChange(event, '${tab}')">${tab}</button>` }); tmpHTML +='</div>'
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
            })
        }

        toggleMenu() {
            let lock = document.pointerLockElement || document.mozPointerLockElement;
            if (lock) document.exitPointerLock();
            window.showWindow(12);
            if (this.isDefined(window.SOUND)) window.SOUND.play(`tick_0`,0.1)
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
                    case "save gameJS":
                        this.request("https://sys32.dev/api/v1/source", "text", {cache: "no-store"}).then((data)=>{this.saveData("gameJS.js", data)}); break;
                }
            }
        }

        generateSetting(type, name, extra) {
            switch (type) {
                case 'button':
                    return `<input type="button" name="${type}" id="slid_utilities_${name}" class="settingsBtn" onclick="${extra.function}" value="${extra.label}" style="float:right;width:auto"/>`;
                case 'checkbox':
                    return `<label class="switch"><input type="checkbox" onclick="${skidStr}.setSetting('${name}', this.checked)" ${this.settings[name].val ? 'checked' : ''}><span class="slider"></span></label>`;
                case 'slider':
                    return `<span class='sliderVal' id='slid_utilities_${name}'>${this.settings[name].val}</span><div class='slidecontainer'><input type='range' min='${this.settings[name].min}' max='${this.settings[name].max}' step='${this.settings[name].step}' value='${this.settings[name].val}' class='sliderM' oninput="${skidStr}.setSetting('${name}', this.value)"></div>`
                    case 'select': {
                        let temp = `<select onchange="${skidStr}.setSetting(\x27${name}\x27, this.value)" class="inputGrey2">`;
                        for (let option in extra) {
                            temp += '<option value="' + option + '" ' + (option == this.settings[name].val ? 'selected' : '') + '>' + extra[option] + '</option>';
                        }
                        temp += '</select>';
                        return temp;
                    }
                default:
                    return `<input type="${type}" name="${type}" id="slid_utilities_${name}"\n${'color' == type ? 'style="float:right;margin-top:5px"' : `class="inputGrey2" placeholder="${extra}"`}\nvalue="${this.settings[name].val}" oninput="${skidStr}.setSetting(\x27${name}\x27, this.value)"/>`;
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

        // Functions

        isType(item, type) {
            return typeof item === type;
        }

        isDefined(item) {
            return !this.isType(item, "undefined") && item !== null;
        }

        objectHas(obj, arr) {
            return arr.some(prop => obj.hasOwnProperty(prop));
        }

        isKeyDown(key) {
            return this.downKeys.has(key);
        }

        scriptInject(data) {
            try {
                var script = document.createElement("script");
                script.appendChild(document.createTextNode(data));
                (document.head || document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script);
            } catch (ex) {}
            if (script) {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                script.textContent = "";
            }
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
            }, style = document.createElement('style'); style.type = 'text/css'; (document.head || document.getElementsByTagName("head")[0] || document.documentElement).appendChild(style);
            Object.entries(css).forEach(([name, rule], index) => {
                style.appendChild(document.createTextNode(rule));
            })

        }

        saveData(name, data) {
            let blob = new Blob([data], {type: 'text/plain'});
            let el = window.document.createElement("a");
            el.href = window.URL.createObjectURL(blob);
            el.download = name;
            window.document.body.appendChild(el);
            el.click();
            window.document.body.removeChild(el);
        }

        createElement(element, attribute, inner) {
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

        createButton(name, iconURL, fn, visible) {
            visible = visible ? "inherit":"none";
            this.waitFor(_=>document.querySelector("#menuItemContainer")).then(menu => {
                let icon = this.createElement("div",{"class":"menuItemIcon", "style":`background-image:url("${iconURL}");display:inherit;`});
                let title= this.createElement("div",{"class":"menuItemTitle", "style":`display:inherit;`}, name);
                let host = this.createElement("div",{"id":"mainButton", "class":"menuItem", "onmouseenter":"playTick()", "onclick":"showWindow(12)", "style":`display:${visible};`},[icon, title]);
                if (menu) menu.append(host)
            })
        }

        async request(url, type, opt = {}) {
            const res = await fetch(url, opt);
            if (res.ok) return res[type]();
            return this.request(url, type, opt);
        }

        async waitFor(test, timeout_ms = Infinity, doWhile = null) {
            let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            return new Promise(async (resolve, reject) => {
                if (typeof timeout_ms != "number") reject("Timeout argument not a number in waitFor(selector, timeout_ms)");
                let result, freq = 100;
                while (result === undefined || result === false || result === null || result.length === 0) {
                    if (doWhile && doWhile instanceof Function) doWhile();
                    if (timeout_ms % 1e4 < freq) console.warn("waiting for: ", test);
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

        getInView(entity) {
            return null == this.getCanSee(this.me, entity.x, entity.y, entity.z);
        }

        getIsFriendly(entity) {
            return (this.me && this.me.team ? this.me.team : this.me.spectating ? 0x1 : 0x0) == entity.team
        }

        lookDir(xDire, yDire) {
            xDire = xDire / 1000
            yDire = yDire / 1000
            this.controls.object.rotation.y = yDire
            this.controls.pchObjc.rotation.x = xDire;
            this.controls.pchObjc.rotation.x = Math.max(-this.consts.halfPI, Math.min(this.consts.halfPI, this.controls.pchObjc.rotation.x));
            this.controls.yDr = (this.controls.pchObjc.rotation.x % Math.PI).round(3);
            this.controls.xDr = (this.controls.object.rotation.y % Math.PI).round(3);
            this.renderer.camera.updateProjectionMatrix();
            this.renderer.updateFrustum();
        }

        resetLookAt() {
            this.controls.yDr = this.controls.pchObjc.rotation.x;
            this.controls.xDr = this.controls.object.rotation.y;
            this.renderer.camera.updateProjectionMatrix();
            this.renderer.updateFrustum();
        }
    }

    window[skidStr] = new Skid();

})(null,[...Array(8)].map(_ => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[~~(Math.random()*52)]).join(''));

