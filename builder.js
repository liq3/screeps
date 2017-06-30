var gatherEnergy = require("creepGatherEnergy");
module.exports = {

	run: function (creep) {

		if(creep.memory.gathering && creep.carry.energy < creep.carryCapacity) {
			var err = creep.withdraw(Game.spawns.Spawn1.room.storage);
			if (err == ERR_NOT_IN_RANGE) {
				creep.moveTo(Game.spawns.Spawn1.room.storage)
			}
	    } else if (creep.memory.gathering && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.gathering = false;
	    } else if (!creep.memory.gathering && creep.carry.energy == 0) {
	        creep.memory.gathering = true;
	    } else {
	        var target = Game.getObjectById(creep.memory.targetId);
	        if(!target) {
				let possible = {best:1000000, id:null};
				for (let itr of creep.room.find(FIND_STRUCTURES, {filter: s => s.hits < s.hitsMax})) {
					let score = PathFinder.search(creep.pos, {goal:itr.pos, range:3}).cost * 2;
					if (itr.structureType == STRUCTURE_WALL || itr.structureType == STRUCTURE_RAMPART) {
						if (itr.hits > 10000) {
							score += 1000 + itr.hits / 1000;
						} else {
							score -= 100;
						}
					}
					if ((itr.structureType == STRUCTURE_ROAD || itr.structureType == STRUCTURE_CONTAINER) && itr.hits > (itr.hits/2)) {
						score += 100;
					}
					if (score < possible.best) {
						possible.best = score;
						possible.id = itr.id;
					}
				}

				for (let itr of creep.room.find(FIND_CONSTRUCTION_SITES)) {
					let score = PathFinder.search(creep.pos, {goal:itr.pos, range:3}).cost * 2;
					if (itr.structureType == STRUCTURE_WALL || itr.structureType == STRUCTURE_RAMPART) {
						score += 200;
					}
					if (itr.structureType == STRUCTURE_ROAD || itr.structureType == STRUCTURE_CONTAINER) {
						score += 100;
					}
					if (score < possible.best) {
						possible.best = score;
						possible.id = itr.id;
					}
				}

				creep.memory.targetId = possible.id;
				target = Game.getObjectById(possible.id);
				creep.memory.jobType = (target instanceof ConstructionSite) ? 'repair' : 'build';
			}

			var err;
			if(creep.memory.jobType == 'build') {
				err = creep.build(target);
			} else if (creep.memory.jobType == 'repair'){
				err = creep.repair(target);
			}

			if (err == ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
	    }
	}
};
