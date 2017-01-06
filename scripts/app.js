'use strict';

var TileTypes = {
    EMPTY: ' ',
    PIKE: 'P',
    CLIFF: 'C',
    MOUNTAIN: 'M',
    FOREST: 'F',
    HOUSE: 'H'
};

var UnitTypes = {
    LYN: 'L',
    BRIGAND: 'B'
};

function Game() {

    this.model = generateMap();

    function generateMap() {
        var tileModel  = [
            'MMHHH  F  MPPPP',
            '  HHH      MMPP',
            '   H         MM',
            '               ',
            '               ',
            '               ',
            '               ',
            'C            F ',
            'C           CF ',
            'C F      CCCC H'
            ]

        var units = [
            {"name": "Lyn", "class": "Lord", "team": "blue", "level": 1,
                "hp": 15, "maxHp": 16, "strength": 4, "skill": 7, "speed": 9, "luck": 5, "defense": 2, "resistance": 0,
                "move": 15, "constitution": 5, "aid": 4,
                "weapon": { "name": "Iron Sword", "type": "sword", "level": "E", "range": 1,
                            "weight": 5, "might": 5, "hit": 90, "critical": 0, "usage": 46,
                            "description": "Regular sword"},
                "items": [{"name": "Vulnerary", "type": "heal", "heal": 10, "quantity": 3},
                          {"name": "Vulnerary", "type": "heal", "heal": 10, "quantity": 3}],
                "position": {"x": 13, "y": 7}},
            {"name": "Brigand", "class": "Brigand", "team": "red", "level": 1,
                "hp": 20, "maxHp": 20, "strength": 5, "skill": 1, "speed": 5, "luck": 0, "defense": 3, "resistance": 0,
                "move": 5, "constitution": 12, "aid": 11,
                "weapon": { "name": "Iron Axe", "type": "axe", "level": "E", "range": 1,
                            "weight": 10, "might": 8, "hit": 75, "critical": 0, "usage": 45,
                            "description": "Regular axe"},
                "position": {"x": 2, "y": 6}},
            {"name": "Batta", "class": "Brigand", "team": "red", "level": 2,
                "hp": 21, "maxHp": 21, "strength": 5, "skill": 1, "speed": 3, "luck": 2, "defense": 3, "resistance": 0,
                "move": 0, "constitution": 10, "aid": 9,
                "weapon": { "name": "Iron Axe", "type": "axe", "level": "E", "range": 1,
                            "weight": 10, "might": 8, "hit": 75, "critical": 0, "usage": 45,
                            "description": "Regular axe"},
                "position": {"x": 3, "y": 2}},
        ];

        return {"width": tileModel[0].length * 16, "tiles": initMapModel(tileModel), "units": units};
    }

    function initMapModel(tileModel) {
        var tiles = [];
        tileModel.forEach(function(line, row) {
            for (var col in line) {
                tiles.push({
                    type: line[col],
                    position: { "x": parseInt(col), "y": row },
                    state: "",
                    defense: 0,
                    evade: 0
                });
            }
        });

        return tiles;
    };
    
    this.model.getTileAt = function(position) {
        var tile = this.tiles.filter(function(tile) {
            return tile.position.x === position.x && 
                   tile.position.y === position.y;
        });
        return tile[0] || false;
    };

    this.model.getUnitAt = function(position) {
        var unit = this.units.filter(function(unit) {
            return unit.position.x === position.x && 
                   unit.position.y === position.y;
        });
        return unit[0] || false;
    }

    this.model.isInRange = function(origin, target, range) {
        var distance = Math.abs(origin.x - target.x) + Math.abs(origin.y - target.y);
        return distance <= range;
    };

    this.model.isMovable = function(tile) {
        return [TileTypes.EMPTY, TileTypes.FOREST, TileTypes.HOUSE, TileTypes.MOUNTAIN].indexOf(tile.type) >= 0;
    }
}
