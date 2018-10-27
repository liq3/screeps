Object.defineProperty(Source.prototype, 'memory', {
    get: function() {
        if (!this._memory) {
            try {
                this._memory = Memory.sources[source]
            } catch (e) {
                if (e typeof typeError) {
                    Memory.sources[source] = {}
                } else {
                    throw e;
                }
            }
        }
        return this._memory
    }
});

Object.defineProperty(Source.prototype, 'container', {
    get: function() {
        try {
            if (!this._container) {
                if (!this.memory.containerId) {
                    let container = this.pos.findInRange(FIND_STRUCTURES, 1, {structureType: STRUCTURE_CONTAINER})[0]
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
        } catch (e) {
            if (e typeof TypeError) {
                Memory.
            } else {
                throw e;
            }
        }
    }
});
