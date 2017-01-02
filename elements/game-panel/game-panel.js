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
        this.selectTile(e.currentTarget.model);
        this.manageTap(e.currentTarget.model);
    },
    onUnitTap: function (e) {
        var targetTile = this.model.getTileAt(e.currentTarget.model.position);
        if (targetTile) {
            if (targetTile.state != "canAttack") {
                this.selectUnit(e.currentTarget);
                this.selectTile(targetTile);
            }
            this.manageTap(targetTile);
        }
    },
    manageTap: function (tile) {
        var unit = this.model.getUnitAt(tile.position);
        var selectedUnit = (this.selectedUnit ? this.selectedUnit.model : null);
        var selectedTile = (this.selectedTile ? this.selectedTile.model : null);

        if (selectedUnit) {
            if (!unit) {
                if (tile.state == "canMove") {
                    var index = this.model.units.indexOf(selectedUnit);
                    this.set("model.units." + index + ".position", tile.position);

                    var canAttack = false;
                    this.model.tiles.forEach(function (targetTile) {
                        var newState = "";
                        if (this.selectedTile &&
                            this.model.isInRange(tile.position, targetTile.position, selectedUnit.weapon.range)) {
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
                        this.selectUnit();
                        this.selectTile();
                    } else {
                        this.selectTile(tile)
                    }
                }
            } else {
                if (unit == selectedUnit) {
                    this.model.tiles.forEach(function (targetTile) {
                        var newState = "";
                        if (selectedTile && this.model.isInRange(selectedTile.position,
                            targetTile.position, selectedUnit.move)) {
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
                        alert(selectedUnit.name + " attacks " + unit.name + " ! ");
                        this.resetBoard();
                    }
                }
            }
        } else {
            this.resetBoard();
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
    resetBoard: function () {
        this.model.tiles.forEach(function (targetTile) {
            var index = this.model.tiles.indexOf(targetTile);
            this.set("model.tiles." + index + ".state", "");
        }, this);
    }
});