Polymer({
    is: "game-panel",
    properties: {
        model: {
            type: Object,
            value: {}
        }
    },
    ready: function () {
        this.model = new Game().model;
    },
    onTileTap: function (e) {
        this.manageTap(e.currentTarget.model);
    },
    onUnitTap: function (e) {
        var targetTile = this.model.getTileAt(e.currentTarget.model.position);
        if (targetTile) {
            if (targetTile.state != "canAttack") {
                this.selectUnit(e.currentTarget);
            }
            this.manageTap(targetTile);
        }
    },
    manageTap: function (tile) {
        var unit = this.model.getUnitAt(tile.position);
        var selectedUnit = (this.selectedUnit ? this.selectedUnit.model : null);

        if (selectedUnit) {
            if (!unit) {
                if (tile.state == "canMove") {
                    var index = this.model.units.indexOf(selectedUnit);
                    this.set("model.units." + index + ".position", tile.position);

                    var canAttack = false;
                    this.model.tiles.forEach(function (targetTile) {
                        var newState = "";
                        if (this.model.isInRange(tile.position, targetTile.position, selectedUnit.weapon.range)) {
                            var unit = this.model.getUnitAt(targetTile.position);
                            if (unit && unit.team != selectedUnit.team) {
                                newState = "canAttack";
                                canAttack = true;
                            }
                        }

                        var index = this.model.tiles.indexOf(targetTile);
                        this.set("model.tiles." + index + ".state", newState);
                    }, this)

                    if (!canAttack) {
                        this.resetBoard();
                    } else {
                        this.selectTile(tile)
                    }
                }
            } else {
                if (unit == selectedUnit) {
                    this.selectTile(tile);
                    this.model.tiles.forEach(function (targetTile) {
                        var newState = "";
                        if (this.model.isInRange(tile.position, targetTile.position, selectedUnit.move)) {
                            var unitOnTile = this.model.getUnitAt(targetTile.position);
                            if (!unitOnTile && this.model.isMovable(targetTile)) {
                                newState = "canMove";
                            } else {
                                if (unitOnTile && this.model.isInRange(tile.position, targetTile.position, 1) &&
                                    unitOnTile.team != selectedUnit.team) {
                                    newState = "canAttack";
                                } else {
                                    newState = "noMove";
                                }
                            }
                        }
                        var index = this.model.tiles.indexOf(targetTile);
                        this.set("model.tiles." + index + ".state", newState);
                    }, this);
                } else {
                    if (tile.state == "canAttack") {
                        console.log(selectedUnit.name + " attacks " + unit.name + " ! ");
                        this.handleFight(selectedUnit, unit);
                        this.resetBoard();

                    }
                }
            }
        } else {
            this.resetBoard(tile);
        }
    },
    selectTile: function (tile) {
        if (this.selectedTile) {
            this.selectedTile.isSelected = false;
        }
        if (tile) {
            var index = this.model.tiles.indexOf(tile);
            this.$.tileSelector.select(this.querySelector("#tile" + index));
            if (this.selectedTile) {
                this.selectedTile.isSelected = true;
            }
        } else {
            this.$.tileSelector.clearSelection();
        }
    },
    selectUnit: function (unit) {
        if (unit) {
            this.$.unitSelector.select(unit);
        } else {
            this.$.unitSelector.clearSelection();
        }
    },
    resetBoard: function (tile) {
        this.selectUnit();
        this.selectTile(tile || null);
        this.model.tiles.forEach(function (targetTile) {
            var index = this.model.tiles.indexOf(targetTile);
            this.set("model.tiles." + index + ".state", "");
        }, this);
    },
    handleFight: function (attacker, defender) {
        var attackerAS = attacker.speed - Math.max(attacker.weapon.weight - attacker.con, 0);
        var defenderAS = defender.speed - Math.max(defender.weapon.weight - defender.con, 0);

        defender.hp -= this.handleFightRound(attacker, defender);
        if (defender.hp > 0) {
            attacker.hp -= this.handleFightRound(defender, attacker);
        }

        if (attacker.hp > 0 && defender.hp > 0) {
            if (attackerAS - defenderAS >= 4) {
                defender.hp -= this.handleFightRound(attacker, defender);
            } else if (defenderAS - attackerAS >= 4) {
                attacker.hp -= this.handleFightRound(defender, attacker);
            }
        }
        this.notifyPath("model.units." + this.model.units.indexOf(attacker) + ".hp");
        this.notifyPath("model.units." + this.model.units.indexOf(defender) + ".hp");
    },
    handleFightRound: function (attacker, defender) {
        var tile = this.model.getTileAt(defender.position);
        tile.evade = 0;
        tile.def = 0;
        var wpnBonus = this.calculateWeaponTriangleBonus(attacker.weapon.type, defender.weapon.type);
        var accuracy = attacker.weapon.hit + wpnBonus * 15 +
                       attacker.skill * 2 + attacker.luck / 2;
        var defenderAS = defender.speed - Math.max(defender.weapon.weight - defender.con, 0);
        var evade = defenderAS * 2 + defender.luck + tile.evade;
        var hit = accuracy - evade;
        var crit = attacker.weapon.crit + attacker.skill / 2
        if (Math.random() <= hit) {
            var attack = attacker.str + (attacker.weapon.might + wpnBonus) * 1;
            var defense = tile.def + defender.def;
            var dmg = attack - defense;
            console.log(attacker.name + " inflicts " + dmg + " damages !")
            return dmg;
        } else {
            console.log(attacker.name + " inflicts " + 0 + " damage !")
            return 0;
        }
    },
    calculateWeaponTriangleBonus: function (attackWeaponType, defenderWeaponType) {
        var wpnBonus = 0;
        if (attackWeaponType == "sword") {
            if (defenderWeaponType == "axe") {
                wpnBonus = 1;
            } else if (defenderWeaponType == "spear") {
                wpnBonus = -1;
            }
        } else if (attackWeaponType == "axe") {
            if (defenderWeaponType == "spear") {
                wpnBonus = 1;
            } else if (defenderWeaponType == "sword") {
                wpnBonus = -1;
            }
        } else if (attackWeaponType == "spear") {
            if (defenderWeaponType == "sword") {
                wpnBonus = 1;
            } else if (defenderWeaponType == "axe") {
                wpnBonus = -1;
            }
        }
        return wpnBonus;
    }
});