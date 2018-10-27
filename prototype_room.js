Object.defineProperty(Room.prototype, 'getSourcePath', {
    get: function(spawn, source) {
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
});
