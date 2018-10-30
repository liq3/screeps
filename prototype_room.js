Room.prototype.getSourcePath =  function(spawn, source) {
    if (!this.memory.paths) {
        this.memory.paths = {}
    }
    if (!this.memory.paths[spawn.id]) {
        this.memory.paths[spawn.id] = {}
    }
    if (!this.memory.paths[spawn.id][source.id]) {
        this.memory.paths[spawn.id][source.id] = PathFinder.search(spawn.pos, {pos:source.pos, range: 2}, {roomCallBack:global.costMatrixCallback, swamp:10, plains:2});
    }
    return this.memory.paths[spawn.id][source.id]
}

Object.defineProperty(Room.prototype, 'container', {
    get: function() {
        if (!this._container) {
            if (!this.memory.containerId) {
                this._container = this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_CONTAINER
                    && !s.pos.findInRange(FIND_MY_STRUCTURES, 1, {structureType:STRUCTURE_SPAWN}) })[0]
                if (this._container) {
                    this.memory.containerId = container.id
                }
            } else {
                this._container = Game.getObjectById(this.memory.containerId)
            }
        }
        return this._container
    }
});

Object.defineProperty(Room.prototype, 'mineral', {
    get: function() {
        if (!this._mineral) {
            if (!this.memory.mineralId) {
                this._mineral = this.find(FIND_MINERALS)[0]
                this.memory.mineralId = this._mineral.id
            } else {
                this._mineral = Game.getObjectById(this.memory.mineralId)
            }
        }
        return this._mineral
    }
});
