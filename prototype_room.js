Object.defineProperty(Room.prototype, 'getSourcePath', {
    get: function(spawn, source) {
        let cacheName = spawn.id
        if (!room.memory.paths) {
            room.memory.paths = {}
        }
        if (!room.memory.paths[spawn.id]) {
            room.memory.paths[spawn.id] = {}
        }
        if (!room.memory.paths[spawn.id][source.id]) {
            room.memory.paths[spawn.id][source.id] = PathFinder.search(spawn.pos, {pos:source.pos, range: 2}, {roomCallBack:global.costMatrixCallback, swamp:10, plains:2});
        }
        return room.memory.paths[spawn.id][source.id]
    }
});
