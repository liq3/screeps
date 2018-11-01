Object.defineProperty(StructureController.prototype, 'memory', {
    get: function() {
        if (!this._memory) {
            if (!Memory.rooms[this.room.name].controller) {
                Memory.rooms[this.room.name].controller = {}
            }
            this._memory = Memory.rooms[this.room.name].controller
        }
        return this._memory
    }
});

Object.defineProperty(StructureController.prototype, 'container', {
    get: function() {
        if (!this._container) {
            if (!this.memory.containerId) {
                let container = this.pos.findInRange(FIND_STRUCTURES, 2, {filter: {structureType: STRUCTURE_CONTAINER}})[0]
                if (container) {
                    this.memory.containerId = container.id
                } else {
                    return
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

Object.defineProperty(StructureController.prototype, 'link', {
    get: function() {
        if (!this._link) {
            if (!this.memory.linkId) {
                let link = this.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: {structureType: STRUCTURE_LINK}})[0]
                if (link) {
                    this.memory.linkId = link.id
                } else {
                    return
                }
            }
            this._link = Game.getObjectById(this.memory.linkId)
            if (!this._link) {
                delete this.memory.linkId
            }
        }
        return this._link
    }
});
