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
                this.selectUnit(e.currentTarget.model);
            }
            this.manageTap(targetTile);
        }
    },
    onUnitMouseOver: function (e) {
        var targetTile = this.model.getTileAt(e.currentTarget.model.position);
        if (targetTile && targetTile.state == "canAttack") {
            this.selectTarget(e.currentTarget.model);
        }
    },
    onUnitMouseOut: function (e) {
        this.selectTarget();
    },
    onItemTap: function (e) {
        var index = 0;
        var selectedUnit = this.selectedUnit;
        if (selectedUnit) {
            var item = selectedUnit.items[index];
            if (item.type == "heal") {
                if (selectedUnit.hp < selectedUnit.maxHp) {
                    console.log(selectedUnit.name + " healed for " + item.heal + "hp");
                    selectedUnit.hp = Math.min(selectedUnit.maxHp, selectedUnit.hp + item.heal);
                    item.quantity -= 1;
                    this.notifyPath("selectedUnit.hp");
                    this.notifyPath("selectedUnit.items." + index + ".quantity");
                } else {
                    console.log(selectedUnit.name + " is full hp");
                }
            }

            if (item.quantity == 0) {
                this.splice("selectedUnit.items", index, 1);
            }
        }
    },
    manageTap: function (tile) {
        var unit = this.model.getUnitAt(tile.position);
        var selectedUnit = this.selectedUnit || null;
        var selectedTarget = this.selectedTarget || null;

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
                            if (!unitOnTile && targetTile.type.canWalk) {
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
                    if (selectedTarget) {
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
    resetBoard: function (tile) {
        this.selectUnit();
        this.selectTarget();
        this.selectTile(tile || null);
        this.model.tiles.forEach(function (targetTile) {
            var index = this.model.tiles.indexOf(targetTile);
            this.set("model.tiles." + index + ".state", "");
        }, this);
    },
    selectTile: function (tile) {
        if (this.selectedTile) {
            this.set("selectedTile.isSelected", false);
        }
        if (tile) {
            this.$.tileSelector.select(tile);
            if (this.selectedTile) {
                this.set("selectedTile.isSelected", true);
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
    selectTarget: function (unit) {
        if (unit) {
            this.prepareFight(unit);
            this.$.targetSelector.select(unit);
        } else {
            this.$.targetSelector.clearSelection();
        }
    },
    prepareFight: function (defender) {
        var attacker = this.selectedUnit;

        var wpnBonus = this.calculateWeaponTriangleBonus(attacker.weapon.type, defender.weapon.type);

        this.calculateFightStats(attacker, wpnBonus);
        this.calculateFightStats(defender, -wpnBonus);
        this.calculateFightStats2(attacker, defender);
        this.calculateFightStats2(defender, attacker);

        this.notifyPath("selectedUnit.hasWpnAdv");
        this.notifyPath("selectedUnit.hasWpnDis");
        this.notifyPath("selectedUnit.damage");
        this.notifyPath("selectedUnit.attacksTwice");
        this.notifyPath("selectedUnit.hit");
        this.notifyPath("selectedUnit.critical");
    },
    calculateFightStats: function (unit, wpnBonus) {
        var tile = this.model.getTileAt(unit.position);

        unit.hasWpnAdv = (wpnBonus == 1 ? true : false);
        unit.hasWpnDis = (wpnBonus == -1 ? true : false);
        unit.attack = unit.strength + (unit.weapon.might + wpnBonus) * 1;
        unit.physicalDefense = tile.type.defense + unit.defense;

        unit.accuracy = unit.weapon.hit + wpnBonus * 15 +
            unit.skill * 2 + unit.luck / 2;
        unit.AS = unit.speed - Math.max(unit.weapon.weight - unit.constitution, 0);
        unit.evade = unit.AS * 2 + unit.luck + tile.type.avoid;
        unit.criticalRate = unit.weapon.critical + unit.skill / 2;
        unit.criticalAvoid = unit.luck;
    },
    calculateFightStats2: function (attacker, defender) {
        attacker.damage = attacker.attack - defender.physicalDefense;
        attacker.attacksTwice = (attacker.AS - defender.AS >= 4);
        attacker.hit = Math.min(Math.floor(attacker.accuracy - defender.evade), 100);
        attacker.critical = Math.floor(attacker.criticalRate - defender.criticalAvoid);
    },
    handleFight: function (attacker, defender) {
        defender.hp -= this.handleFightRound(attacker);
        if (defender.hp > 0) {
            attacker.hp -= this.handleFightRound(defender);
        }

        if (attacker.hp > 0 && defender.hp > 0) {
            if (attacker.attacksTwice) {
                defender.hp -= this.handleFightRound(attacker);
            } else if (defender.attacksTwice) {
                attacker.hp -= this.handleFightRound(defender);
            }
        }

        if (attacker.hp <= 0) {
            this.kill(attacker);
        } else if (defender.hp <= 0) {
            this.kill(defender);
        }
        this.notifyPath("model.units." + this.model.units.indexOf(attacker) + ".hp");
        this.notifyPath("model.units." + this.model.units.indexOf(defender) + ".hp");
    },
    handleFightRound: function (attacker) {
        if (Math.random() * 100 <= attacker.hit) {
            var damage = attacker.damage;
            if (Math.random() * 100 <= attacker.critical) {
                damage = damage * 3;
            }
            console.log(attacker.name + " inflicts " + damage + " damages !")
            return damage;
        } else {
            console.log(attacker.name + " miss !")
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
    },
    kill: function (unit) {
        console.log(unit.name + " is dead.");
        this.splice("model.units", this.model.units.indexOf(unit), 1);
    }
});