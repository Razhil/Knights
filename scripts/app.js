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
        var tileModel  = '' +
            'MMHHH  F  MPPPP' + '\n' +
            '  HHH      MMPP' + '\n' +
            '   H         MM' + '\n' +
            '               ' + '\n' +
            '               ' + '\n' +
            '               ' + '\n' +
            '               ' + '\n' +
            'C            F ' + '\n' +
            'C           CF ' + '\n' +
            'C F      CCCC H' + 
            '';

        var units = [
            {"name": "Lyn", "class": "L", "team": "blue", "move": 5, 
                "weapon": {"type": "sword", "range": 1},
                "position": {"x": 13, "y": 7}},
            {"name": "Brigand", "class": "B", "team": "red", "move": 5, 
                "weapon": {"type": "axe", "range": 1},
                "position": {"x": 2, "y": 6}},
            {"name": "Brigand", "class": "B", "team": "red", "move": 0, 
                "weapon": {"type": "axe", "range": 1},
                "position": {"x": 3, "y": 2}},
        ];

        return {"tiles": initMapModel(tileModel), "units": units};
    }

    function initMapModel(rawTileModel) {
        var tiles = [];
        var tileModel = rawTileModel.split('\n');
        tileModel.forEach(function(line, row) {
            for (var col in line) {
                tiles.push({
                    type: line[col],
                    position: { "x": col-0, "y": row-0 },
                    state: ""
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
