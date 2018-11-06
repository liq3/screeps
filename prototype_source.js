Object.defineProperty(Source.prototype, 'memory', {
    get: function() {
        if (!this._memory) {
            if (!Memory.sources[this.id]) {
                Memory.sources[this.id] = {}
            }
            this._memory = Memory.sources[this.id]
        }
        return this._memory
    }
});

Object.defineProperty(Source.prototype, 'container', {
    get: function() {
        if (!this._container) {
            if (!this.memory.containerId) {
                let container = this.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_CONTAINER}})[0]
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

Object.defineProperty(Source.prototype, 'link', {
    get: function() {
        if (!this._link) {
            if (!this.memory.linkId) {
                let link = this.pos.findInRange(FIND_MY_STRUCTURES, 2, {filter: {structureType: STRUCTURE_LINK}})[0]
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

Object.defineProperty(Source.prototype, 'harvester', {
    get: function() {
        if (!this._harvester) {
            if (!this.memory.harvesterId) {
                let harvester = this.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c=>c.memory.role === 'harvester'})[0]
                if (harvester) {
                    this.memory.harvesterId = harvester.id
                } else {
                    return
                }
            }
            this._harvester = Game.getObjectById(this.memory.harvesterId)
            if (!this._harvester) {
                delete this.memory.harvesterId
            }
        }
        return this._harvester
    }
});
