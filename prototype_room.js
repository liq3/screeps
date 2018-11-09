Room.prototype.getSourcePath =  function(spawn, source) {
	if (!this.memory.paths) {
		this.memory.paths = {}
	}
	if (!this.memory.paths[spawn.id]) {
		this.memory.paths[spawn.id] = {}
	}
	if (!this.memory.paths[spawn.id][source.id]) {
		this.memory.paths[spawn.id][source.id] = PathFinder.search(spawn.pos, {pos:source.pos, range: 2}, {roomCallBack:Empire.costMatrixCallback, swamp:10, plains:2});
	}
	return this.memory.paths[spawn.id][source.id]
}

Object.defineProperty(Room.prototype, 'container', {
	get: function() {
		if (!this._container) {
			if (!this.memory.containerId) {
				this._container = this.find(FIND_STRUCTURES, {filter: s => s.structureType === STRUCTURE_CONTAINER
					&& s.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: {structureType:STRUCTURE_SPAWN}}).length })[0]
				if (this._container) {
					this.memory.containerId = this._container.id
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

Room.prototype.getRoomNames = function() {
	return this.memory.remoteMining ? this.memory.remoteMining.concat(this.name) : [this.name]
}

Room.prototype.getLabs = function() {
	let flag = creep.room.find(FIND_FLAGS).filter(f => f.name.match(/lab/))[0]
	if (flag) {
		let lab1 = flag.pos.lookFor(LOOK_STRUCTURES).filter(s=>s.structureType===STRUCTURE_LAB)[0]
		let lab2 = room.lookForAt(LOOK_STRUCTURES, flag.pos.x+1, flag.pos.y+1).filter(s=>s.structureType===STRUCTURE_LAB)[0]
		let middleLabs = [lab1, lab2]
		let otherLabs = room.find(FIND_MY_STRUCTURES, {filter: {structureType:STRUCTURE_LAB}}).map(s => !s in middleLabs)
		return middleLabs.concat(otherLabs)
	} else {
		return;
	}
}
