Object.defineProperty(Mineral.prototype, 'memory', {
    get: function() {
        if (!this._memory) {
            if (!this.room.memory.mineral) {
                this.room.memory.mineral = {}
            }
            this._memory = this.room.memory.mineral
        }
        return this._memory
    }
});

Object.defineProperty(Mineral.prototype, 'container', {
    get: function() {
        if (!this._container) {
            if (!this.memory.containerId) {
                let container = this.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_CONTAINER}})[0]
                if (container) {
                    this.memory.containerId = container.id
                }
            }
            this._container = Game.getObjectById(this.memory.containerId)
            if (!this._container) {
                delete this.memory.containerId
            }
        }
        return this._container
    }
});
