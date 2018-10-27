Object.defineProperty(StructureSource.prototype, 'container', {
    get: function() {
        if (!this._container) {
            if (!this.memory.containerId) {
                let container = this.pos.findInRange(FIND_STRUCTURES, 1, {structureType: STRUCTURE_CONTAINER})[0]
                if (container) {
                    this.memory.containerId = container.id
                } else {
                    return undefined
                }
            }
            this._container = Game.getObjectById(this.memory.containerId)
            if (!this._container) {
                delete this.memory.containerId
            }
            return this._container
        }
    }
});
